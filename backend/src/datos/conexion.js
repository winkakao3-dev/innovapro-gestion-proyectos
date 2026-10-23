import pg from 'pg';

// Las fechas (date) se devuelven como texto AAAA-MM-DD para que la zona horaria del servidor no las recorra un día.
pg.types.setTypeParser(pg.types.builtins.DATE, (valor) => valor);
pg.types.setTypeParser(pg.types.builtins.INT8, (valor) => Number(valor));

export function crearConexion(urlBaseDatos) {
  return new pg.Pool({ connectionString: urlBaseDatos, max: 10 });
}

export async function enTransaccion(conexion, trabajo) {
  const cliente = await conexion.connect();
  try {
    await cliente.query('begin');
    const resultado = await trabajo(cliente);
    await cliente.query('commit');
    return resultado;
  } catch (error) {
    await cliente.query('rollback');
    throw error;
  } finally {
    cliente.release();
  }
}
