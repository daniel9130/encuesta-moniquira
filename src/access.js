export function loginIdentity(role,identity){
 const value=identity.trim();
 if(role==='admin')return value;
 if(!/^E\d{3,}$/i.test(value)||value.length>12)throw new Error('Ingrese un código válido, por ejemplo E002.');
 return value.toLowerCase()+'@encuestadores.invalid';
}
export function totals(equipo){return equipo.reduce((a,e)=>{for(const k of ['total','completas','borradores','cerradas_incompletas','completas_hoy'])a[k]+=Number(e[k]||0);return a;},{total:0,completas:0,borradores:0,cerradas_incompletas:0,completas_hoy:0});}
