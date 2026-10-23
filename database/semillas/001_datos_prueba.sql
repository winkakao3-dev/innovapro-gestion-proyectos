-- Datos de prueba: 5 clientes y 10 proyectos ficticios (no son clientes reales de Innovapro).
-- Las cuentas de cliente usan ids fijos para poder probar la consulta del cliente con la sesión de prueba.

insert into clientes (id, nombre, contacto, correo, telefono, usuario_id) overriding system value values
  (1, 'Manufacturas del Norte',     'Ana Ríos',        'ana.rios@example.com',        '614 100 2001', '11111111-1111-4111-8111-000000000001'),
  (2, 'Ensambles Chihuahua',        'Jorge Salas',     'jorge.salas@example.com',     '614 100 2002', '11111111-1111-4111-8111-000000000002'),
  (3, 'Plásticos Sierra Madre',     'Lucía Ortega',    'lucia.ortega@example.com',    '614 100 2003', '11111111-1111-4111-8111-000000000003'),
  (4, 'Metalmecánica Delicias',     'Raúl Domínguez',  'raul.dominguez@example.com',  '639 100 2004', null),
  (5, 'Alimentos La Junta',         'Sofía Chávez',    'sofia.chavez@example.com',    '635 100 2005', null);

insert into proyectos (id, cliente_id, nombre, descripcion, fecha_inicio, fecha_estimada_termino, estado, porcentaje_avance, enlace_demo) overriding system value values
  (1,  1, 'Línea de ensamble automatizada',     'Automatización de la línea de ensamble de tableros eléctricos.',      '2026-08-03', '2026-12-18', 'en_curso',  60,  'https://example.com/demos/linea-ensamble'),
  (2,  2, 'Celda robótica de soldadura',        'Celda con brazo robótico para soldadura de soportes metálicos.',      '2026-09-07', '2027-01-29', 'en_curso',  35,  null),
  (3,  1, 'Sistema de visión para inspección',  'Inspección por cámara de defectos en piezas terminadas.',            '2026-03-02', '2026-07-31', 'terminado', 100, 'https://example.com/demos/vision'),
  (4,  3, 'Banda transportadora con sensores',  'Banda con sensores de presencia y conteo de piezas.',                 '2026-11-09', '2027-02-26', 'planeado',  0,   null),
  (5,  4, 'Tablero de monitoreo de producción', 'Tablero en planta con piezas por hora y paros de máquina.',          '2026-06-01', '2026-11-27', 'en_curso',  80,  'https://example.com/demos/tablero'),
  (6,  5, 'Dosificador automático',             'Dosificador de ingredientes con báscula y control de receta.',       '2026-07-06', '2026-12-11', 'pausado',   20,  null),
  (7,  2, 'Prensa neumática con control PLC',   'Control por PLC y paro de emergencia para prensa neumática.',        '2026-01-12', '2026-05-29', 'terminado', 100, null),
  (8,  3, 'Estación de empaque semiautomática', 'Estación para empacar y etiquetar cajas de producto terminado.',     '2026-08-17', '2027-01-15', 'en_curso',  45,  null),
  (9,  4, 'Alimentador de piezas vibratorio',   'Alimentador vibratorio para orientar tornillería en la línea.',      '2026-12-07', '2027-03-26', 'planeado',  0,   null),
  (10, 5, 'Retrofit de horno industrial',       'Modernización del control de temperatura de un horno de secado.',    '2026-10-05', '2027-02-19', 'en_curso',  10,  null);

-- Cuatro etapas por proyecto; su estado y fechas se derivan del porcentaje de avance y del periodo del proyecto.
insert into etapas (proyecto_id, nombre, orden, fecha_inicio, fecha_fin, estado)
select p.id,
       e.nombre,
       e.orden,
       p.fecha_inicio + ((p.fecha_estimada_termino - p.fecha_inicio) * (e.orden - 1) / 4),
       p.fecha_inicio + ((p.fecha_estimada_termino - p.fecha_inicio) * e.orden / 4),
       case
         when p.porcentaje_avance >= 25 * e.orden then 'terminada'
         when p.porcentaje_avance > 25 * (e.orden - 1) then 'en_curso'
         else 'pendiente'
       end
from proyectos p
cross join (values (1, 'Levantamiento'), (2, 'Diseño'), (3, 'Ejecución'), (4, 'Entrega')) as e (orden, nombre);

-- Dos actividades por etapa. En una etapa en curso, la primera ya está terminada y la segunda sigue en curso.
insert into actividades (etapa_id, descripcion, responsable, fecha_limite, estado, terminada_en)
select et.id,
       a.descripcion,
       a.responsable,
       et.fecha_fin,
       case
         when et.estado = 'terminada' then 'terminada'
         when et.estado = 'en_curso' and a.n = 1 then 'terminada'
         when et.estado = 'en_curso' then 'en_curso'
         else 'pendiente'
       end,
       case
         when et.estado = 'terminada' or (et.estado = 'en_curso' and a.n = 1) then et.fecha_inicio + 3
       end
from etapas et
join (values
  ('Levantamiento', 1, 'Visita a planta y entrevista con el cliente',      'Laura Méndez'),
  ('Levantamiento', 2, 'Documentar requisitos y restricciones del equipo', 'Carlos Ibarra'),
  ('Diseño',        1, 'Diseño mecánico y eléctrico de la solución',       'Carlos Ibarra'),
  ('Diseño',        2, 'Revisión del diseño con el cliente',               'Laura Méndez'),
  ('Ejecución',     1, 'Fabricación y ensamble de componentes',            'Martín Herrera'),
  ('Ejecución',     2, 'Programación y puesta a punto del control',        'Daniela Fuentes'),
  ('Entrega',       1, 'Pruebas de aceptación en planta',                  'Daniela Fuentes'),
  ('Entrega',       2, 'Capacitación al personal y entrega de manuales',   'Laura Méndez')
) as a (etapa, n, descripcion, responsable) on a.etapa = et.nombre;

-- Historial: un registro por etapa cerrada y, si el avance actual no coincide con un cierre, un registro con el valor actual.
insert into historial_avance (proyecto_id, etapa_id, porcentaje, comentario, modificado_por, registrado_en)
select et.proyecto_id, et.id, 25 * et.orden, 'Cierre de la etapa ' || et.nombre,
       'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', (et.fecha_fin + time '17:30') at time zone 'America/Chihuahua'
from etapas et
where et.estado = 'terminada';

insert into historial_avance (proyecto_id, etapa_id, porcentaje, comentario, modificado_por, registrado_en)
select p.id, et.id, p.porcentaje_avance, 'Avance parcial de la etapa ' || et.nombre,
       'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', least(now(), (et.fecha_inicio + 10 + time '12:15') at time zone 'America/Chihuahua')
from proyectos p
join etapas et on et.proyecto_id = p.id and et.estado = 'en_curso'
where p.porcentaje_avance % 25 <> 0;

select setval(pg_get_serial_sequence('clientes', 'id'), (select max(id) from clientes));
select setval(pg_get_serial_sequence('proyectos', 'id'), (select max(id) from proyectos));
