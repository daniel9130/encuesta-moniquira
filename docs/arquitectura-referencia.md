# Revisión de Subasta Mundialista

Revisión de solo lectura de `C:/Users/Usuario/SUBASTA` y del manual del proyecto disponible como SUBASTA en `C:/Users/Usuario/Documents/New project`. No se ejecutaron sus scripts operativos ni se modificaron sus archivos o base de datos.

| Componente | Evidencia en el original | Encuesta independiente |
|---|---|---|
| Formulario | `src/main.jsx`: componentes React, estado local, `<form>` y validación antes de registrar participante | React, preguntas definidas como datos, etapas, validación y saltos |
| Frontend | `package.json`: React, Vite, Lucide | React y Vite; no requiere tiempo real |
| Base | `supabase-schema.sql`: PostgreSQL de Supabase; matches, participants, bids, app_admins | Proyecto nuevo: encuestadores, cuestionarios, encuestas |
| Registros | Registro con `.from('participants').insert()`; pujas con RPC `place_bid` | RPC `guardar_encuesta`, validación en servidor, UUID de reintento y secuencia ENC |
| Conexión | `src/supabaseClient.js`: createClient con variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY | Mismo patrón; Auth y RLS restringen acceso |
| Despliegue | `DEPLOYMENT.md`: GitHub + Vercel, build Vite, salida dist | GitHub Actions + Pages para frontend estático |
| URL pública | Vercel asigna URL tras publicación; documentación local no acredita un enlace activo | GitHub Pages asigna URL al completar workflow |

Las políticas de lectura pública de la subasta no son adecuadas para opiniones políticas. La encuesta usa acceso por cuenta, roles y escritura controlada. No se reutilizan credenciales ni tablas de aquel proyecto.
