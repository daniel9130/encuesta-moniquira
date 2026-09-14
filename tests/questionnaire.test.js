import test from 'node:test';
import assert from 'node:assert/strict';
import {questions,validate,cleanAnswers,termination,exportCSV} from '../src/questionnaire.js';
function complete(){const a={};for(const q of questions){if(q.when)continue;a[q.id]=q.type==='mentions'?['Persona ficticia']:q.options?q.options[0]:'Respuesta de prueba';}a.p5_nombre='Persona de prueba';return a;}
test('El cuestionario completo es válido',()=>assert.deepEqual(validate(complete()),{}));
test('Filtro negativo solo requiere datos iniciales',()=>{const a={consentimiento:'Sí',filtro:'No'};assert.deepEqual(validate(a),{});assert.equal(termination(a),'no_elegible');assert.deepEqual(cleanAnswers({...a,p1:'Buena'}),a);});
test('Sin consentimiento no conserva opiniones ni filtro',()=>{const a={consentimiento:'No',filtro:'Sí',p1:'Buena'};assert.deepEqual(cleanAnswers(a),{consentimiento:'No'});assert.deepEqual(validate(a),{});});
test('Cambiar opción elimina texto condicional obsoleto',()=>{const a=cleanAnswers({...complete(),p6:'Ninguno',p6_otro:'Obsoleto',p5_tipo:'No responde'});assert.equal(a.p6_otro,undefined);assert.equal(a.p5_nombre,undefined);});
test('Otro exige especificación',()=>assert.ok(validate({...complete(),p6:'Otro'}).p6_otro));
test('No admite opciones inventadas ni más de cuatro menciones',()=>{assert.ok(validate({...complete(),p1:'Excelente'}).p1);assert.ok(validate({...complete(),p3:['a','b','c','d','e']}).p3);});
test('Exportación escapa comillas, saltos y fórmulas',()=>{const csv=exportCSV([{id:'ENC-000001',respuestas:{p2:'=HYPERLINK("a")',observacion:'uno\ndos'}}]);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'=HYPERLINK(""a"")"'));assert.ok(csv.includes('"uno\ndos"'));});
