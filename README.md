# Innovapro: gestión interna de proyectos

Módulo de gestión interna de proyectos de ingeniería de Innovapro, parte del sistema web que se desarrolla durante la estadía (UTCH, septiembre a diciembre de 2026). Este repositorio contiene solo el módulo de David Ramírez; la plataforma base (usuarios, inicio de sesión y permisos) es de Jesús Leos y el portal de soporte es de Miguel Guevara.

Tecnologías: React, Node.js con Express y PostgreSQL (Supabase).

## Qué hace

- Registro de clientes y proyectos con fecha de inicio, fecha estimada de término, estado y enlace de demostración.
- Búsqueda por nombre de proyecto o cliente y filtro por estado.
- Etapas por proyecto (con orden y fechas) y actividades por etapa con responsable, fecha límite y estado.
- Porcentaje de avance con historial: cada cambio guarda fecha, valor, etapa, comentario y usuario.
- Consulta para el cliente: solo ve sus propios proyectos, la etapa actual, el avance y el enlace de demostración.

## Estructura

```
database/   migraciones, datos de prueba y script de la base local
backend/    API REST con Express (src/datos = SQL, src/dominio = reglas, src/rutas = HTTP)
frontend/   pantallas en React con Vite
```

## Cómo correrlo en local

Requisitos: Node 22 o más nuevo y PostgreSQL 17 instalado (por ejemplo con Homebrew).

```bash
npm install
npm run bd:iniciar          # crea una base en .bd-local (puerto 54329) con el esquema y los datos de prueba
cp backend/.env.example backend/.env
npm run dev:backend         # API en http://localhost:3001
npm run dev:frontend        # pantallas en http://localhost:5173
```

`npm run bd:reiniciar` borra la base local y la vuelve a crear con los datos de prueba. `npm run bd:detener` la apaga.

Pruebas del backend (crean y borran una base temporal en el mismo servidor local):

```bash
npm test
```

## Sesión de prueba

Mientras la plataforma base no tenga inicio de sesión, el backend corre con `AUTENTICACION=prueba` y lee la sesión de dos encabezados:

| Encabezado | Valor |
| --- | --- |
| `x-rol-prueba` | `personal` o `cliente` |
| `x-usuario-prueba` | id (uuid) del usuario |

Sin encabezados, la sesión es de personal interno. En las pantallas, el selector "Sesión de prueba" de la barra superior cambia entre personal y los tres clientes de prueba que tienen acceso. Con `NODE_ENV=production` este modo no se activa solo: el backend no arranca a menos que `AUTENTICACION` venga escrito en el entorno.

## API

Todas las rutas van bajo `/api`. Las de personal interno exigen rol `personal`; las de consulta exigen rol `cliente`.

| Método y ruta | Qué hace |
| --- | --- |
| `GET /salud` | Estado del servicio (sin sesión) |
| `GET /sesion` | Usuario y rol de la sesión actual |
| `GET /clientes?buscar=` | Lista de clientes con total de proyectos |
| `GET /clientes/:id`, `POST /clientes`, `PUT /clientes/:id` | Consulta, alta y edición de un cliente |
| `GET /proyectos?buscar=&estado=&clienteId=` | Lista con etapa actual y avance |
| `GET /proyectos/:id` | Detalle con etapas, actividades e historial de avance |
| `POST /proyectos`, `PUT /proyectos/:id` | Alta y edición de un proyecto |
| `POST /proyectos/:id/etapas` | Nueva etapa |
| `PUT /etapas/:id`, `DELETE /etapas/:id` | Edición y baja de una etapa |
| `POST /etapas/:id/actividades` | Nueva actividad |
| `PUT /actividades/:id`, `DELETE /actividades/:id` | Edición y baja de una actividad |
| `GET /proyectos/:id/avances`, `POST /proyectos/:id/avances` | Historial y registro de avance |
| `GET /mis-proyectos`, `GET /mis-proyectos/:id` | Consulta del cliente (solo sus proyectos) |

Los errores de validación responden 422 con `{ mensaje, campos }`, donde `campos` trae el mensaje de cada campo.

## Puntos de integración con la plataforma base

- **Inicio de sesión.** `backend/src/autenticacion/sesion-de-prueba.js` es el único lugar que pone `req.usuario = { id, rol }`. Cuando Jesús tenga Supabase Auth, se agrega un middleware que valide el token y llene el mismo objeto; el resto del módulo no cambia.
- **Usuarios.** `clientes.usuario_id` e `historial_avance.modificado_por` guardan el uuid de Supabase Auth. Todavía no tienen llave foránea porque la tabla de perfiles es de la plataforma base; se agrega cuando exista.
- **Roles.** El módulo solo distingue `personal` y `cliente`. Si la plataforma base define más roles, se mapean en el middleware de sesión.
