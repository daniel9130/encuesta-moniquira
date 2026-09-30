# Verificación del 14 de septiembre de 2026

- Compilación Vite de producción: correcta.
- Pruebas automatizadas: 10 aprobadas, incluidas validaciones del instrumento, condicionales, CSV, permisos del panel y PostgreSQL mediante PGlite.
- Base de prueba: se ejecutó el SQL completo, con roles anónimo y autenticado y tres cuentas ficticias.
- Comprobado: acceso limitado al propietario, lectura global del administrador, bloqueo anónimo, bloqueo de escritura directa, opciones inválidas rechazadas, mismo identificador al cerrar borrador, reintentos sin duplicación y limpieza de opiniones en cierres por filtro o consentimiento.
- Navegador: recorrido completo de demostración, aparición de «Otro: ¿cuál?», campos obligatorios y salto de filtro negativo a cierre.
- Presentación: anchos de prueba 390, 768 y 1366 px; sin desbordamiento horizontal. Inspección visual de controles de campo en móvil.

Se creó el proyecto independiente «Encuesta Moniquira 2026» en Supabase y se ejecutó el esquema completo con resultado satisfactorio. Se configuró la conexión local y en GitHub Actions usando la clave publicable. La comprobación real de la API devuelve el código PostgreSQL 42501 al intentar leer o guardar sin autenticación, como corresponde. No se almacenaron datos en esta comprobación.

La primera cuenta fue creada por el usuario y habilitada como E001, rol administrador. Se ejecutó una transacción de prueba en Supabase bajo el rol PostgreSQL `authenticated` y la identidad de E001: creación de borrador, cierre completo conservando ID, reintento idempotente y consulta de exportación con duración correcta. Todas las comprobaciones pasaron y la transacción se revirtió. La secuencia de identificadores puede conservar un salto por esta prueba; no se reinició.

La migración 002 de roles y seguimiento se aplicó correctamente en Supabase. Una transacción revertida comprobó registrar_ingreso y panel_actividad bajo la identidad del administrador. Las pruebas locales verificaron aislamiento por encuestador, rechazo de acceso anónimo, denegación a cuentas inactivas, sesión única y habilitación exclusiva por administrador.

El panel se revisó en navegador con datos ficticios y cliente de prueba aislado: vistas de administrador y encuestador y botón Iniciar encuesta. La vista de campo a 390 px no desborda la pantalla. Estos datos no se publican ni se guardan en Supabase.

Pendiente verificar ingreso mediante contraseña y envío desde la pantalla pública por el titular; la prueba SQL y el cliente de prueba no sustituyen la comprobación de extremo a extremo del navegador. La primera cuenta de campo requiere que la coordinación defina su contraseña y la habilite. No se han recogido entrevistas reales.

## Actualización del 30 de septiembre de 2026: E2E del flujo público en demostración

Se incorpora Playwright (`playwright.config.js`, `tests/e2e/public-demo.spec.js`) con cuatro escenarios ejecutados en Chromium a 1366 y 390 px: ocho casos de navegador.

- Pantalla pública: controles de acceso de encuestador y administrador y campo de contraseña. No se pulsa Ingresar ni se valida una contraseña.
- Recorrido de las ocho pantallas: respuestas ficticias, revisión de valores, navegación anterior, cierre de demostración, reinicio y salida.
- «Otro: ¿cuál?»: aparición, desaparición y limpieza del texto al cambiar la opción; revisión del valor vigente.
- Instrumento v2: todas las preguntas y el sector son opcionales; se puede finalizar sin respuestas. La mención histórica a campos obligatorios corresponde a la versión anterior.
- Rechazo de consentimiento y filtro negativo: salto a revisión, eliminación de opiniones anteriores y resultado incompleto.
- Confirmación explícita «No se enviaron ni almacenaron datos.» y ausencia del botón de envío real en la demostración.

La suite usa una compilación de producción local con el prefijo `/encuesta-moniquira/`, aislada en `.e2e-dist`. Las variables Supabase se sustituyen por valores ficticios y no se reutiliza un servidor existente. Antes de abrir la página se instala un bloqueo de red que permite exclusivamente GET de archivos bajo ese prefijo en `127.0.0.1:4173`. La hoja decorativa de Google Fonts se sustituye por CSS vacío, sin red, usando las fuentes alternativas del diseño. Una solicitud al backend o a cualquier otro destino externo, aunque sea bloqueada, hace fallar la prueba. También fallan los errores de JavaScript. Los service workers están deshabilitados. No se accede al sitio desplegado, no se usan cuentas reales y no se envían entrevistas.

Ejecución reproducible con Node 24:

```sh
npm ci
npx playwright install --with-deps chromium
npm test
npm run test:e2e
npm run build
```

El workflow `.github/workflows/pages.yml` ejecuta la verificación en pushes a `main`, pull requests y ejecuciones manuales. El despliegue exige que pase el job `verify` y se omite en pull requests. Las variables de producción se usan solo en la compilación del job de despliegue; las pruebas no requieren secretos. Los informes y trazas de fallos se conservan siete días y no se incorporan al repositorio.

Resultado local: 12 pruebas de Node/PostgreSQL aprobadas, compilación Vite correcta y 8 casos E2E aprobados, sin solicitudes al backend ni errores de JavaScript. La descarga estándar del navegador de Playwright falló en este entorno; para ejecutar los casos se usó Chromium 153.0.8010.0 obtenido mediante `@sparticuz/chromium`, con una configuración temporal que solo cambió el ejecutable y sus argumentos de arranque. Esa alternativa no se añade como dependencia del proyecto. El workflow conserva la instalación estándar de Chromium de Playwright; su resultado se debe consultar en GitHub Actions.

### Comprobación manual pendiente: autenticación y envío confirmado por el servidor

Esta actualización no acredita el ingreso real mediante contraseña, la apertura del panel autenticado ni el envío autenticado desde el enlace publicado. No se dispone de credenciales de prueba entregadas por un canal seguro; no deben añadirse contraseñas al código, informes, trazas ni conversaciones. E001 es un identificador, no una contraseña.

Para cerrar el pendiente, el titular o la coordinación debe:

1. Preparar un entorno independiente de pruebas con el mismo frontend y migraciones, sin entrevistas reales y con cuentas ficticias activas. No usar la base de producción para probar envíos.
2. Abrir su enlace público en una sesión nueva, seleccionar el tipo de acceso e ingresar con una contraseña gestionada fuera del repositorio. Comprobar acceso válido, rechazo de una contraseña incorrecta y rechazo de una cuenta inactiva. Verificar por separado administrador y encuestador y sus permisos.
3. Pulsar «Iniciar encuesta», completar datos exclusivamente ficticios, revisar y enviar. Exigir «Encuesta registrada», un identificador del servidor y un único registro en la base de pruebas, con el propietario y estado esperados. La confirmación de demostración no equivale a guardado real.
4. En ese entorno aislado, comprobar el borrador y su cierre conservando identificador, un fallo de red sin falso éxito y el reintento sin duplicados. Eliminar los datos ficticios del entorno de pruebas al terminar.
5. Registrar fecha, versión/commit, entorno y resultado sin credenciales ni datos personales. Mantener este punto como pendiente hasta disponer de esa evidencia. En producción, el titular puede comprobar solo el ingreso y el panel, sin iniciar ni enviar entrevistas de prueba.

Las pruebas SQL y E2E de demostración se complementan, pero no sustituyen esta comprobación autenticada manual. No se han enviado entrevistas reales durante esta revisión.
