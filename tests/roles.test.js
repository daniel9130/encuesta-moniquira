import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {loginIdentity,totals} from '../src/access.js';
test('Acceso por código independiente del correo del administrador',()=>{assert.equal(loginIdentity('encuestador',' E002 '),'e002@encuestadores.invalid');assert.throws(()=>loginIdentity('encuestador','admin@example.org'));assert.equal(loginIdentity('admin',' admin@example.org '),'admin@example.org');assert.equal(totals([{completas:2},{completas:3}]).completas,5);});
test('Panel restringido, sesiones únicas y habilitación limitada a encuestadores',async()=>{
 const pg=new PGlite();
 await pg.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('session_id',current_setting('request.jwt.claim.session_id',true))$$; grant usage on schema auth to authenticated;`);
 await pg.exec(readFileSync('database/schema.sql','utf8'));await pg.exec(readFileSync('database/002_roles_panel.sql','utf8'));
 const admin='11111111-1111-4111-8111-111111111111',worker='22222222-2222-4222-8222-222222222222';
 await pg.exec(`insert into auth.users values('${admin}','admin@example.org',now()),('${worker}','e002@encuestadores.invalid',now()); insert into public.encuestadores(user_id,codigo,rol) values('${admin}','E001','admin');`);
 async function login(id,sid=id){await pg.exec('reset role');await pg.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.session_id',$2,false)",[id,sid]);await pg.exec('set role authenticated');}
 await login(admin);await pg.query("select public.habilitar_encuestador('E002','Campo 2')");await pg.exec('select public.registrar_ingreso();select public.registrar_ingreso()');
 let p=(await pg.query('select public.panel_actividad() as p')).rows[0].p;assert.equal(p.equipo.length,2);assert.equal(p.ingresos.length,1);assert.equal(p.equipo.find(e=>e.codigo==='E002').total,0);
 await login(worker);await pg.exec('select public.registrar_ingreso()');p=(await pg.query('select public.panel_actividad() as p')).rows[0].p;assert.equal(p.equipo.length,1);assert.equal(p.equipo[0].codigo,'E002');assert.equal(p.ingresos.length,1);
 await assert.rejects(()=>pg.query("select public.habilitar_encuestador('E003','Otro')"),/Solo administrador/);
 await assert.rejects(()=>pg.exec('select * from public.ingresos'),/permission denied/);
 await pg.query("select public.guardar_encuesta('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',now(),'{\"consentimiento\":\"No\"}','Sector',true,'moniquira-2026-09-v1')");
 p=(await pg.query('select public.panel_actividad() as p')).rows[0].p;assert.equal(p.equipo[0].cerradas_incompletas,1);assert.equal(p.equipo[0].completas,0);assert.equal(p.equipo[0].borradores,0);
 await login(admin);p=(await pg.query('select public.panel_actividad() as p')).rows[0].p;assert.equal(p.ingresos.length,2);
 await pg.exec(`reset role;update public.encuestadores set activo=false where user_id='${worker}'`);await login(worker);await assert.rejects(()=>pg.query('select public.panel_actividad()'),/Cuenta no habilitada/);
 await pg.exec('reset role;set role anon');await assert.rejects(()=>pg.query('select public.panel_actividad()'),/permission denied/);await pg.close();
});
