begin;
-- Preserve v1 for historical records and existing clients. New submissions use v2.
insert into public.cuestionarios(version,definicion)
select 'moniquira-2026-09-v2',jsonb_agg(jsonb_set(q.value,'{required}','false'::jsonb) order by q.ord)
from public.cuestionarios c cross join lateral jsonb_array_elements(c.definicion) with ordinality q(value,ord)
where c.version='moniquira-2026-09-v1';
alter table public.encuestas drop constraint encuestas_zona_aplicacion_check;
alter table public.encuestas add constraint encuestas_zona_aplicacion_check check(length(zona_aplicacion) between 0 and 150);
create or replace function public.guardar_encuesta(p_client_id uuid,p_inicio timestamptz,p_respuestas jsonb,p_zona text,p_finalizar boolean,p_version text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 perfil public.encuestadores%rowtype; registro public.encuestas%rowtype;
 definicion jsonb; pregunta jsonb; valor jsonb; limpio jsonb:='{}';
 clave text; motivo text; requerido boolean; existe boolean; ahora timestamptz:=clock_timestamp();
begin
 select * into perfil from public.encuestadores where user_id=auth.uid() and activo;
 if not found then raise exception 'Encuestador no autorizado'; end if;
 if p_client_id is null or p_finalizar is null or p_inicio is null or p_zona is null or length(trim(p_zona)) not between 0 and 150 then raise exception 'Metadatos incompletos'; end if;
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
  if registro.version<>p_version and not (registro.version='moniquira-2026-09-v1' and p_version='moniquira-2026-09-v2') then raise exception 'No cambie la versión de un borrador'; end if;
  update public.encuestas set version=p_version,respuestas=limpio,zona_aplicacion=trim(p_zona),actualizado=ahora,
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

commit;
