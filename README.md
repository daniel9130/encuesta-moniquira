# Encuesta de percepción ciudadana · Moniquirá

Aplicación independiente basada en la arquitectura de Subasta Mundialista: React + Vite + Supabase. Frontend preparado para GitHub Pages. No modifica archivos, tablas ni despliegues de la subasta.

## Estado

Frontend publicado en **https://daniel9130.github.io/encuesta-moniquira/**. Código en **https://github.com/daniel9130/encuesta-moniquira**.

**Estado actual: aplicación publicada, base conectada y administrador E001 habilitado.** El esquema está instalado en Supabase y su API bloquea lectura y escritura anónimas. El frontend usa la conexión mediante variables de GitHub Actions. Se comprobó el guardado, cierre, reintento y exportación con el rol autenticado de E001 en una transacción SQL revertida, sin conservar entrevistas ficticias. La comprobación de ingreso con contraseña desde el enlace público queda a cargo del titular de la cuenta. Consulte `docs/verificacion.md`.

## Ejecutar

Requiere Node 24 y npm.

```sh
npm ci
cp .env.example .env
npm run dev
npm test
npm run build
```

Configure en `.env` la URL y clave pública de un proyecto Supabase independiente. Nunca use `service_role` en variables `VITE_*`. Las variables `VITE_*` se incluyen en el frontend y son visibles para visitantes: la protección de datos depende de autenticación, permisos SQL y RLS. `.env` está excluido del repositorio.

## Preparar la base de datos

1. Crear un proyecto independiente en Supabase.
2. Ejecutar **database/schema.sql** en SQL Editor. Es una migración inicial; no ejecutarla sobre tablas existentes ni sobre la subasta.
3. Ejecutar **database/002_roles_panel.sql** una sola vez. Para la instalación publicada, ya está aplicada; no repetir el esquema inicial.
4. Desactivar registro público y crear una cuenta de coordinación en Authentication. Asignarle su perfil mediante SQL:

```sql
insert into public.encuestadores(user_id,codigo,rol)
values ('UUID-DEL-ADMIN','E001','admin');
```

Las contraseñas las gestiona Supabase Auth; no se incluyen en el código. El código E001 identifica a la persona y no es una contraseña. Cada cuenta activa puede enviar y consultar sus propios registros. La cuenta administradora puede consultar y exportar todos. Los visitantes sin sesión no pueden leer ni escribir respuestas. No se conceden permisos de modificación directa: toda escritura pasa por una función que valida respuestas y propietario.

## Roles y seguimiento

- Administrador: https://daniel9130.github.io/encuesta-moniquira/?rol=admin — ingresa con su correo y contraseña. Ve ingresos, última actividad, producción por persona y exportación global.
- Encuestador: https://daniel9130.github.io/encuesta-moniquira/ — ingresa únicamente con código (por ejemplo E002) y su contraseña. Ve sus totales y borradores. No necesita conocer el correo ni la contraseña del administrador.
- Ambos tienen el botón **Iniciar encuesta**. El reloj de la entrevista empieza al pulsarlo.

El panel se actualiza cada 30 segundos. La actividad se registra cada minuto con la página visible; no garantiza presencia en línea. El registro muestra las últimas 100 sesiones exitosas desde esta versión, sin intentos fallidos ni reconstrucción de ingresos anteriores. Las entrevistas se cuentan como completas, borradores o cerradas incompletas. «Hoy» usa la fecha de cierre en Colombia. Seleccionar un rol en pantalla no cambia los permisos: PostgreSQL verifica el perfil activo.

### Dar acceso a una persona de campo

1. En Supabase → Authentication → Users → Add user → Create new user, crear `e002@encuestadores.invalid`, definir una contraseña individual y activar **Auto confirm user**. Es un identificador técnico sin buzón; no se envía invitación.
2. En el panel administrador abrir **Habilitar un encuestador con acceso independiente**, indicar `E002` y el nombre de la persona, y habilitarla.
3. Entregar a esa persona solo el enlace, `E002` y su contraseña. Repetir con E003, E004, etc. E001 está reservado para el administrador existente.

Las cuentas técnicas no reciben correos de recuperación; la coordinación administra sus contraseñas en Supabase. Para suspender acceso, cambiar `activo` a `false` en su perfil de `encuestadores`. El panel solo habilita perfiles de encuestador, nunca administradores. La primera cuenta de campo debe crearse antes de utilizar este acceso.

## Trabajo en campo

Desde la versión `moniquira-2026-09-v2`, todas las preguntas y el sector son opcionales. Se puede continuar y enviar con respuestas vacías; «Dejar sin respuesta» borra una selección. Un vacío no equivale a «No sabe / No responde». «Completa» indica finalización, no respuesta a todas las preguntas. Si se marca rechazo o filtro negativo, se conserva el cierre incompleto y se omiten las opiniones. Los borradores v1 se convierten a v2 al guardarlos desde la aplicación actual, conservando su ID. Las encuestas cerradas anteriores no cambian.

Instalaciones nuevas: aplicar `schema.sql`, `002_roles_panel.sql` y `003_optional_questions.sql` en ese orden. La migración 003 agrega v2 sin reemplazar la definición histórica v1. No volver a generar el esquema inicial para actualizar producción.

1. Abrir el enlace, seleccionar **Encuestador**, ingresar con código y contraseña propios y pulsar **Iniciar encuesta**.
2. Indicar el sector de aplicación, registrar consentimiento y aplicar el filtro.
3. Leer literalmente preguntas e instrucciones. Las preguntas espontáneas no muestran listas de candidatos.
4. Revisar y enviar. Solo la confirmación del servidor significa que la encuesta quedó guardada.
5. Para interrumpir una entrevista, usar **Guardar como incompleta y continuar después**. El borrador queda en la base y aparece al volver a ingresar.

Se requiere internet. Las respuestas pendientes permanecen únicamente en memoria: cerrar o recargar antes de guardar puede perderlas. Ante un fallo, la pantalla no anuncia éxito ni borra respuestas; reintentar conserva el mismo UUID y evita duplicados. La duración mide tiempo transcurrido desde el inicio, incluidas pausas. Los borradores no tienen hora final ni duración hasta su cierre. Fecha de recepción y actualización se guardan también en UTC en la tabla.

El ID ENC se asigna en el servidor con una secuencia transaccional; es único entre encuestadores. Puede tener saltos por transacciones fallidas; no representa un conteo garantizado sin huecos. Una entrevista cerrada es inmutable mediante la app. Las entrevistas sin consentimiento o que no cumplen el filtro se guardan como incompletas con motivo de cierre y sin respuestas políticas.

## Publicar en GitHub Pages

1. Crear un repositorio independiente `encuesta-moniquira` y subir este código, sin `.env`, datos reales ni la carpeta `work`.
2. En Settings → Secrets and variables → Actions: crear variable `VITE_SUPABASE_URL` y secreto `VITE_SUPABASE_ANON_KEY` (clave pública/anon, nunca service_role).
3. En Settings → Pages seleccionar GitHub Actions.
4. Enviar a la rama `main`. El workflow prueba, compila y publica.
5. El enlace se obtiene en el resultado del workflow y en Settings → Pages. El patrón esperado es `https://USUARIO.github.io/encuesta-moniquira/`; solo debe compartirse después de verificar el despliegue.

No es necesario un servidor propio para el frontend. Supabase proporciona la API y PostgreSQL. Consulte los planes vigentes antes de contratar; los límites gratuitos, pausas por inactividad y cuotas pueden variar. La carpeta `dist` puede desplegarse también en Vercel con `VITE_BASE_PATH=/`.

## Descargar información

La cuenta con rol `admin` ve **Descargar CSV**. La descarga pagina los registros por número para no limitarse a las primeras 1.000 filas. Incluye completas e incompletas. Descargue tras cerrar la jornada para evitar que los borradores cambien durante la exportación.

También puede ejecutar en Supabase SQL Editor:

```sql
select * from public.exportacion_encuestas order by numero;
```

Exportar el resultado a CSV. Para análisis de opiniones use `estado = 'completa'`. Conserve incompletas para control de campo, nunca las trate como respuestas válidas al total del cuestionario. P3 se conserva como lista; no se convierte automáticamente a preferencia electoral.

- **Excel:** Datos → Desde texto/CSV, UTF-8, separador coma.
- **Power BI:** Obtener datos → Texto/CSV, UTF-8. Definir tipos de fecha, hora y duración.
- **Python:** `pandas.read_csv('encuestas-moniquira.csv', encoding='utf-8-sig')`.
- **R:** `read.csv('encuestas-moniquira.csv', fileEncoding='UTF-8-BOM', check.names=FALSE)`.

Las celdas que pueden interpretarse como fórmulas se exportan con apóstrofo protector. Los textos originales permanecen en PostgreSQL. Descargue la vista SQL para procesamiento que exija los textos sin transformación.

## Archivos

- `src/questionnaire.js`: preguntas, condiciones y versión.
- `database/schema.sql`: tablas, validaciones, función segura, permisos y vista de exportación.
- `docs/diccionario.md`: nombres, tipos y categorías de las variables.
- `examples/encuestas_ejemplo.csv`: ejemplo completamente ficticio.
- `docs/revision-cuestionario.md`: decisiones sobre el cuestionario.
- `docs/arquitectura-referencia.md`: revisión de la subasta.

Si cambia el cuestionario, no sobrescriba versiones aplicadas: cree nueva versión y migración. `node scripts/generate-schema.js` reconstruye el esquema inicial y documentos para una instalación nueva; no es una migración de una base en producción.

Documentación oficial: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
