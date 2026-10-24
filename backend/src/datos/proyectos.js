import { escaparPatron } from './patrones.js';

function aProyecto(fila) {
  return {
    id: fila.id,
    clienteId: fila.cliente_id,
    clienteNombre: fila.cliente_nombre,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    fechaInicio: fila.fecha_inicio,
    fechaEstimadaTermino: fila.fecha_estimada_termino,
    estado: fila.estado,
    porcentajeAvance: fila.porcentaje_avance,
    enlaceDemo: fila.enlace_demo,
    actualizadoEn: fila.actualizado_en,
  };
}

const SELECCION = `select p.id, p.cliente_id, c.nombre as cliente_nombre, p.nombre, p.descripcion, p.fecha_inicio,
  p.fecha_estimada_termino, p.estado, p.porcentaje_avance, p.enlace_demo, p.actualizado_en
  from proyectos p join clientes c on c.id = p.cliente_id`;

export function crearRepositorioProyectos(conexion) {
  return {
    async listar({ buscar, estado, clienteId } = {}) {
      const { rows } = await conexion.query(
        `${SELECCION}
         where ($1::text is null or p.nombre ilike $1 or c.nombre ilike $1)
           and ($2::text is null or p.estado = $2)
           and ($3::bigint is null or p.cliente_id = $3)
         order by p.fecha_inicio desc, p.id desc`,
        [buscar ? `%${escaparPatron(buscar)}%` : null, estado ?? null, clienteId ?? null],
      );
      return rows.map(aProyecto);
    },

    async listarDeUsuarioCliente(usuarioId) {
      const { rows } = await conexion.query(
        `${SELECCION} where c.usuario_id = $1 order by p.fecha_inicio desc, p.id desc`,
        [usuarioId],
      );
      return rows.map(aProyecto);
    },

    async obtener(id) {
      const { rows } = await conexion.query(`${SELECCION} where p.id = $1`, [id]);
      return rows[0] ? aProyecto(rows[0]) : null;
    },

    async obtenerDeUsuarioCliente(id, usuarioId) {
      const { rows } = await conexion.query(`${SELECCION} where p.id = $1 and c.usuario_id = $2`, [id, usuarioId]);
      return rows[0] ? aProyecto(rows[0]) : null;
    },

    async crear({ clienteId, nombre, descripcion, fechaInicio, fechaEstimadaTermino, estado, enlaceDemo }) {
      const { rows } = await conexion.query(
        `insert into proyectos (cliente_id, nombre, descripcion, fecha_inicio, fecha_estimada_termino, estado, enlace_demo)
         values ($1, $2, $3, $4, $5, $6, $7) returning id`,
        [clienteId, nombre, descripcion, fechaInicio, fechaEstimadaTermino, estado, enlaceDemo],
      );
      return this.obtener(rows[0].id);
    },

    async actualizar(id, { clienteId, nombre, descripcion, fechaInicio, fechaEstimadaTermino, estado, enlaceDemo }) {
      const { rowCount } = await conexion.query(
        `update proyectos set cliente_id = $2, nombre = $3, descripcion = $4, fecha_inicio = $5,
           fecha_estimada_termino = $6, estado = $7, enlace_demo = $8, actualizado_en = now()
         where id = $1`,
        [id, clienteId, nombre, descripcion, fechaInicio, fechaEstimadaTermino, estado, enlaceDemo],
      );
      return rowCount === 0 ? null : this.obtener(id);
    },
  };
}
