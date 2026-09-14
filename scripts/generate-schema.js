import {writeFileSync,mkdirSync} from 'node:fs';
import {questions,VERSION,metadata,csvCell,exportCSV} from '../src/questionnaire.js';
mkdirSync('database',{recursive:true});mkdirSync('docs',{recursive:true});mkdirSync('examples',{recursive:true});
const schema=JSON.stringify(questions).replaceAll("'","''");
writeFileSync('database/schema.sql',`-- Ejecutar una vez en un proyecto Supabase independiente.
begin;
create table public.encuestadores (
 user_id uuid primary key references auth.users(id),
 codigo text not null unique check(codigo ~ '^E[0-9]{3,}$'),
 rol text not null default 'encuestador' check(rol in ('encuestador','admin')),
 activo boolean not null default true
);
create table public.cuestionarios(version text primary key, definicion jsonb not null);
insert into public.cuestionarios values ('${VERSION}','${schema}'::jsonb);
create table public.encuestas (
 numero bigint generated always as identity primary key,
 id text generated always as ('ENC-' || lpad(numero::text,greatest(6,length(numero::text)),'0')) stored unique,
 client_id uuid not null unique,
 user_id uuid not null references public.encuestadores(user_id),
 encuestador text not null,
 version text not null references public.cuestionarios(version),
 inicio timestamptz not null,
 recibido timestamptz not null default now(),
 actualizado timestamptz not null default now(),
 fin timestamptz,
 duracion_segundos integer generated always as (extract(epoch from (fin-inicio))::integer) stored,
 zona_aplicacion text not null check(length(zona_aplicacion) between 1 and 150),
 estado text not null check(estado in ('completa','incompleta')),
 motivo_cierre text check(motivo_cierre in ('no_consentimiento','no_elegible')),
 respuestas jsonb not null,
 check(fin is null or fin>=inicio),
 check(estado<>'completa' or (fin is not null and motivo_cierre is null))
);
create index encuestas_usuario on public.encuestas(user_id,numero);
create index encuestas_estado on public.encuestas(estado,inicio);
alter table public.encuestadores enable row level security;
alter table public.cuestionarios enable row level security;
alter table public.encuestas enable row level security;
revoke all on public.encuestadores,public.cuestionarios,public.encuestas from anon,authenticated;
grant select on public.encuestadores,public.encuestas to authenticated;
create policy perfil_propio on public.encuestadores for select to authenticated using(user_id=auth.uid());
create policy leer_autorizadas on public.encuestas for select to authenticated using(
 exists(select 1 from public.encuestadores e where e.user_id=auth.uid() and e.activo and (e.rol='admin' or encuestas.user_id=e.user_id))
);
create function public.guardar_encuesta(p_client_id uuid,p_inicio timestamptz,p_respuestas jsonb,p_zona text,p_finalizar boolean,p_version text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 perfil public.encuestadores%rowtype; registro public.encuestas%rowtype;
 definicion jsonb; pregunta jsonb; valor jsonb; limpio jsonb:='{}';
 clave text; motivo text; requerido boolean; existe boolean; ahora timestamptz:=clock_timestamp();
begin
 select * into perfil from public.encuestadores where user_id=auth.uid() and activo;
 if not found then raise exception 'Encuestador no autorizado'; end if;
 if p_client_id is null or p_finalizar is null or p_inicio is null or p_zona is null or length(trim(p_zona)) not between 1 and 150 then raise exception 'Metadatos incompletos'; end if;
 if p_inicio>ahora+interval '2 minutes' or p_inicio<ahora-interval '30 days' then raise exception 'Revise la fecha y hora del dispositivo'; end if;
 if p_inicio>ahora then p_inicio:=ahora; end if;
 if p_respuestas is null or jsonb_typeof(p_respuestas)<>'object' or octet_length(p_respuestas::text)>40000 then raise exception 'Respuestas no válidas'; end if;
 select c.definicion into definicion from public.cuestionarios c where version=p_version;
 if not found then raise exception 'Versión de cuestionario no válida'; end if;
 if p_respuestas->>'consentimiento'='No' then motivo:='no_consentimiento';
 elsif p_respuestas->>'filtro'='No' then motivo:='no_elegible'; end if;
 for pregunta in select value from jsonb_array_elements(definicion) loop
  clave:=pregunta->>'id';
  if motivo='no_consentimiento' and clave<>'consentimiento' then continue; end if;
  if motivo='no_elegible' and (pregunta->>'section')::integer>0 then continue; end if;
  if pregunta ? 'when' and (p_respuestas->>(pregunta->'when'->>0)) is distinct from (pregunta->'when'->>1) then continue; end if;
  valor:=p_respuestas->clave;
  requerido:=p_finalizar and (pregunta->>'required')::boolean;
  if valor is null or valor='null'::jsonb or valor='""'::jsonb then
   if requerido then raise exception 'Falta respuesta: %',clave; end if;
   continue;
  end if;
  if pregunta->>'type'='mentions' then
   if jsonb_typeof(valor)<>'array' then raise exception 'Menciones no válidas'; end if;
   if jsonb_array_length(valor)>4 or exists(select 1 from jsonb_array_elements(valor) v where jsonb_typeof(v)<>'string' or length(v#>>'{}')>150) then raise exception 'Menciones no válidas'; end if;
   if requerido and not exists(select 1 from jsonb_array_elements_text(valor) v where length(trim(v))>0) then raise exception 'Falta respuesta: %',clave; end if;
  else
   if jsonb_typeof(valor)<>'string' or length(valor#>>'{}')>1000 or (requerido and length(trim(valor#>>'{}'))=0) then raise exception 'Respuesta no válida: %',clave; end if;
   if jsonb_typeof(pregunta->'options')='array' and not ((pregunta->'options') @> jsonb_build_array(valor)) then raise exception 'Opción no válida: %',clave; end if;
  end if;
  limpio:=limpio||jsonb_build_object(clave,valor);
 end loop;
 -- Serializa reintentos del mismo envío; no duplica encuestas con dos clics o mala conexión.
 perform pg_advisory_xact_lock(hashtextextended(p_client_id::text,0));
 select * into registro from public.encuestas where client_id=p_client_id for update;
 existe:=found;
 if existe then
  if registro.user_id<>perfil.user_id then raise exception 'Registro no autorizado'; end if;
  if registro.fin is not null then return jsonb_build_object('id',registro.id,'estado',registro.estado); end if;
  if registro.version<>p_version then raise exception 'No cambie la versión de un borrador'; end if;
  update public.encuestas set respuestas=limpio,zona_aplicacion=trim(p_zona),actualizado=ahora,
   fin=case when p_finalizar then ahora else null end,
   estado=case when p_finalizar and motivo is null then 'completa' else 'incompleta' end,
   motivo_cierre=case when p_finalizar then motivo else null end
   where client_id=p_client_id returning * into registro;
 else
  insert into public.encuestas(client_id,user_id,encuestador,version,inicio,fin,zona_aplicacion,estado,motivo_cierre,respuestas)
  values(p_client_id,perfil.user_id,perfil.codigo,p_version,p_inicio,case when p_finalizar then ahora end,trim(p_zona),
   case when p_finalizar and motivo is null then 'completa' else 'incompleta' end,case when p_finalizar then motivo end,limpio)
  returning * into registro;
 end if;
 return jsonb_build_object('id',registro.id,'estado',registro.estado);
end $$;
revoke all on function public.guardar_encuesta(uuid,timestamptz,jsonb,text,boolean,text) from public,anon;
grant execute on function public.guardar_encuesta(uuid,timestamptz,jsonb,text,boolean,text) to authenticated;
create view public.exportacion_encuestas with (security_invoker=true) as
select numero,id,encuestador, (inicio at time zone 'America/Bogota')::date as fecha,
 (inicio at time zone 'America/Bogota')::time as hora_inicio,
 (fin at time zone 'America/Bogota')::time as hora_fin,duracion_segundos,zona_aplicacion,estado,motivo_cierre,version,client_id,
 respuestas${questions.map(q=>`,\n respuestas->>'${q.id}' as ${q.id}`).join('')}
from public.encuestas;
grant select on public.exportacion_encuestas to authenticated;
revoke all on public.exportacion_encuestas from anon;
commit;
`);
const lines=['# Diccionario de variables','', 'Una fila por entrevista. Zona horaria de exportación: America/Bogota. Vacío significa no diligenciado o no aplicable; NS/NR es una respuesta explícita. P3 conserva hasta cuatro menciones en un arreglo JSON en la vista SQL.','', '| Variable | Descripción | Valores / tipo |','|---|---|---|'];
const meta={id:'Identificador asignado por el servidor; ENC-000001',encuestador:'Código autenticado del encuestador; E001',fecha:'Fecha de inicio local; YYYY-MM-DD',hora_inicio:'Hora local de inicio',hora_fin:'Hora local de cierre; vacía en borradores',duracion_segundos:'Tiempo transcurrido; incluye pausas al retomar borradores',zona_aplicacion:'Sector de trabajo asignado; diferente de zona de residencia',estado:'completa o incompleta',motivo_cierre:'no_elegible, no_consentimiento o vacío',version:'Versión del cuestionario',client_id:'UUID de reintento; evita duplicados'};
for(const h of metadata)lines.push('|'+h+'|'+meta[h]+'|Metadato|');
for(const q of questions)lines.push('|'+q.id+'|'+q.label+'|'+(q.options?.join('; ')||q.type)+(q.when?' · solo si '+q.when.join(' = '):'')+'|');
writeFileSync('docs/diccionario.md',lines.join('\n'));
const sample={id:'ENC-EJEMPLO-000001',encuestador:'E001',fecha:'2026-09-14',hora_inicio:'09:00:00',hora_fin:'09:08:00',duracion_segundos:480,zona_aplicacion:'SECTOR FICTICIO',estado:'completa',version:VERSION,client_id:'00000000-0000-4000-8000-000000000001',respuestas:{}};
for(const q of questions){if(q.when)continue;sample.respuestas[q.id]=q.type==='mentions'?['Mención ficticia']:q.options?q.options.at(-1):'Respuesta ficticia';}sample.respuestas.consentimiento='Sí';sample.respuestas.filtro='Sí';
writeFileSync('examples/encuestas_ejemplo.csv',exportCSV([sample]));
console.log('Esquema, diccionario y CSV de ejemplo generados.');
