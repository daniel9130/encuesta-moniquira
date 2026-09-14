import React,{useState,useRef,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {db} from './db';
import {VERSION,sections,questions,visibleQuestions,cleanAnswers,validate,termination,exportCSV} from './questionnaire';
import './styles.css';
import './panel.css';
import Dashboard from './Dashboard';
import {loginIdentity} from './access';

function App(){
 const [profile,setProfile]=useState(null),[demo,setDemo]=useState(false),[answers,setAnswers]=useState({}),[step,setStep]=useState(0),[errors,setErrors]=useState({}),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[receipt,setReceipt]=useState(null),[zone,setZone]=useState(''),[drafts,setDrafts]=useState([]);
 const [screen,setScreen]=useState('home'),[loginRole,setLoginRole]=useState(new URLSearchParams(location.search).get('rol')==='admin'?'admin':'encuestador');
 useEffect(()=>{if(!profile||demo)return;const timer=setInterval(()=>{if(document.visibilityState==='visible')db.rpc('registrar_ingreso').then(r=>{if(r.error)setMessage('No se pudo actualizar la actividad. Revisa tu conexión o vuelve a ingresar.');});},60000);return()=>clearInterval(timer);},[profile,demo]);
 const started=useRef(null),clientId=useRef(null),lock=useRef(false),form=useRef(null);
 function begin(){setScreen('survey');started.current=new Date().toISOString();clientId.current=crypto.randomUUID();setAnswers({});setStep(0);setReceipt(null);setErrors({});setMessage('');}
 async function login(e){
 e.preventDefault();if(busy)return;setBusy(true);setMessage('Verificando acceso…');
 try{
  const f=new FormData(e.currentTarget),email=loginIdentity(loginRole,f.get('identity'));
  const {data,error}=await db.auth.signInWithPassword({email,password:f.get('password')});
  if(error)throw new Error(error.code==='invalid_credentials'?'Código/correo o contraseña incorrectos.':'No se pudo conectar al servicio de acceso. Revisa internet y reintenta.');
  setMessage('Abriendo tu panel…');
  const [p,log]=await Promise.all([
   db.from('encuestadores').select('codigo,rol,nombre').eq('user_id',data.user.id).eq('activo',true).single(),
   db.rpc('registrar_ingreso')
  ]);
  if(p.error)throw new Error(p.error.code==='PGRST116'?'Esta cuenta aún no está habilitada. Contacta al administrador.':'No se pudo consultar tu perfil. Revisa internet y reintenta.');
  if(p.data.rol!==loginRole)throw new Error('Esta cuenta pertenece al otro tipo de acceso. Selecciónalo e intenta nuevamente.');
  if(log.error)throw new Error('No se pudo registrar el ingreso. Reintenta o contacta al administrador.');
  setProfile({...p.data,user_id:data.user.id});setScreen('home');setAnswers({});setReceipt(null);setMessage('');
  void loadDrafts(data.user.id);
 }catch(err){setMessage(err.message);if(db)void db.auth.signOut({scope:'local'}).catch(()=>{});}
 finally{setBusy(false);}
 }
 function resume(d){clientId.current=d.client_id;started.current=d.inicio;setAnswers(d.respuestas);setZone(d.zona_aplicacion);setStep(0);setReceipt(null);setErrors({});setScreen('survey');setMessage('Retomando '+d.id);}
 async function home(){setAnswers({});setReceipt(null);setScreen('home');setMessage('');await loadDrafts();}
 async function loadDrafts(userId=profile?.user_id){if(!db||!userId)return;const r=await db.from('encuestas').select('id,client_id,inicio,respuestas,zona_aplicacion').eq('user_id',userId).eq('estado','incompleta').is('fin',null).order('inicio',{ascending:false}).limit(50);if(!r.error)setDrafts(r.data);}
 function update(id,value){setAnswers(a=>cleanAnswers({...a,[id]:value}));setErrors(e=>({...e,[id]:undefined}));}
 function next(e){e.preventDefault();const err=validate(answers,step);if(step===0&&!zone.trim())err.zona_aplicacion='Indique el sector de aplicación.';setErrors(err);if(Object.keys(err).length)return;setStep(termination(answers)?7:step+1);window.scrollTo(0,0);}
 async function save(final){if(lock.current)return;const err=final?validate(answers):{};if(!zone.trim())err.zona_aplicacion='Indique el sector de aplicación.';if(Object.keys(err).length){setErrors(err);setMessage('Revise las preguntas pendientes antes de enviar.');setStep(questions.find(q=>err[q.id])?.section??0);return;}lock.current=true;setBusy(true);setMessage('');const reason=termination(answers);try{if(demo){setReceipt({id:'DEMOSTRACIÓN',estado:final&&!reason?'completa':'incompleta',demo:true});return;}const r=await db.rpc('guardar_encuesta',{p_client_id:clientId.current,p_inicio:started.current,p_respuestas:cleanAnswers(answers),p_zona:zone.trim(),p_finalizar:final,p_version:VERSION});if(r.error)throw r.error;if(final){setReceipt(r.data);setAnswers({});}else {setScreen('home');setMessage('Borrador guardado. Puedes retomarlo desde el panel.');}await loadDrafts();}catch(err){setMessage('No se confirmó el guardado. Mantenga esta pantalla abierta y reintente. '+err.message);}finally{setBusy(false);lock.current=false;}}
 async function download(){setBusy(true);setMessage('');try{let rows=[],last=0;for(;;){const r=await db.from('exportacion_encuestas').select('*').gt('numero',last).order('numero').limit(500);if(r.error)throw r.error;if(!r.data.length)break;rows.push(...r.data);last=r.data.at(-1).numero;}const url=URL.createObjectURL(new Blob([exportCSV(rows)],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='encuestas-moniquira.csv';a.click();URL.revokeObjectURL(url);setMessage(`${rows.length} encuestas exportadas.`);}catch(err){setMessage('No se pudo descargar: '+err.message);}finally{setBusy(false);}}
 async function logout(){if(db)await db.auth.signOut();setProfile(null);setDemo(false);setAnswers({});setDrafts([]);setReceipt(null);setZone('');setMessage('');}
 const qs=visibleQuestions(answers).filter(q=>q.section===step);
 return <><header><div className="brand"><span className="brandmark">✓</span><div>MONIQUIRÁ <small>Percepción ciudadana · 2026</small></div></div><span className="edition">SEPTIEMBRE</span></header><main>
 <div className="eyebrow">ESCUCHAR EL MUNICIPIO</div><h1>Encuesta de percepción ciudadana</h1><p className="intro">Moniquirá, Boyacá <span> / </span> Captura en campo</p>
 {!profile?<section className="card login"><div className="cardtop"><span className="pill">ACCESO DEL EQUIPO</span><h2>Listos para escuchar.</h2><p>Elige tu tipo de acceso para comenzar.</p></div>{db?<><div className="rolepicker" aria-label="Tipo de acceso"><button type="button" className={loginRole==='encuestador'?'':'secondary'} aria-pressed={loginRole==='encuestador'} disabled={busy} onClick={()=>{setLoginRole('encuestador');setMessage('');}}>Encuestador</button><button type="button" className={loginRole==='admin'?'':'secondary'} aria-pressed={loginRole==='admin'} disabled={busy} onClick={()=>{setLoginRole('admin');setMessage('');}}>Administrador</button></div><form key={loginRole} onSubmit={login}><label>{loginRole==='admin'?'Correo del administrador':'Código del encuestador'}<input name="identity" type={loginRole==='admin'?'email':'text'} autoComplete="username" placeholder={loginRole==='admin'?'Tu correo':'E002'} required/></label><label>Contraseña<input name="password" type="password" autoComplete="current-password" required/></label><button disabled={busy}>{busy?'Ingresando…':'Ingresar →'}</button></form><p className="hint">{loginRole==='admin'?'Acceso al seguimiento del equipo y descarga de datos.':'Usa el código y la contraseña que te entregó el administrador.'}</p></>:<div className="notice">La conexión de producción aún no está configurada. La demostración permite revisar el cuestionario y no guarda encuestas.</div>}<button className="secondary" onClick={()=>{setDemo(true);setProfile({codigo:'DEMO',rol:'encuestador'});begin();}}>Explorar demostración</button><div role="alert">{message}</div></section>:<>
 <div className="session"><span><i/> {demo?'DEMOSTRACIÓN · SIN GUARDADO':`${profile.rol==='admin'?'Administrador':'Encuestador'} ${profile.codigo}`}</span><button className="textbutton" onClick={logout}>Salir</button></div>
 {screen==='home'&&!demo?<Dashboard profile={profile} onStart={begin} onResume={resume} drafts={drafts} onDownload={download} busy={busy} message={message}/>:receipt?<section className="card success"><div className="successmark">✓</div><h2>{receipt.demo?'Recorrido de prueba finalizado':'Encuesta registrada'}</h2><p>{receipt.demo?'No se enviaron ni almacenaron datos.':`Identificador: ${receipt.id}`}</p><p>Estado: {receipt.estado}{termination(answers)?' · entrevista cerrada por filtro':''}</p><button onClick={begin}>Iniciar otra encuesta →</button>{!demo&&<button className="secondary" onClick={home}>Volver al panel</button>}</section>:<>
 <nav aria-label="Avance de la encuesta"><div className="progressmeta"><b>{sections[step]}</b><span>Paso {step+1} de {sections.length}</span></div><progress max={sections.length} value={step+1}/></nav>
 <form ref={form} onSubmit={next} className="card survey" noValidate>
 <div className="sectionhead"><span className="stepnumber">{String(step+1).padStart(2,'0')}</span><div><h2>{sections[step]}</h2><p>{step===7?'Verifique el registro antes de enviarlo.':'Lea las preguntas tal como aparecen. Los campos con * son obligatorios.'}</p></div></div>
 {step===0&&<><label className="question">Sector de aplicación *<input value={zone} onChange={e=>setZone(e.target.value)} maxLength={150} placeholder="Sector asignado al encuestador" aria-invalid={!!errors.zona_aplicacion}/>{errors.zona_aplicacion&&<small className="error">{errors.zona_aplicacion}</small>}</label>{drafts.length>0&&<label className="question">Retomar un borrador<select defaultValue="" onChange={e=>{const d=drafts.find(x=>x.client_id===e.target.value);if(d){clientId.current=d.client_id;started.current=d.inicio;setAnswers(d.respuestas);setZone(d.zona_aplicacion);setMessage(`Retomando ${d.id}`);}}}><option value="">Seleccione un borrador</option>{drafts.map(d=><option key={d.client_id} value={d.client_id}>{d.id} · {d.zona_aplicacion}</option>)}</select></label>}<div className="notice">Antes de iniciar: explique el propósito de conocer la opinión ciudadana. No registre nombres, documentos ni teléfonos del entrevistado.</div></>}
 {step===3&&<p className="notice">4. De las anteriores personas, dígame qué opinión tiene de cada una. Lea todos los nombres y marque una sola opción por persona.</p>}
 {qs.map(q=><Question key={q.id} q={q} value={answers[q.id]} onChange={v=>update(q.id,v)} error={errors[q.id]}/>)}
 {step===7&&<>{termination(answers)?<div className="notice">Finalizar entrevista: {termination(answers)==='no_elegible'?'no cumple el filtro de edad y residencia.':'no acepta participar.'} Se registrará como incompleta, con su motivo de cierre.</div>:<p className="notice">Revise las respuestas. Al enviar se asignará el número de encuesta y se confirmará el registro en la base de datos.</p>}<dl><dt>Encuestador</dt><dd>{profile.codigo}</dd><dt>Sector</dt><dd>{zone}</dd>{visibleQuestions(answers).map(q=><React.Fragment key={q.id}><dt>{q.label}</dt><dd>{Array.isArray(answers[q.id])?answers[q.id].filter(Boolean).join(' · '):answers[q.id]||'Sin respuesta'}</dd></React.Fragment>)}</dl></>}
 <div role="alert" className={message?'notice':''}>{message}</div><div className="actions">{step>0&&<button type="button" className="secondary" disabled={busy} onClick={()=>{setStep(termination(answers)?0:step-1);setErrors({});}}>← Anterior</button>}{step<7?<button disabled={busy}>Continuar →</button>:<button type="button" disabled={busy} onClick={()=>save(true)}>{busy?'Enviando…':demo?'Finalizar demostración':'Enviar encuesta ✓'}</button>}</div>
 {!demo&&<button className="textbutton save" type="button" disabled={busy} onClick={()=>save(false)}>Guardar como incompleta y continuar después</button>}
 </form></>}

 </>}
 <footer><span>Encuesta municipal · Septiembre de 2026</span><span>Participación voluntaria</span></footer></main></>;
}
function Question({q,value,onChange,error}){const id=q.id;return <fieldset className="question" aria-describedby={error?id+'-error':undefined}><legend>{q.label}{q.required?' *':''}</legend>{q.hint&&<p className="hint">{q.hint}</p>}
 {q.type==='radio'&&<div className="choices">{q.options.map(o=><label className={value===o?'choice selected':'choice'} key={o}><input type="radio" name={id} value={o} checked={value===o} onChange={()=>onChange(o)}/>{o}</label>)}</div>}
 {q.type==='select'&&<select aria-label={q.label} value={value||''} onChange={e=>onChange(e.target.value)}><option value="">Seleccione una opción</option>{q.options.map(o=><option key={o}>{o}</option>)}</select>}
 {q.type==='text'&&<><textarea aria-label={q.label} maxLength={1000} rows={3} value={value||''} onChange={e=>onChange(e.target.value)} placeholder="Registre la respuesta"/>{q.allowNS!==false&&q.required&&<button type="button" className="textbutton" onClick={()=>onChange('No sabe / No responde')}>No sabe / No responde</button>}</>}
 {q.type==='mentions'&&<>{[0,1,2,3].map(i=><label className="mention" key={i}><span>{i+1}</span><input aria-label={`Mención ${i+1}`} maxLength={150} value={value?.[i]||''} onChange={e=>{const a=Array.from({length:4},(_,j)=>value?.[j]||'');a[i]=e.target.value;onChange(a);}} placeholder={i===0?'Primera persona mencionada':'Otra mención (opcional)'}/></label>)}<button type="button" className="textbutton" onClick={()=>onChange(['No sabe / No responde'])}>No sabe / No responde</button></>}
 {error&&<small id={id+'-error'} className="error" role="alert">{error}</small>}</fieldset>}
createRoot(document.getElementById('root')).render(<App/>);
