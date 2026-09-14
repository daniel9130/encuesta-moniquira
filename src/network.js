export function createTimedFetch(fetcher=fetch,timeoutMs=15000){
 return async (input,init={})=>{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(new DOMException('La conexión tardó demasiado. Revisa internet y reintenta.','TimeoutError')),timeoutMs);
  const signal=init.signal?AbortSignal.any([init.signal,controller.signal]):controller.signal;
  try{return await fetcher(input,{...init,signal});}finally{clearTimeout(timer);}
 };
}
