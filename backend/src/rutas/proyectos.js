import { Router } from 'express';
import { ESTADOS_PROYECTO, validarAvance, validarEtapa, validarProyecto } from '../dominio/validaciones.js';
import { errorDeValidacion, noEncontrado } from '../errores.js';
import { agregarEtapaActual, armarDetalleProyecto } from './composicion.js';
import { traducirOrdenRepetido } from './etapas.js';
import { exigirValido, leerId, leerTextoDeConsulta } from './parametros.js';

export function rutasProyectos(repositorios) {
  const { clientes, proyectos, etapas, avances } = repositorios;
  const rutas = Router();

  async function exigirProyecto(valor) {
    const proyecto = await proyectos.obtener(leerId(valor, 'El proyecto'));
    if (!proyecto) throw noEncontrado('El proyecto');
    return proyecto;
  }

  async function exigirClienteExistente(clienteId) {
    if (!(await clientes.obtener(clienteId))) throw errorDeValidacion({ clienteId: 'El cliente elegido no existe' });
  }

  rutas.get('/', async (solicitud, respuesta) => {
    const estado = leerTextoDeConsulta(solicitud.query.estado);
    if (estado && !ESTADOS_PROYECTO.includes(estado)) throw errorDeValidacion({ estado: 'Elige un estado de la lista' });
    const clienteId = leerTextoDeConsulta(solicitud.query.clienteId);
    const lista = await proyectos.listar({
      buscar: leerTextoDeConsulta(solicitud.query.buscar),
      estado,
      clienteId: clienteId ? leerId(clienteId, 'El cliente') : null,
    });
    respuesta.json(await agregarEtapaActual(lista, repositorios));
  });

  rutas.get('/:id', async (solicitud, respuesta) => {
    const proyecto = await exigirProyecto(solicitud.params.id);
    respuesta.json(await armarDetalleProyecto(proyecto, repositorios));
  });

  rutas.post('/', async (solicitud, respuesta) => {
    const valores = exigirValido(validarProyecto(solicitud.body));
    await exigirClienteExistente(valores.clienteId);
    respuesta.status(201).json(await proyectos.crear(valores));
  });

  rutas.put('/:id', async (solicitud, respuesta) => {
    const id = leerId(solicitud.params.id, 'El proyecto');
    const valores = exigirValido(validarProyecto(solicitud.body));
    await exigirClienteExistente(valores.clienteId);
    const proyecto = await proyectos.actualizar(id, valores);
    if (!proyecto) throw noEncontrado('El proyecto');
    respuesta.json(proyecto);
  });

  rutas.post('/:id/etapas', async (solicitud, respuesta) => {
    const proyecto = await exigirProyecto(solicitud.params.id);
    const valores = exigirValido(validarEtapa(solicitud.body));
    const etapa = await traducirOrdenRepetido(() => etapas.crear(proyecto.id, valores));
    respuesta.status(201).json({ ...etapa, actividades: [] });
  });

  rutas.get('/:id/avances', async (solicitud, respuesta) => {
    const proyecto = await exigirProyecto(solicitud.params.id);
    respuesta.json(await avances.listarPorProyecto(proyecto.id));
  });

  rutas.post('/:id/avances', async (solicitud, respuesta) => {
    const proyecto = await exigirProyecto(solicitud.params.id);
    const valores = exigirValido(validarAvance(solicitud.body));
    if (valores.etapaId !== null) {
      const etapa = await etapas.obtener(valores.etapaId);
      if (!etapa || etapa.proyectoId !== proyecto.id) {
        throw errorDeValidacion({ etapaId: 'La etapa no pertenece a este proyecto' });
      }
    }
    respuesta.status(201).json(await avances.registrar(proyecto.id, valores, solicitud.usuario.id));
  });

  return rutas;
}
