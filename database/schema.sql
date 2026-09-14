-- Ejecutar una vez en un proyecto Supabase independiente.
begin;
create table public.encuestadores (
 user_id uuid primary key references auth.users(id),
 codigo text not null unique check(codigo ~ '^E[0-9]{3,}$'),
 rol text not null default 'encuestador' check(rol in ('encuestador','admin')),
 activo boolean not null default true
);
create table public.cuestionarios(version text primary key, definicion jsonb not null);
insert into public.cuestionarios values ('moniquira-2026-09-v1','[{"id":"consentimiento","label":"La participación es voluntaria. No se solicitan nombres ni documentos. Puede abstenerse de responder. ¿Acepta participar?","type":"radio","options":["Sí","No"],"section":0,"required":true},{"id":"filtro","label":"¿Tiene 18 años o más y reside actualmente en Moniquirá?","type":"radio","options":["Sí","No"],"section":0,"required":true},{"id":"p1","label":"1. ¿Cómo califica la gestión del actual alcalde de Moniquirá?","type":"radio","options":["Muy Buena","Buena","Regular","Mala","No sabe / No responde"],"section":1,"required":true},{"id":"p2","label":"2. ¿Si fuera alcalde de Moniquirá qué mejoraría? Solo un aspecto.","type":"text","options":null,"section":1,"required":true,"hint":"Respuesta espontánea. No leer opciones."},{"id":"p3","label":"3. Sin que yo le mencione ningún nombre, ¿qué personas ha escuchado usted que podrían aspirar a la Alcaldía de Moniquirá en 2027?","type":"mentions","options":null,"section":2,"required":true,"hint":"Respuesta espontánea. Hasta cuatro menciones. No leer candidatos."},{"id":"p4_1","label":"Adriana Camacho","type":"select","options":["Favorable","Desfavorable","La conoce, sin opinión","No la conoce","NS/NR"],"section":3,"required":true,"hint":"4. Leer todos los nombres. Una sola opinión por persona."},{"id":"p4_2","label":"Alex Peña","type":"select","options":["Favorable","Desfavorable","La conoce, sin opinión","No la conoce","NS/NR"],"section":3,"required":true,"hint":"4. Leer todos los nombres. Una sola opinión por persona."},{"id":"p4_3","label":"Yoiner Moreno","type":"select","options":["Favorable","Desfavorable","La conoce, sin opinión","No la conoce","NS/NR"],"section":3,"required":true,"hint":"4. Leer todos los nombres. Una sola opinión por persona."},{"id":"p4_4","label":"Clodomiro Ariza","type":"select","options":["Favorable","Desfavorable","La conoce, sin opinión","No la conoce","NS/NR"],"section":3,"required":true,"hint":"4. Leer todos los nombres. Una sola opinión por persona."},{"id":"p4_5","label":"Eliana Mayorga","type":"select","options":["Favorable","Desfavorable","La conoce, sin opinión","No la conoce","NS/NR"],"section":3,"required":true,"hint":"4. Leer todos los nombres. Una sola opinión por persona."},{"id":"p4_6","label":"Luis Carlos Olarte","type":"select","options":["Favorable","Desfavorable","La conoce, sin opinión","No la conoce","NS/NR"],"section":3,"required":true,"hint":"4. Leer todos los nombres. Una sola opinión por persona."},{"id":"p4_7","label":"Alejandro Flores","type":"select","options":["Favorable","Desfavorable","La conoce, sin opinión","No la conoce","NS/NR"],"section":3,"required":true,"hint":"4. Leer todos los nombres. Una sola opinión por persona."},{"id":"p5_tipo","label":"5. Si las elecciones para alcalde de Moniquirá fueran hoy, ¿por cuál de los anteriores candidatos votaría?","type":"radio","options":["Nombre mencionado","Voto en blanco","Ninguno","No sabe todavía","No responde"],"section":4,"required":true,"hint":"Respuesta espontánea. No leer nombres."},{"id":"p5_nombre","label":"Nombre mencionado","type":"text","options":null,"section":4,"required":true,"when":["p5_tipo","Nombre mencionado"],"allowNS":false},{"id":"p6","label":"6. Ahora, suponiendo que las siguientes personas fueran los finalistas a la Alcaldía de Moniquirá, ¿por cuál de ellas votaría usted?","type":"radio","options":["Yoiner Moreno","Clodomiro Ariza","No sabe / No responde","Otro","Ninguno"],"section":4,"required":true,"hint":"Leer todos los nombres con el mismo tono. Una sola opción."},{"id":"p6_otro","label":"Otro: ¿cuál?","type":"text","options":null,"section":4,"required":true,"when":["p6","Otro"],"allowNS":false},{"id":"p7","label":"7. ¿Hay alguna de esas posibles candidaturas por la cual usted definitivamente NO votaría para alcalde de Moniquirá?","type":"select","options":["Adriana Camacho","Alex Peña","Yoiner Moreno","Clodomiro Ariza","Eliana Mayorga","Luis Carlos Olarte","Alejandro Flores","Ninguno","No sabe / No responde"],"section":4,"required":true,"hint":"Marcar una sola opción. Ninguno excluye cualquier nombre."},{"id":"p8","label":"8. ¿Cómo califica la gestión del actual gobernador de Boyacá Carlos Amaya?","type":"radio","options":["Muy Buena","Buena","Regular","Mala","No sabe / No responde"],"section":5,"required":true},{"id":"p9","label":"9. ¿Cómo califica la gestión del actual presidente de Colombia?","type":"radio","options":["Muy Buena","Buena","Regular","Mala","No sabe / No responde"],"section":5,"required":true},{"id":"p10","label":"10. En general, ¿considera que Moniquirá va por buen camino o por mal camino?","type":"radio","options":["Buen camino","Mal camino","No sabe / No responde"],"section":5,"required":true},{"id":"zona","label":"Zona de residencia","type":"radio","options":["Cabecera urbana","Zona rural"],"section":6,"required":true},{"id":"barrio_vereda","label":"Barrio / Vereda","type":"text","options":null,"section":6,"required":true},{"id":"sexo","label":"Sexo","type":"radio","options":["Mujer","Hombre","Otro / Prefiere no responder"],"section":6,"required":true},{"id":"edad","label":"Edad","type":"select","options":["18 a 25 años","26 a 35 años","36 a 55 años","56 años o más"],"section":6,"required":true},{"id":"lugar_aplicacion","label":"Lugar de aplicación (sin dirección personal)","type":"text","options":null,"section":6,"required":true},{"id":"observacion","label":"Observación breve (si aplica)","type":"text","options":null,"section":6,"required":false,"hint":"No registrar nombres, teléfonos ni datos que identifiquen al encuestado."}]'::jsonb);
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
 respuestas,
 respuestas->>'consentimiento' as consentimiento,
 respuestas->>'filtro' as filtro,
 respuestas->>'p1' as p1,
 respuestas->>'p2' as p2,
 respuestas->>'p3' as p3,
 respuestas->>'p4_1' as p4_1,
 respuestas->>'p4_2' as p4_2,
 respuestas->>'p4_3' as p4_3,
 respuestas->>'p4_4' as p4_4,
 respuestas->>'p4_5' as p4_5,
 respuestas->>'p4_6' as p4_6,
 respuestas->>'p4_7' as p4_7,
 respuestas->>'p5_tipo' as p5_tipo,
 respuestas->>'p5_nombre' as p5_nombre,
 respuestas->>'p6' as p6,
 respuestas->>'p6_otro' as p6_otro,
 respuestas->>'p7' as p7,
 respuestas->>'p8' as p8,
 respuestas->>'p9' as p9,
 respuestas->>'p10' as p10,
 respuestas->>'zona' as zona,
 respuestas->>'barrio_vereda' as barrio_vereda,
 respuestas->>'sexo' as sexo,
 respuestas->>'edad' as edad,
 respuestas->>'lugar_aplicacion' as lugar_aplicacion,
 respuestas->>'observacion' as observacion
from public.encuestas;
grant select on public.exportacion_encuestas to authenticated;
revoke all on public.exportacion_encuestas from anon;
commit;
