# Verificación del 14 de septiembre de 2026

- Compilación Vite de producción: correcta.
- Pruebas automatizadas: 8 aprobadas, incluidas validaciones del instrumento, condicionales, CSV y PostgreSQL mediante PGlite.
- Base de prueba: se ejecutó el SQL completo, con roles anónimo y autenticado y tres cuentas ficticias.
- Comprobado: acceso limitado al propietario, lectura global del administrador, bloqueo anónimo, bloqueo de escritura directa, opciones inválidas rechazadas, mismo identificador al cerrar borrador, reintentos sin duplicación y limpieza de opiniones en cierres por filtro o consentimiento.
- Navegador: recorrido completo de demostración, aparición de «Otro: ¿cuál?», campos obligatorios y salto de filtro negativo a cierre.
- Presentación: anchos de prueba 390, 768 y 1366 px; sin desbordamiento horizontal. Inspección visual de controles de campo en móvil.

Estas pruebas no equivalen a una comprobación de conexión con Supabase alojado. La verificación final exige crear el proyecto independiente, ejecutar el esquema, habilitar usuarios y enviar una entrevista de prueba por el enlace público. No se han recogido entrevistas reales.
