import {readFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
const env=Object.fromEntries(readFileSync('.env','utf8').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
const db=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const read=await db.from('encuestas').select('id').limit(1);
const write=await db.rpc('guardar_encuesta',{p_client_id:crypto.randomUUID(),p_inicio:new Date().toISOString(),p_respuestas:{},p_zona:'VERIFICACION SIN DATOS',p_finalizar:false,p_version:'moniquira-2026-09-v1'});
if(!read.error||!write.error)throw new Error('El acceso anónimo no está bloqueado.');
if(read.error.code!=='42501'||write.error.code!=='42501')throw new Error(JSON.stringify({read:read.error,write:write.error}));
console.log('Conexión real verificada. Lectura y escritura anónimas bloqueadas por permisos PostgreSQL. No se guardaron registros.');
