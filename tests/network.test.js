import test from 'node:test';
import assert from 'node:assert/strict';
import {createTimedFetch} from '../src/network.js';
test('Interrumpe una conexión colgada en lugar de dejar esperando al usuario',async()=>{
 const request=createTimedFetch((_url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true})),20);
 await assert.rejects(request('https://example.invalid'),{name:'TimeoutError'});
});
test('Conserva cancelación del consumidor y respuesta exitosa',async()=>{
 const c=new AbortController();c.abort();
 const request=createTimedFetch(async(_url,{signal})=>{signal.throwIfAborted();return 'ok';});
 await assert.rejects(request('x',{signal:c.signal}),{name:'AbortError'});
 assert.equal(await request('x'),'ok');
});
