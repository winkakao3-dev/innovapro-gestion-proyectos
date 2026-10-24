function aEtapa(fila) {
  return {
    id: fila.id,
    proyectoId: fila.proyecto_id,
    nombre: fila.nombre,
    orden: fila.orden,
    fechaInicio: fila.fecha_inicio,
    fechaFin: fila.fecha_fin,
    estado: fila.estado,
  };
}

const COLUMNAS = 'id, proyecto_id, nombre, orden, fecha_inicio, fecha_fin, estado';

export function crearRepositorioEtapas(conexion) {
  return {
    async listarPorProyectos(proyectoIds) {
      if (proyectoIds.length === 0) return [];
      const { rows } = await conexion.query(
        `select ${COLUMNAS} from etapas where proyecto_id = any($1::bigint[]) order by proyecto_id, orden`,
        [proyectoIds],
      );
      return rows.map(aEtapa);
    },

    async obtener(id) {
      const { rows } = await conexion.query(`select ${COLUMNAS} from etapas where id = $1`, [id]);
      return rows[0] ? aEtapa(rows[0]) : null;
    },

    async crear(proyectoId, { nombre, orden, fechaInicio, fechaFin, estado }) {
      const { rows } = await conexion.query(
        `insert into etapas (proyecto_id, nombre, orden, fecha_inicio, fecha_fin, estado)
         values ($1, $2, $3, $4, $5, $6) returning ${COLUMNAS}`,
        [proyectoId, nombre, orden, fechaInicio, fechaFin, estado],
      );
      return aEtapa(rows[0]);
    },

    async actualizar(id, { nombre, orden, fechaInicio, fechaFin, estado }) {
      const { rows } = await conexion.query(
        `update etapas set nombre = $2, orden = $3, fecha_inicio = $4, fecha_fin = $5, estado = $6
         where id = $1 returning ${COLUMNAS}`,
        [id, nombre, orden, fechaInicio, fechaFin, estado],
      );
      return rows[0] ? aEtapa(rows[0]) : null;
    },

    async eliminar(id) {
      const { rowCount } = await conexion.query('delete from etapas where id = $1', [id]);
      return rowCount > 0;
    },
  };
}
