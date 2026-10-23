import { encabezadosDeSesion } from './sesion.jsx';

const URL_BASE = import.meta.env.VITE_URL_API ?? '';

export class ErrorDeApi extends Error {
  constructor(estado, mensaje, campos = {}) {
    super(mensaje);
    this.estado = estado;
    this.campos = campos;
  }
}

async function pedir(ruta, { metodo = 'GET', cuerpo } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${URL_BASE}/api${ruta}`, {
      method: metodo,
      headers: { 'content-type': 'application/json', ...encabezadosDeSesion() },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorDeApi(0, 'No hay conexión con los servicios. Revisa que el backend esté encendido.');
  }
  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ErrorDeApi(respuesta.status, datos?.error ?? 'No se pudo completar la operación', datos?.campos ?? {});
  }
  return datos;
}

function consulta(parametros) {
  const texto = new URLSearchParams(
    Object.entries(parametros).filter(([, valor]) => valor !== undefined && valor !== null && valor !== ''),
  ).toString();
  return texto ? `?${texto}` : '';
}

export const api = {
  clientes: {
    listar: (buscar) => pedir(`/clientes${consulta({ buscar })}`),
    obtener: (id) => pedir(`/clientes/${id}`),
    crear: (datos) => pedir('/clientes', { metodo: 'POST', cuerpo: datos }),
    actualizar: (id, datos) => pedir(`/clientes/${id}`, { metodo: 'PUT', cuerpo: datos }),
  },
  proyectos: {
    listar: (filtros) => pedir(`/proyectos${consulta(filtros)}`),
    obtener: (id) => pedir(`/proyectos/${id}`),
    crear: (datos) => pedir('/proyectos', { metodo: 'POST', cuerpo: datos }),
    actualizar: (id, datos) => pedir(`/proyectos/${id}`, { metodo: 'PUT', cuerpo: datos }),
    registrarAvance: (id, datos) => pedir(`/proyectos/${id}/avances`, { metodo: 'POST', cuerpo: datos }),
    crearEtapa: (id, datos) => pedir(`/proyectos/${id}/etapas`, { metodo: 'POST', cuerpo: datos }),
  },
  etapas: {
    actualizar: (id, datos) => pedir(`/etapas/${id}`, { metodo: 'PUT', cuerpo: datos }),
    eliminar: (id) => pedir(`/etapas/${id}`, { metodo: 'DELETE' }),
    crearActividad: (id, datos) => pedir(`/etapas/${id}/actividades`, { metodo: 'POST', cuerpo: datos }),
  },
  actividades: {
    actualizar: (id, datos) => pedir(`/actividades/${id}`, { metodo: 'PUT', cuerpo: datos }),
    eliminar: (id) => pedir(`/actividades/${id}`, { metodo: 'DELETE' }),
  },
  misProyectos: {
    listar: () => pedir('/mis-proyectos'),
    obtener: (id) => pedir(`/mis-proyectos/${id}`),
  },
};
