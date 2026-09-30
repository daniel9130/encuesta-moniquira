import {test as base,expect} from '@playwright/test';

// Install before navigation. Abort and fail on backend/unexpected external requests,
// rather than silently masking an accidental guardar_encuesta call.
const test=base.extend({
 page:async({page,context},use)=>{
  const forbidden=[],errors=[];
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin==='http://127.0.0.1:4173'&&url.pathname.startsWith('/encuesta-moniquira/')&&request.method()==='GET'){
    await route.continue();
   }else if(url.origin==='https://fonts.googleapis.com'&&url.pathname==='/css2'&&request.method()==='GET'){
    // Existing decorative font import: use the app's fallback fonts, never the network.
    await route.fulfill({status:200,contentType:'text/css',body:''});
   }else{
    forbidden.push(`${request.method()} ${url.origin}${url.pathname}`);
    await route.abort('blockedbyclient');
   }
  });
  page.on('pageerror',error=>errors.push(error.message));
  await use(page);
  expect(forbidden,'La demostración no debe contactar ningún backend').toEqual([]);
  expect(errors,'El flujo no debe lanzar errores de JavaScript').toEqual([]);
 }
});

async function start(page){
 await page.goto('./');
 await expect(page.getByRole('heading',{name:'Encuesta de percepción ciudadana'})).toBeVisible();
 await expect(page.getByLabel('Código del encuestador')).toBeVisible();
 await expect(page.getByLabel('Contraseña',{exact:true})).toHaveAttribute('type','password');
 await page.getByRole('button',{name:'Administrador',exact:true}).click();
 await expect(page.getByLabel('Correo del administrador')).toBeVisible();
 await page.getByRole('button',{name:'Encuestador',exact:true}).click();
 await page.getByRole('button',{name:'Explorar demostración'}).click();
 await expect(page.getByText('DEMOSTRACIÓN · SIN GUARDADO',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Guardar como incompleta y continuar después'})).toHaveCount(0);
}
async function next(page,heading){
 await page.getByRole('button',{name:'Continuar →',exact:true}).click();
 await expect(page.getByRole('heading',{name:heading,exact:true})).toBeVisible();
}
function question(page,id){return page.locator('fieldset').filter({has:page.locator(`input[name="${id}"]`)});}
async function finish(page,state){
 await expect(page.getByRole('button',{name:'Enviar encuesta ✓',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Finalizar demostración',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Recorrido de prueba finalizado'})).toBeVisible();
 await expect(page.getByText('No se enviaron ni almacenaron datos.',{exact:true})).toBeVisible();
 await expect(page.getByText(`Estado: ${state}`,{exact:true})).toBeVisible();
}

test('recorre las ocho pantallas, condicionales, revisión y reinicio sin guardar',async({page})=>{
 await start(page);
 await page.getByLabel('Sector de aplicación (opcional)').fill('SECTOR FICTICIO E2E');
 await question(page,'consentimiento').getByRole('radio',{name:'Sí',exact:true}).check();
 await question(page,'filtro').getByRole('radio',{name:'Sí',exact:true}).check();
 await next(page,'Gestión municipal');
 await question(page,'p1').getByRole('radio',{name:'Buena',exact:true}).check();
 await page.getByRole('textbox',{name:/^2\./}).fill('Respuesta ficticia E2E');
 await next(page,'Menciones espontáneas');
 await page.getByLabel('Mención 1',{exact:true}).fill('Persona ficticia E2E');
 await next(page,'Opinión de aspirantes');
 await page.getByLabel('Adriana Camacho',{exact:true}).selectOption('No la conoce');
 await next(page,'Preferencia electoral');
 await expect(page.getByRole('textbox',{name:'Otro: ¿cuál?',exact:true})).toHaveCount(0);
 await question(page,'p6').getByRole('radio',{name:'Otro',exact:true}).check();
 await page.getByRole('textbox',{name:'Otro: ¿cuál?',exact:true}).fill('OPCIÓN DESCARTADA E2E');
 await question(page,'p6').getByRole('radio',{name:'Ninguno',exact:true}).check();
 await expect(page.getByRole('textbox',{name:'Otro: ¿cuál?',exact:true})).toHaveCount(0);
 await question(page,'p6').getByRole('radio',{name:'Otro',exact:true}).check();
 await expect(page.getByRole('textbox',{name:'Otro: ¿cuál?',exact:true})).toHaveValue('');
 await page.getByRole('textbox',{name:'Otro: ¿cuál?',exact:true}).fill('OPCIÓN FICTICIA E2E');
 await next(page,'Otras gestiones');
 await next(page,'Clasificación');
 await page.getByRole('combobox',{name:'Edad',exact:true}).selectOption('26 a 35 años');
 await next(page,'Revisión');
 const review=page.locator('dl');
 for(const text of ['SECTOR FICTICIO E2E','Respuesta ficticia E2E','Persona ficticia E2E','No la conoce','OPCIÓN FICTICIA E2E','26 a 35 años']){
  await expect(review.getByText(text,{exact:true})).toBeVisible();
 }
 await expect(review).not.toContainText('OPCIÓN DESCARTADA E2E');
 await page.getByRole('button',{name:'← Anterior',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Edad',exact:true})).toHaveValue('26 a 35 años');
 await next(page,'Revisión');
 await finish(page,'completa');
 await page.getByRole('button',{name:'Iniciar otra encuesta →',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Inicio',exact:true})).toBeVisible();
 await expect(question(page,'consentimiento').getByRole('radio',{name:'Sí',exact:true})).not.toBeChecked();
 await page.getByRole('button',{name:'Salir',exact:true}).click();
 await expect(page.getByRole('button',{name:'Explorar demostración'})).toBeVisible();
});

test('permite finalizar sin respuestas, según el instrumento v2',async({page})=>{
 await start(page);
 for(const heading of ['Gestión municipal','Menciones espontáneas','Opinión de aspirantes','Preferencia electoral','Otras gestiones','Clasificación','Revisión'])await next(page,heading);
 await expect(page.locator('dl')).toContainText('Sin respuesta');
 await finish(page,'completa');
});

for(const [id,reason] of [['consentimiento','no acepta participar.'],['filtro','no cumple el filtro de edad y residencia.']]){
 test(`cierra como incompleta por ${id} y limpia opiniones anteriores`,async({page})=>{
  await start(page);
  await question(page,'consentimiento').getByRole('radio',{name:'Sí',exact:true}).check();
  await question(page,'filtro').getByRole('radio',{name:'Sí',exact:true}).check();
  await next(page,'Gestión municipal');
  await page.getByRole('textbox',{name:/^2\./}).fill('OPINIÓN QUE DEBE BORRARSE E2E');
  await page.getByRole('button',{name:'← Anterior',exact:true}).click();
  await question(page,id).getByRole('radio',{name:'No',exact:true}).check();
  await next(page,'Revisión');
  await expect(page.getByText(`Finalizar entrevista: ${reason}`,{exact:false})).toBeVisible();
  await expect(page.locator('dl')).not.toContainText('OPINIÓN QUE DEBE BORRARSE E2E');
  await expect(page.locator('dl')).not.toContainText('2. ¿Si fuera alcalde');
  await finish(page,'incompleta · entrevista cerrada por filtro');
 });
}
