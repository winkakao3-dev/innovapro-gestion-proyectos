import { elegirEtapaActual } from '../dominio/validaciones.js';

function agruparPor(elementos, clave) {
  const grupos = new Map();
  for (const elemento of elementos) {
    const lista = grupos.get(elemento[clave]) ?? [];
    lista.push(elemento);
    grupos.set(elemento[clave], lista);
  }
  return grupos;
}

function resumirEtapa(etapa) {
  return etapa ? { id: etapa.id, nombre: etapa.nombre, orden: etapa.orden, estado: etapa.estado } : null;
}

export async function agregarEtapaActual(proyectos, { etapas }) {
  const porProyecto = agruparPor(await etapas.listarPorProyectos(proyectos.map((proyecto) => proyecto.id)), 'proyectoId');
  return proyectos.map((proyecto) => {
    const delProyecto = porProyecto.get(proyecto.id) ?? [];
    return {
      ...proyecto,
      etapaActual: resumirEtapa(elegirEtapaActual(delProyecto)),
      totalEtapas: delProyecto.length,
      etapasTerminadas: delProyecto.filter((etapa) => etapa.estado === 'terminada').length,
    };
  });
}

export async function armarDetalleProyecto(proyecto, { etapas, actividades, avances }) {
  const etapasDelProyecto = await etapas.listarPorProyectos([proyecto.id]);
  const porEtapa = agruparPor(await actividades.listarPorEtapas(etapasDelProyecto.map((etapa) => etapa.id)), 'etapaId');
  return {
    ...proyecto,
    etapaActual: resumirEtapa(elegirEtapaActual(etapasDelProyecto)),
    etapas: etapasDelProyecto.map((etapa) => ({ ...etapa, actividades: porEtapa.get(etapa.id) ?? [] })),
    historialAvance: await avances.listarPorProyecto(proyecto.id),
  };
}

// Lo que ve un cliente: su proyecto, la etapa actual, las etapas y el historial del porcentaje, sin datos internos.
export async function armarConsultaDeCliente(proyecto, { etapas, avances }) {
  const etapasDelProyecto = await etapas.listarPorProyectos([proyecto.id]);
  const historial = await avances.listarPorProyecto(proyecto.id);
  return {
    id: proyecto.id,
    nombre: proyecto.nombre,
    descripcion: proyecto.descripcion,
    fechaInicio: proyecto.fechaInicio,
    fechaEstimadaTermino: proyecto.fechaEstimadaTermino,
    estado: proyecto.estado,
    porcentajeAvance: proyecto.porcentajeAvance,
    enlaceDemo: proyecto.enlaceDemo,
    etapaActual: resumirEtapa(elegirEtapaActual(etapasDelProyecto)),
    etapas: etapasDelProyecto.map(({ id, nombre, orden, fechaInicio, fechaFin, estado }) => ({
      id,
      nombre,
      orden,
      fechaInicio,
      fechaFin,
      estado,
    })),
    historialAvance: historial.map(({ id, porcentaje, etapaNombre, registradoEn }) => ({
      id,
      porcentaje,
      etapaNombre,
      registradoEn,
    })),
  };
}
