import { Router } from 'express';
import { validarActividad } from '../dominio/validaciones.js';
import { noEncontrado } from '../errores.js';
import { exigirValido, leerId } from './parametros.js';

export function rutasActividades({ actividades }) {
  const rutas = Router();

  rutas.put('/:id', async (solicitud, respuesta) => {
    const id = leerId(solicitud.params.id, 'La actividad');
    const valores = exigirValido(validarActividad(solicitud.body));
    const actividad = await actividades.actualizar(id, valores);
    if (!actividad) throw noEncontrado('La actividad');
    respuesta.json(actividad);
  });

  rutas.delete('/:id', async (solicitud, respuesta) => {
    if (!(await actividades.eliminar(leerId(solicitud.params.id, 'La actividad')))) throw noEncontrado('La actividad');
    respuesta.status(204).end();
  });

  return rutas;
}
