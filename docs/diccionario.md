# Diccionario de variables

Una fila por entrevista. Zona horaria de exportación: America/Bogota. Vacío significa no diligenciado o no aplicable; NS/NR es una respuesta explícita. P3 conserva hasta cuatro menciones en un arreglo JSON en la vista SQL.

| Variable | Descripción | Valores / tipo |
|---|---|---|
|id|Identificador asignado por el servidor; ENC-000001|Metadato|
|encuestador|Código autenticado del encuestador; E001|Metadato|
|fecha|Fecha de inicio local; YYYY-MM-DD|Metadato|
|hora_inicio|Hora local de inicio|Metadato|
|hora_fin|Hora local de cierre; vacía en borradores|Metadato|
|duracion_segundos|Tiempo transcurrido; incluye pausas al retomar borradores|Metadato|
|zona_aplicacion|Sector de trabajo asignado; diferente de zona de residencia|Metadato|
|estado|completa o incompleta|Metadato|
|motivo_cierre|no_elegible, no_consentimiento o vacío|Metadato|
|version|Versión del cuestionario|Metadato|
|client_id|UUID de reintento; evita duplicados|Metadato|
|consentimiento|La participación es voluntaria. No se solicitan nombres ni documentos. Puede abstenerse de responder. ¿Acepta participar?|Sí; No|
|filtro|¿Tiene 18 años o más y reside actualmente en Moniquirá?|Sí; No|
|p1|1. ¿Cómo califica la gestión del actual alcalde de Moniquirá?|Muy Buena; Buena; Regular; Mala; No sabe / No responde|
|p2|2. ¿Si fuera alcalde de Moniquirá qué mejoraría? Solo un aspecto.|text|
|p3|3. Sin que yo le mencione ningún nombre, ¿qué personas ha escuchado usted que podrían aspirar a la Alcaldía de Moniquirá en 2027?|mentions|
|p4_1|Adriana Camacho|Favorable; Desfavorable; La conoce, sin opinión; No la conoce; NS/NR|
|p4_2|Alex Peña|Favorable; Desfavorable; La conoce, sin opinión; No la conoce; NS/NR|
|p4_3|Yoiner Moreno|Favorable; Desfavorable; La conoce, sin opinión; No la conoce; NS/NR|
|p4_4|Clodomiro Ariza|Favorable; Desfavorable; La conoce, sin opinión; No la conoce; NS/NR|
|p4_5|Eliana Mayorga|Favorable; Desfavorable; La conoce, sin opinión; No la conoce; NS/NR|
|p4_6|Luis Carlos Olarte|Favorable; Desfavorable; La conoce, sin opinión; No la conoce; NS/NR|
|p4_7|Alejandro Flores|Favorable; Desfavorable; La conoce, sin opinión; No la conoce; NS/NR|
|p5_tipo|5. Si las elecciones para alcalde de Moniquirá fueran hoy, ¿por cuál de los anteriores candidatos votaría?|Nombre mencionado; Voto en blanco; Ninguno; No sabe todavía; No responde|
|p5_nombre|Nombre mencionado|text · solo si p5_tipo = Nombre mencionado|
|p6|6. Ahora, suponiendo que las siguientes personas fueran los finalistas a la Alcaldía de Moniquirá, ¿por cuál de ellas votaría usted?|Yoiner Moreno; Clodomiro Ariza; No sabe / No responde; Otro; Ninguno|
|p6_otro|Otro: ¿cuál?|text · solo si p6 = Otro|
|p7|7. ¿Hay alguna de esas posibles candidaturas por la cual usted definitivamente NO votaría para alcalde de Moniquirá?|Adriana Camacho; Alex Peña; Yoiner Moreno; Clodomiro Ariza; Eliana Mayorga; Luis Carlos Olarte; Alejandro Flores; Ninguno; No sabe / No responde|
|p8|8. ¿Cómo califica la gestión del actual gobernador de Boyacá Carlos Amaya?|Muy Buena; Buena; Regular; Mala; No sabe / No responde|
|p9|9. ¿Cómo califica la gestión del actual presidente de Colombia?|Muy Buena; Buena; Regular; Mala; No sabe / No responde|
|p10|10. En general, ¿considera que Moniquirá va por buen camino o por mal camino?|Buen camino; Mal camino; No sabe / No responde|
|zona|Zona de residencia|Cabecera urbana; Zona rural|
|barrio_vereda|Barrio / Vereda|text|
|sexo|Sexo|Mujer; Hombre; Otro / Prefiere no responder|
|edad|Edad|18 a 25 años; 26 a 35 años; 36 a 55 años; 56 años o más|
|lugar_aplicacion|Lugar de aplicación (sin dirección personal)|text|
|observacion|Observación breve (si aplica)|text|