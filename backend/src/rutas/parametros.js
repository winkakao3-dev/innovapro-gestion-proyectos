import { ErrorDeSolicitud, errorDeValidacion } from '../errores.js';

export function leerId(valor, recurso) {
  const id = /^\d+$/.test(valor) ? Number(valor) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0) throw new ErrorDeSolicitud(404, `${recurso} no existe`);
  return id;
}

export function leerTextoDeConsulta(valor) {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  return limpio === '' ? null : limpio;
}

export function exigirValido(resultado) {
  if (!resultado.ok) throw errorDeValidacion(resultado.errores);
  return resultado.valores;
}
