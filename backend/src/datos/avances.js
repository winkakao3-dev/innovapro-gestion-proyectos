import { enTransaccion } from './conexion.js';

function aAvance(fila) {
  return {
    id: fila.id,
    proyectoId: fila.proyecto_id,
    etapaId: fila.etapa_id,
    etapaNombre: fila.etapa_nombre,
    porcentaje: fila.porcentaje,
    comentario: fila.comentario,
    modificadoPor: fila.modificado_por,
    registradoEn: fila.registrado_en,
  };
}

const SELECCION = `select h.id, h.proyecto_id, h.etapa_id, e.nombre as etapa_nombre, h.porcentaje, h.comentario,
  h.modificado_por, h.registrado_en
  from historial_avance h left join etapas e on e.id = h.etapa_id`;

export function crearRepositorioAvances(conexion) {
  return {
    async listarPorProyecto(proyectoId) {
      const { rows } = await conexion.query(
        `${SELECCION} where h.proyecto_id = $1 order by h.registrado_en desc, h.id desc`,
        [proyectoId],
      );
      return rows.map(aAvance);
    },

    // Guarda el registro en el historial y el valor vigente del proyecto en la misma transacción.
    async registrar(proyectoId, { etapaId, porcentaje, comentario }, modificadoPor) {
      return enTransaccion(conexion, async (cliente) => {
        const { rows } = await cliente.query(
          `insert into historial_avance (proyecto_id, etapa_id, porcentaje, comentario, modificado_por)
           values ($1, $2, $3, $4, $5) returning id`,
          [proyectoId, etapaId, porcentaje, comentario, modificadoPor],
        );
        await cliente.query('update proyectos set porcentaje_avance = $2, actualizado_en = now() where id = $1', [
          proyectoId,
          porcentaje,
        ]);
        const registrado = await cliente.query(`${SELECCION} where h.id = $1`, [rows[0].id]);
        return aAvance(registrado.rows[0]);
      });
    },
  };
}
