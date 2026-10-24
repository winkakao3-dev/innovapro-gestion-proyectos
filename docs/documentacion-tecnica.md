# Documentación técnica del módulo de gestión de proyectos

Para instalarlo y correrlo en local, ver el [README](../README.md). Para el uso de las pantallas, ver el [manual de usuario](manual-de-usuario.md).

## Arquitectura

```
frontend (React + Vite)  ──HTTP/JSON──>  backend (Node.js + Express)  ──SQL──>  PostgreSQL (Supabase)
```

El backend se divide en capas, y cada una solo conoce a la de abajo:

| Carpeta | Responsabilidad |
| --- | --- |
| `backend/src/rutas/` | Recibe la solicitud HTTP, lee los parámetros, llama a las reglas y a los datos, y arma la respuesta. No contiene SQL. |
| `backend/src/dominio/validaciones.js` | Reglas del negocio sin dependencias: campos obligatorios, fechas, estados y rangos. Devuelve `{ ok, valores }` o `{ ok: false, errores }`. |
| `backend/src/datos/` | Todas las consultas SQL. Convierte los renglones de la base en objetos con nombres en camelCase. |
| `backend/src/autenticacion/` | Pone en `req.usuario` el usuario de la sesión (`{ id, rol }`) y revisa el rol de cada sección. |
| `backend/src/servidor.js` | Arma las piezas (conexión, repositorios, sesión) y levanta el servidor. |

En el frontend, `src/api.js` es el único archivo que llama a los servicios; las pantallas están en `src/paginas/` y las piezas reutilizables en `src/componentes/`.

## Base de datos

Scripts en `database/`: `migraciones/001_gestion_proyectos.sql` crea las tablas y `semillas/001_datos_prueba.sql` carga los datos de prueba (5 clientes, 10 proyectos, 40 etapas, 80 actividades y 21 registros de avance). El diagrama entidad-relación está en el reporte de estadía.

### clientes

| Columna | Tipo | Reglas |
| --- | --- | --- |
| id | bigint | Llave primaria, se genera sola. |
| nombre | varchar(150) | Obligatorio, no vacío. |
| contacto | varchar(150) | Opcional. |
| correo | varchar(150) | Opcional; el servicio valida el formato. |
| telefono | varchar(30) | Opcional; el servicio admite números, espacios, paréntesis, + y guiones. |
| usuario_id | uuid | Opcional y único. Cuenta de Supabase Auth con la que el cliente consulta su avance. |
| creado_en, actualizado_en | timestamptz | Se llenan solos. |

### proyectos

| Columna | Tipo | Reglas |
| --- | --- | --- |
| id | bigint | Llave primaria. |
| cliente_id | bigint | Obligatorio; llave foránea a `clientes`. |
| nombre | varchar(150) | Obligatorio, no vacío. |
| descripcion | text | Opcional. |
| fecha_inicio | date | Obligatoria. |
| fecha_estimada_termino | date | Obligatoria; no puede ser anterior a `fecha_inicio`. |
| estado | varchar(20) | `planeado` (predeterminado), `en_curso`, `pausado` o `terminado`. |
| porcentaje_avance | smallint | 0 a 100; solo cambia al registrar un avance. |
| enlace_demo | varchar(500) | Opcional; el servicio exige `http://` o `https://`. |
| creado_en, actualizado_en | timestamptz | Se llenan solos. |

Índices: `cliente_id` y `estado`.

### etapas

| Columna | Tipo | Reglas |
| --- | --- | --- |
| id | bigint | Llave primaria. |
| proyecto_id | bigint | Llave foránea a `proyectos`; se borra con el proyecto. |
| nombre | varchar(100) | Obligatorio, no vacío. |
| orden | smallint | Mayor que 0 (el servicio limita a 100); único dentro del proyecto. |
| fecha_inicio, fecha_fin | date | Opcionales; `fecha_fin` no puede ser anterior a `fecha_inicio`. |
| estado | varchar(20) | `pendiente` (predeterminado), `en_curso` o `terminada`. |
| creado_en | timestamptz | Se llena solo. |

### actividades

| Columna | Tipo | Reglas |
| --- | --- | --- |
| id | bigint | Llave primaria. |
| etapa_id | bigint | Llave foránea a `etapas`; se borra con la etapa. |
| descripcion | varchar(300) | Obligatoria, no vacía. |
| responsable | varchar(150) | Obligatorio. Es texto porque no todo el personal tiene cuenta. |
| fecha_limite | date | Obligatoria. |
| estado | varchar(20) | `pendiente` (predeterminado), `en_curso` o `terminada`. |
| terminada_en | timestamptz | Se llena al pasar a `terminada` y se borra al reabrirla. |
| creado_en | timestamptz | Se llena solo. |

### historial_avance

| Columna | Tipo | Reglas |
| --- | --- | --- |
| id | bigint | Llave primaria. |
| proyecto_id | bigint | Llave foránea a `proyectos`; se borra con el proyecto. |
| etapa_id | bigint | Opcional; si se borra la etapa, queda en nulo y el registro se conserva. |
| porcentaje | smallint | 0 a 100. |
| comentario | varchar(300) | Opcional. |
| modificado_por | uuid | Obligatorio; cuenta de quien registró el avance. |
| registrado_en | timestamptz | Se llena solo. |

Índice: `(proyecto_id, registrado_en desc)`, para leer el historial del más reciente al más antiguo.

Al registrar un avance, el servicio inserta en `historial_avance` y actualiza `proyectos.porcentaje_avance` dentro de una misma transacción.

## Servicios

Todas las rutas van bajo `/api` y reciben y devuelven JSON. Las fechas viajan como texto `AAAA-MM-DD` y las fechas con hora en formato ISO 8601.

### Sesión y roles

| Encabezado (modo de prueba) | Valor |
| --- | --- |
| `x-rol-prueba` | `personal` o `cliente`. |
| `x-usuario-prueba` | uuid del usuario. |

Sin encabezados, la sesión es de personal interno. Las rutas de clientes, proyectos, etapas y actividades exigen `personal`; las de `mis-proyectos` exigen `cliente`.

### Rutas

| Método | Ruta | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| GET | `/salud` | | `200 { estado: "ok" }`, sin sesión. |
| GET | `/sesion` | | `200 { id, rol }` |
| GET | `/clientes?buscar=` | | `200 [cliente]`. La búsqueda revisa empresa, contacto y correo. |
| GET | `/clientes/:id` | | `200 cliente` |
| POST | `/clientes` | `{ nombre, contacto?, correo?, telefono? }` | `201 cliente` |
| PUT | `/clientes/:id` | igual que POST | `200 cliente` |
| GET | `/proyectos?buscar=&estado=&clienteId=` | | `200 [proyecto]`, cada uno con `etapaActual`, `totalEtapas` y `etapasTerminadas`. |
| GET | `/proyectos/:id` | | `200 proyecto` con `etapas` (cada una con `actividades`) e `historialAvance`. |
| POST | `/proyectos` | `{ clienteId, nombre, descripcion?, fechaInicio, fechaEstimadaTermino, estado?, enlaceDemo? }` | `201 proyecto` |
| PUT | `/proyectos/:id` | igual que POST | `200 proyecto` |
| POST | `/proyectos/:id/etapas` | `{ nombre, orden, fechaInicio?, fechaFin?, estado? }` | `201 etapa` |
| PUT | `/etapas/:id` | igual que POST de etapa | `200 etapa` |
| DELETE | `/etapas/:id` | | `204` |
| POST | `/etapas/:id/actividades` | `{ descripcion, responsable, fechaLimite, estado? }` | `201 actividad` |
| PUT | `/actividades/:id` | igual que POST de actividad | `200 actividad` |
| DELETE | `/actividades/:id` | | `204` |
| GET | `/proyectos/:id/avances` | | `200 [registro]`, del más reciente al más antiguo. |
| POST | `/proyectos/:id/avances` | `{ porcentaje, etapaId?, comentario? }` | `201 registro`. La etapa debe pertenecer al proyecto. |
| GET | `/mis-proyectos` | | `200 [proyecto]` del cliente de la sesión, con `id, nombre, estado, porcentajeAvance, fechaInicio, fechaEstimadaTermino, etapaActual, totalEtapas, etapasTerminadas`. |
| GET | `/mis-proyectos/:id` | | `200 proyecto` con etapas (sin actividades) e historial (sin `modificadoPor`). `404` si el proyecto es de otro cliente. |

La etapa actual de un proyecto es la etapa en curso; si no hay, la primera pendiente, y si todas están terminadas, la última.

### Errores

Los errores responden `{ error }`; los de validación agregan `campos`, con un mensaje por campo:

```json
{
  "error": "Revisa los datos marcados",
  "campos": { "nombre": "Escribe el nombre del proyecto", "fechaInicio": "Indica la fecha de inicio" }
}
```

| Código | Cuándo |
| --- | --- |
| 400 | El cuerpo no es JSON válido. |
| 401 | Los encabezados de la sesión de prueba están mal formados. |
| 403 | El rol de la sesión no tiene acceso a la sección. |
| 404 | La ruta, el registro o el proyecto de otro cliente no existe. |
| 409 | Ya hay una etapa con ese orden en el proyecto. |
| 422 | Datos inválidos o referencia a un registro que no existe. |
| 500 | Error no previsto; se registra en el servidor y la respuesta no incluye detalles internos. |

## Configuración

Variables del backend (`backend/.env.example`):

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto del servidor (3001 de forma predeterminada). |
| `DATABASE_URL` | Cadena de conexión de PostgreSQL. En Supabase es la del proyecto. |
| `ORIGENES_PERMITIDOS` | Direcciones del frontend separadas por coma (CORS). |
| `AUTENTICACION` | `prueba` para la sesión simulada. Con `NODE_ENV=production` es obligatoria. |

En el frontend, `VITE_URL_API` indica la dirección del backend cuando no se usa el proxy de desarrollo de Vite.

## Pruebas

| Comando | Qué revisa |
| --- | --- |
| `npm test` | 30 pruebas automatizadas del backend: reglas de validación y servicios contra una base de prueba que se crea y se borra en cada ejecución. |
| `npm run pruebas:funcionales` | 20 casos de prueba sobre las pantallas en Chrome; escribe el registro en `docs/pruebas/casos-de-prueba.md`. |

## Integración con la plataforma base

- **Inicio de sesión.** Reemplazar `sesionDePrueba()` en `backend/src/servidor.js` por un middleware que valide el token de Supabase Auth y ponga `req.usuario = { id, rol }`. El resto del módulo no cambia.
- **Perfiles.** Cuando exista la tabla de perfiles, agregar las llaves foráneas de `clientes.usuario_id` e `historial_avance.modificado_por`, y mostrar el nombre de la persona en el historial en lugar del identificador.
- **Frontend.** El selector de sesión de prueba (`frontend/src/sesion.jsx`) se sustituye por la sesión real; `api.js` es el único lugar donde se agregan los encabezados.
- **Publicación.** Pendiente (actividad 15): frontend en Vercel, backend en Railway y base en Supabase.
