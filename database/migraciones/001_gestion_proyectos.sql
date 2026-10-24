-- Módulo de gestión interna de proyectos de Innovapro.
-- Cinco tablas: clientes, proyectos, etapas, actividades e historial_avance.
-- Las cuentas de usuario son de la plataforma base (Supabase Auth); aquí solo se guarda su id (uuid).
-- Cuando exista la tabla de perfiles de la plataforma base, usuario_id y modificado_por apuntarán a ella.

create table clientes (
  id              bigint generated always as identity primary key,
  nombre          varchar(150) not null check (length(trim(nombre)) > 0),
  contacto        varchar(150),
  correo          varchar(150),
  telefono        varchar(30),
  usuario_id      uuid unique,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create table proyectos (
  id                      bigint generated always as identity primary key,
  cliente_id              bigint not null references clientes (id),
  nombre                  varchar(150) not null check (length(trim(nombre)) > 0),
  descripcion             text,
  fecha_inicio            date not null,
  fecha_estimada_termino  date not null,
  estado                  varchar(20) not null default 'planeado'
                          check (estado in ('planeado', 'en_curso', 'pausado', 'terminado')),
  porcentaje_avance       smallint not null default 0 check (porcentaje_avance between 0 and 100),
  enlace_demo             varchar(500),
  creado_en               timestamptz not null default now(),
  actualizado_en          timestamptz not null default now(),
  check (fecha_estimada_termino >= fecha_inicio)
);

create index proyectos_cliente_id_idx on proyectos (cliente_id);
create index proyectos_estado_idx on proyectos (estado);

create table etapas (
  id            bigint generated always as identity primary key,
  proyecto_id   bigint not null references proyectos (id) on delete cascade,
  nombre        varchar(100) not null check (length(trim(nombre)) > 0),
  orden         smallint not null check (orden > 0),
  fecha_inicio  date,
  fecha_fin     date,
  estado        varchar(20) not null default 'pendiente'
                check (estado in ('pendiente', 'en_curso', 'terminada')),
  creado_en     timestamptz not null default now(),
  unique (proyecto_id, orden),
  check (fecha_fin is null or fecha_inicio is null or fecha_fin >= fecha_inicio)
);

create table actividades (
  id            bigint generated always as identity primary key,
  etapa_id      bigint not null references etapas (id) on delete cascade,
  descripcion   varchar(300) not null check (length(trim(descripcion)) > 0),
  responsable   varchar(150) not null check (length(trim(responsable)) > 0),
  fecha_limite  date not null,
  estado        varchar(20) not null default 'pendiente'
                check (estado in ('pendiente', 'en_curso', 'terminada')),
  terminada_en  timestamptz,
  creado_en     timestamptz not null default now()
);

create index actividades_etapa_id_idx on actividades (etapa_id);

create table historial_avance (
  id              bigint generated always as identity primary key,
  proyecto_id     bigint not null references proyectos (id) on delete cascade,
  etapa_id        bigint references etapas (id) on delete set null,
  porcentaje      smallint not null check (porcentaje between 0 and 100),
  comentario      varchar(300),
  modificado_por  uuid not null,
  registrado_en   timestamptz not null default now()
);

create index historial_avance_proyecto_id_idx on historial_avance (proyecto_id, registrado_en desc);
