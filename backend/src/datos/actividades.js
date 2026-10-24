function aActividad(fila) {
  return {
    id: fila.id,
    etapaId: fila.etapa_id,
    descripcion: fila.descripcion,
    responsable: fila.responsable,
    fechaLimite: fila.fecha_limite,
    estado: fila.estado,
    terminadaEn: fila.terminada_en,
  };
}

const COLUMNAS = 'id, etapa_id, descripcion, responsable, fecha_limite, estado, terminada_en';

export function crearRepositorioActividades(conexion) {
  return {
    async listarPorEtapas(etapaIds) {
      if (etapaIds.length === 0) return [];
      const { rows } = await conexion.query(
        `select ${COLUMNAS} from actividades where etapa_id = any($1::bigint[]) order by etapa_id, fecha_limite, id`,
        [etapaIds],
      );
      return rows.map(aActividad);
    },

    async crear(etapaId, { descripcion, responsable, fechaLimite, estado }) {
      const { rows } = await conexion.query(
        `insert into actividades (etapa_id, descripcion, responsable, fecha_limite, estado, terminada_en)
         values ($1, $2, $3, $4, $5::varchar, case when $5::varchar = 'terminada' then now() end) returning ${COLUMNAS}`,
        [etapaId, descripcion, responsable, fechaLimite, estado],
      );
      return aActividad(rows[0]);
    },

    // Conserva la fecha en que se terminó si ya estaba terminada; la borra si se reabre.
    async actualizar(id, { descripcion, responsable, fechaLimite, estado }) {
      const { rows } = await conexion.query(
        `update actividades set descripcion = $2, responsable = $3, fecha_limite = $4, estado = $5::varchar,
           terminada_en = case when $5::varchar = 'terminada' then coalesce(terminada_en, now()) end
         where id = $1 returning ${COLUMNAS}`,
        [id, descripcion, responsable, fechaLimite, estado],
      );
      return rows[0] ? aActividad(rows[0]) : null;
    },

    async eliminar(id) {
      const { rowCount } = await conexion.query('delete from actividades where id = $1', [id]);
      return rowCount > 0;
    },
  };
}
