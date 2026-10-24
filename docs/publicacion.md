# Publicación del módulo (actividad 15)

Semana 13 del plan: del 30 de noviembre al 4 de diciembre de 2026. Esta guía deja listos los pasos; todavía no se ha publicado nada.

## Antes de publicar: el inicio de sesión

El modo `AUTENTICACION=prueba` confía en los encabezados `x-rol-prueba` y `x-usuario-prueba`, así que **cualquiera que conozca la dirección del backend podría entrar como personal o como cualquier cliente**. Por eso:

- La versión pública se publica solo cuando el middleware de Supabase Auth de la plataforma base esté conectado (ver «Integración con la plataforma base» en la [documentación técnica](documentacion-tecnica.md)).
- Si antes hace falta una versión para la sesión de validación (actividad 14), se publica con datos de prueba, sin datos reales de clientes, y se borra al terminar la sesión.

## 1. Base de datos en Supabase

1. En el proyecto de Supabase del equipo, abrir el editor SQL.
2. Ejecutar `database/migraciones/001_gestion_proyectos.sql`.
3. Solo en un proyecto de pruebas: ejecutar `database/semillas/001_datos_prueba.sql`. En el proyecto real no se cargan los datos de prueba.
4. Copiar la cadena de conexión del proyecto (Project Settings > Database) para `DATABASE_URL`.

**Por comprobar en la primera conexión:** Supabase exige SSL. El backend hoy pasa la cadena de conexión tal cual a `pg`. Si la conexión falla por el certificado, la solución recomendada es configurar en `backend/src/datos/conexion.js` la opción `ssl` con el certificado de Supabase (se descarga desde la misma pantalla) en lugar de desactivar la verificación ([node-postgres, SSL](https://node-postgres.com/features/ssl/)). No se cambia el código hasta probarlo contra el proyecto real.

## 2. Backend en Railway

El repositorio es un monorepo con espacios de trabajo de npm y un solo `package-lock.json` en la raíz, así que el servicio se configura desde la raíz ([Railway, monorepos](https://docs.railway.com/guides/monorepo)):

| Ajuste | Valor |
| --- | --- |
| Directorio raíz | `/` |
| Comando de inicio | `npm start -w backend` |
| Rutas observadas | `/backend/**` y `/database/**` |

Variables:

| Variable | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Cadena de conexión de Supabase. |
| `ORIGENES_PERMITIDOS` | Dirección del frontend en Vercel, por ejemplo `https://<proyecto>.vercel.app`. |
| `AUTENTICACION` | Hoy solo acepta `prueba` (`backend/src/configuracion.js` rechaza cualquier otro valor), así que solo sirve para la versión de validación descrita arriba. El modo real se agrega con el middleware de Supabase Auth. |

Railway asigna `PORT`; el backend ya lo lee. Comprobar con `GET https://<backend>/api/salud`, que debe responder `{ "estado": "ok" }`.

## 3. Frontend en Vercel

| Ajuste | Valor |
| --- | --- |
| Directorio raíz | `frontend` |
| Framework | Vite (lo detecta Vercel) |
| Variable `VITE_URL_API` | Dirección del backend en Railway, sin `/api` al final. |

`frontend/vercel.json` redirige todas las rutas a `index.html` para que funcionen las direcciones como `/proyectos/3` al recargar ([Vercel, Vite](https://vercel.com/docs/frameworks/frontend/vite)).

**Por comprobar en el primer despliegue:** que Vercel instale las dependencias desde el `package-lock.json` de la raíz con el directorio raíz en `frontend`.

## 4. Comprobación en línea

1. Abrir la dirección de Vercel, recargar en `/proyectos/1` y confirmar que no aparece un error 404.
2. Ejecutar los casos de prueba contra la versión publicada, con la base de pruebas recién cargada:

   ```bash
   URL_APP=https://<proyecto>.vercel.app npm run pruebas:funcionales
   ```

3. Revisar que la consola del navegador no muestre errores.
4. Guardar el `docs/pruebas/casos-de-prueba.md` generado como evidencia de la publicación.

## 5. Entrega a Innovapro

- Código: repositorio `innovapro-gestion-proyectos` (rama `main` después de la integración).
- Scripts SQL: carpeta `database/`.
- Manual: `docs/manual-de-usuario.md`.
- Documentación técnica: `docs/documentacion-tecnica.md`.
- Evidencias de pruebas: `docs/pruebas/`.
