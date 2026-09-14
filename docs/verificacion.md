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
