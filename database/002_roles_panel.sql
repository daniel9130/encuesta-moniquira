begin;
alter table public.encuestadores add column nombre text not null default '' check(length(nombre)<=100);
create table public.ingresos (
 session_id uuid primary key,
 user_id uuid not null references public.encuestadores(user_id),
 fecha timestamptz not null default clock_timestamp(),
 ultima_actividad timestamptz not null default clock_timestamp()
);
alter table public.ingresos enable row level security;
revoke all on public.ingresos from anon,authenticated;
create index ingresos_usuario on public.ingresos(user_id,fecha desc);
create function public.registrar_ingreso() returns void language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if not exists(select 1 from public.encuestadores where user_id=auth.uid() and activo) then raise exception 'Cuenta no habilitada'; end if;
 sid:=(auth.jwt()->>'session_id')::uuid;
 if sid is null then raise exception 'Sesión no válida'; end if;
 insert into public.ingresos(session_id,user_id) values(sid,auth.uid()) on conflict(session_id) do update set ultima_actividad=clock_timestamp() where public.ingresos.user_id=auth.uid();
end $$;
create function public.panel_actividad() returns jsonb language plpgsql security definer set search_path='' as $$
declare es_admin boolean; equipo jsonb; actividad jsonb;
begin
 select rol='admin' into es_admin from public.encuestadores where user_id=auth.uid() and activo;
 if not found then raise exception 'Cuenta no habilitada'; end if;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.codigo),'[]') into equipo from (
 select e.codigo,e.nombre,e.rol,e.activo,
 (select count(*) from public.encuestas s where s.user_id=e.user_id) as total,
 (select count(*) from public.encuestas s where s.user_id=e.user_id and s.estado='completa') as completas,
 (select count(*) from public.encuestas s where s.user_id=e.user_id and s.fin is null) as borradores,
 (select count(*) from public.encuestas s where s.user_id=e.user_id and s.fin is not null and s.estado='incompleta') as cerradas_incompletas,
 (select count(*) from public.encuestas s where s.user_id=e.user_id and s.estado='completa' and (s.fin at time zone 'America/Bogota')::date=(clock_timestamp() at time zone 'America/Bogota')::date) as completas_hoy,
 (select max(i.fecha) from public.ingresos i where i.user_id=e.user_id) as ultimo_ingreso,
 (select max(i.ultima_actividad) from public.ingresos i where i.user_id=e.user_id) as ultima_actividad
 from public.encuestadores e where es_admin or e.user_id=auth.uid()
 ) t;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.fecha desc),'[]') into actividad from (
 select e.codigo,e.nombre,e.rol,i.fecha,i.ultima_actividad from public.ingresos i join public.encuestadores e on e.user_id=i.user_id
 where es_admin or e.user_id=auth.uid() order by i.fecha desc limit 100
 ) t;
 return jsonb_build_object('equipo',equipo,'ingresos',actividad,'actualizado',clock_timestamp());
end $$;
-- Activa exclusivamente cuentas de encuestador creadas previamente en Supabase Auth.
create function public.habilitar_encuestador(p_codigo text,p_nombre text) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid; codigo_nuevo text:=upper(trim(p_codigo));
begin
 if not exists(select 1 from public.encuestadores where user_id=auth.uid() and rol='admin' and activo) then raise exception 'Solo administrador'; end if;
 if codigo_nuevo is null or codigo_nuevo !~ '^E[0-9]{3,}$' or length(codigo_nuevo)>12 or p_nombre is null or length(trim(p_nombre)) not between 1 and 100 then raise exception 'Código o nombre no válido'; end if;
 select id into uid from auth.users where lower(email)=lower(codigo_nuevo)||'@encuestadores.invalid' and email_confirmed_at is not null;
 if uid is null then raise exception 'Primero cree en Supabase Auth la cuenta % con contraseña y confirmación automática',lower(codigo_nuevo)||'@encuestadores.invalid'; end if;
 if exists(select 1 from public.encuestadores where user_id=uid or encuestadores.codigo=codigo_nuevo) then raise exception 'Cuenta o código ya habilitado'; end if;
 insert into public.encuestadores(user_id,codigo,rol,activo,nombre) values(uid,codigo_nuevo,'encuestador',true,trim(p_nombre));
end $$;
revoke all on function public.registrar_ingreso(),public.panel_actividad(),public.habilitar_encuestador(text,text) from public,anon;
grant execute on function public.registrar_ingreso(),public.panel_actividad(),public.habilitar_encuestador(text,text) to authenticated;
commit;
