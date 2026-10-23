import { escaparPatron } from './patrones.js';

function aCliente(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    contacto: fila.contacto,
    correo: fila.correo,
    telefono: fila.telefono,
    tieneAcceso: fila.usuario_id !== null,
    totalProyectos: fila.total_proyectos ?? 0,
  };
}

const COLUMNAS = `c.id, c.nombre, c.contacto, c.correo, c.telefono, c.usuario_id,
  (select count(*) from proyectos p where p.cliente_id = c.id) as total_proyectos`;

export function crearRepositorioClientes(conexion) {
  return {
    async listar({ buscar } = {}) {
      const { rows } = await conexion.query(
        `select ${COLUMNAS} from clientes c
         where $1::text is null or c.nombre ilike $1 or c.contacto ilike $1 or c.correo ilike $1
         order by c.nombre`,
        [buscar ? `%${escaparPatron(buscar)}%` : null],
      );
      return rows.map(aCliente);
    },

    async obtener(id) {
      const { rows } = await conexion.query(`select ${COLUMNAS} from clientes c where c.id = $1`, [id]);
      return rows[0] ? aCliente(rows[0]) : null;
    },

    async crear({ nombre, contacto, correo, telefono }) {
      const { rows } = await conexion.query(
        `insert into clientes (nombre, contacto, correo, telefono) values ($1, $2, $3, $4) returning id`,
        [nombre, contacto, correo, telefono],
      );
      return this.obtener(rows[0].id);
    },

    async actualizar(id, { nombre, contacto, correo, telefono }) {
      const { rowCount } = await conexion.query(
        `update clientes set nombre = $2, contacto = $3, correo = $4, telefono = $5, actualizado_en = now()
         where id = $1`,
        [id, nombre, contacto, correo, telefono],
      );
      return rowCount === 0 ? null : this.obtener(id);
    },
  };
}
