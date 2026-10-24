import { Router } from 'express';
import { validarActividad, validarEtapa } from '../dominio/validaciones.js';
import { ErrorDeSolicitud, noEncontrado } from '../errores.js';
import { exigirValido, leerId } from './parametros.js';

const VIOLACION_DE_UNICIDAD = '23505';

export async function traducirOrdenRepetido(operacion) {
  try {
    return await operacion();
  } catch (error) {
    if (error.code === VIOLACION_DE_UNICIDAD) {
      throw new ErrorDeSolicitud(409, 'Ya hay una etapa con ese orden en el proyecto', {
        orden: 'Ya hay una etapa con ese orden',
      });
    }
    throw error;
  }
}

export function rutasEtapas({ etapas, actividades }) {
  const rutas = Router();

  async function exigirEtapa(valor) {
    const etapa = await etapas.obtener(leerId(valor, 'La etapa'));
    if (!etapa) throw noEncontrado('La etapa');
    return etapa;
  }

  rutas.put('/:id', async (solicitud, respuesta) => {
    const etapa = await exigirEtapa(solicitud.params.id);
    const valores = exigirValido(validarEtapa(solicitud.body));
    respuesta.json(await traducirOrdenRepetido(() => etapas.actualizar(etapa.id, valores)));
  });

  rutas.delete('/:id', async (solicitud, respuesta) => {
    if (!(await etapas.eliminar(leerId(solicitud.params.id, 'La etapa')))) throw noEncontrado('La etapa');
    respuesta.status(204).end();
  });

  rutas.post('/:id/actividades', async (solicitud, respuesta) => {
    const etapa = await exigirEtapa(solicitud.params.id);
    const valores = exigirValido(validarActividad(solicitud.body));
    respuesta.status(201).json(await actividades.crear(etapa.id, valores));
  });

  return rutas;
}
