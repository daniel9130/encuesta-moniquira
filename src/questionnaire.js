export const VERSION='moniquira-2026-09-v2';
export const candidates=['Adriana Camacho','Alex Peña','Yoiner Moreno','Clodomiro Ariza','Eliana Mayorga','Luis Carlos Olarte','Alejandro Flores'];
export const rating=['Muy Buena','Buena','Regular','Mala','No sabe / No responde'];
export const opinion=['Favorable','Desfavorable','La conoce, sin opinión','No la conoce','NS/NR'];
export const sections=['Inicio','Gestión municipal','Menciones espontáneas','Opinión de aspirantes','Preferencia electoral','Otras gestiones','Clasificación','Revisión'];
const q=(id,label,type,options,section,extra={})=>({id,label,type,options,section,required:false,...extra});
export const questions=[
 q('consentimiento','La participación es voluntaria. No se solicitan nombres ni documentos. Puede abstenerse de responder. ¿Acepta participar?','radio',['Sí','No'],0),
 q('filtro','¿Tiene 18 años o más y reside actualmente en Moniquirá?','radio',['Sí','No'],0),
 q('p1','1. ¿Cómo califica la gestión del actual alcalde de Moniquirá?','radio',rating,1),
 q('p2','2. ¿Si fuera alcalde de Moniquirá qué mejoraría? Solo un aspecto.','text',null,1,{hint:'Respuesta espontánea. No leer opciones.'}),
 q('p3','3. Sin que yo le mencione ningún nombre, ¿qué personas ha escuchado usted que podrían aspirar a la Alcaldía de Moniquirá en 2027?','mentions',null,2,{hint:'Respuesta espontánea. Hasta cuatro menciones. No leer candidatos.'}),
 ...candidates.map((name,i)=>q('p4_'+(i+1),name,'select',opinion,3,{hint:'4. Leer todos los nombres. Una sola opinión por persona.'})),
 q('p5_tipo','5. Si las elecciones para alcalde de Moniquirá fueran hoy, ¿por cuál de los anteriores candidatos votaría?','radio',['Nombre mencionado','Voto en blanco','Ninguno','No sabe todavía','No responde'],4,{hint:'Respuesta espontánea. No leer nombres.'}),
 q('p5_nombre','Nombre mencionado','text',null,4,{when:['p5_tipo','Nombre mencionado'],allowNS:false}),
 q('p6','6. Ahora, suponiendo que las siguientes personas fueran los finalistas a la Alcaldía de Moniquirá, ¿por cuál de ellas votaría usted?','radio',['Yoiner Moreno','Clodomiro Ariza','No sabe / No responde','Otro','Ninguno'],4,{hint:'Leer todos los nombres con el mismo tono. Una sola opción.'}),
 q('p6_otro','Otro: ¿cuál?','text',null,4,{when:['p6','Otro'],allowNS:false}),
 q('p7','7. ¿Hay alguna de esas posibles candidaturas por la cual usted definitivamente NO votaría para alcalde de Moniquirá?','select',[...candidates,'Ninguno','No sabe / No responde'],4,{hint:'Marcar una sola opción. Ninguno excluye cualquier nombre.'}),
 q('p8','8. ¿Cómo califica la gestión del actual gobernador de Boyacá Carlos Amaya?','radio',rating,5),
 q('p9','9. ¿Cómo califica la gestión del actual presidente de Colombia?','radio',rating,5),
 q('p10','10. En general, ¿considera que Moniquirá va por buen camino o por mal camino?','radio',['Buen camino','Mal camino','No sabe / No responde'],5),
 q('zona','Zona de residencia','radio',['Cabecera urbana','Zona rural'],6),
 q('barrio_vereda','Barrio / Vereda','text',null,6),
 q('sexo','Sexo','radio',['Mujer','Hombre','Otro / Prefiere no responder'],6),
 q('edad','Edad','select',['18 a 25 años','26 a 35 años','36 a 55 años','56 años o más'],6),
 q('lugar_aplicacion','Lugar de aplicación (sin dirección personal)','text',null,6),
 q('observacion','Observación breve (si aplica)','text',null,6,{required:false,hint:'No registrar nombres, teléfonos ni datos que identifiquen al encuestado.'})
];
export function visibleQuestions(a){return questions.filter(q=>(!q.when||a[q.when[0]]===q.when[1])&&(q.id==='consentimiento'||a.consentimiento!=='No')&&(q.section===0||a.filtro!=='No'));}
export function cleanAnswers(a){return Object.fromEntries(visibleQuestions(a).filter(q=>a[q.id]!==undefined&&a[q.id]!==''&&!(typeof a[q.id]==='string'&&!a[q.id].trim())&&!(Array.isArray(a[q.id])&&!a[q.id].some(x=>typeof x==='string'&&x.trim()))).map(q=>[q.id,a[q.id]]));}
export function validate(a,section){const errors={};for(const q of visibleQuestions(a).filter(q=>section===undefined||q.section===section)) {const v=a[q.id];if(q.required&&(v===undefined||(typeof v==='string'&&!v.trim())||(Array.isArray(v)&&!v.some(x=>x.trim()))))errors[q.id]='Registre una respuesta para continuar.';else if(v!==undefined&&v!==''){if(q.options&&!q.options.includes(v))errors[q.id]='Seleccione una opción válida.';if(q.type==='mentions'&&(!Array.isArray(v)||v.length>4||v.some(x=>typeof x!=='string'||x.length>150)))errors[q.id]='Máximo cuatro menciones de 150 caracteres.';if(q.type==='text'&&(typeof v!=='string'||v.length>1000))errors[q.id]='Máximo 1.000 caracteres.';}}return errors;}
export function termination(a){return a.consentimiento==='No'?'no_consentimiento':a.filtro==='No'?'no_elegible':null;}
export function csvCell(v){let s=Array.isArray(v)?JSON.stringify(v):String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export const metadata=['id','encuestador','fecha','hora_inicio','hora_fin','duracion_segundos','zona_aplicacion','estado','motivo_cierre','version','client_id'];
export function exportCSV(rows){const headers=[...metadata,...questions.map(q=>q.id)];return '\uFEFF'+[headers,...rows.map(r=>headers.map(h=>r[h]??r.respuestas?.[h]??''))].map(r=>r.map(csvCell).join(',')).join('\r\n');}
