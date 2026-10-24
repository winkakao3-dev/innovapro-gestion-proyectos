import { Router } from 'express';
import { noEncontrado } from '../errores.js';
import { agregarEtapaActual, armarConsultaDeCliente } from './composicion.js';
import { leerId } from './parametros.js';

// Consulta del cliente: solo los proyectos del cliente ligado a la cuenta que inició sesión.
export function rutasMisProyectos(repositorios) {
  const { proyectos } = repositorios;
  const rutas = Router();

  rutas.get('/', async (solicitud, respuesta) => {
    const lista = await proyectos.listarDeUsuarioCliente(solicitud.usuario.id);
    const conEtapa = await agregarEtapaActual(lista, repositorios);
    respuesta.json(
      conEtapa.map(({ id, nombre, estado, porcentajeAvance, fechaInicio, fechaEstimadaTermino, etapaActual, totalEtapas, etapasTerminadas }) => ({
        id,
        nombre,
        estado,
        porcentajeAvance,
        fechaInicio,
        fechaEstimadaTermino,
        etapaActual,
        totalEtapas,
        etapasTerminadas,
      })),
    );
  });

  // Un proyecto ajeno responde igual que uno inexistente para no revelar que existe.
  rutas.get('/:id', async (solicitud, respuesta) => {
    const proyecto = await proyectos.obtenerDeUsuarioCliente(leerId(solicitud.params.id, 'El proyecto'), solicitud.usuario.id);
    if (!proyecto) throw noEncontrado('El proyecto');
    respuesta.json(await armarConsultaDeCliente(proyecto, repositorios));
  });

  return rutas;
}
