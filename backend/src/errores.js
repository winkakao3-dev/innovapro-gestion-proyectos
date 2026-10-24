export class ErrorDeSolicitud extends Error {
  constructor(estado, mensaje, campos) {
    super(mensaje);
    this.estado = estado;
    this.campos = campos;
  }
}

export function errorDeValidacion(campos) {
  return new ErrorDeSolicitud(422, 'Revisa los datos marcados', campos);
}

export function noEncontrado(recurso) {
  return new ErrorDeSolicitud(404, `${recurso} no existe`);
}

const ERRORES_POSTGRES = {
  23503: { estado: 422, mensaje: 'El registro relacionado no existe' },
  23505: { estado: 409, mensaje: 'Ya existe un registro con esos datos' },
  23514: { estado: 422, mensaje: 'Algún dato está fuera de los valores permitidos' },
  '22P02': { estado: 422, mensaje: 'Algún dato tiene un formato no válido' },
};

export function manejarErrores(error, solicitud, respuesta, _siguiente) {
  if (error instanceof ErrorDeSolicitud) {
    respuesta.status(error.estado).json({ error: error.message, campos: error.campos });
    return;
  }
  if (error.type === 'entity.parse.failed') {
    respuesta.status(400).json({ error: 'El cuerpo de la solicitud no es JSON válido' });
    return;
  }
  const conocido = ERRORES_POSTGRES[error.code];
  if (conocido) {
    respuesta.status(conocido.estado).json({ error: conocido.mensaje });
    return;
  }
  console.error(`Error en ${solicitud.method} ${solicitud.originalUrl}`, error);
  respuesta.status(500).json({ error: 'Ocurrió un error inesperado en el servidor' });
}
