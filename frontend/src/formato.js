export const ESTADOS_PROYECTO = [
  { valor: 'planeado', etiqueta: 'Planeado' },
  { valor: 'en_curso', etiqueta: 'En curso' },
  { valor: 'pausado', etiqueta: 'Pausado' },
  { valor: 'terminado', etiqueta: 'Terminado' },
];

export const ESTADOS_ETAPA = [
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'en_curso', etiqueta: 'En curso' },
  { valor: 'terminada', etiqueta: 'Terminada' },
];

export function etiquetaDeEstado(valor) {
  return [...ESTADOS_PROYECTO, ...ESTADOS_ETAPA].find((estado) => estado.valor === valor)?.etiqueta ?? valor;
}

const FECHA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const FECHA_HORA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

// Las fechas llegan como AAAA-MM-DD; se leen en UTC para que no se recorran un día.
export function formatearFecha(valor) {
  return valor ? FECHA.format(new Date(`${valor}T00:00:00Z`)).replace('.', '') : 'Sin fecha';
}

export function formatearFechaHora(valor) {
  return FECHA_HORA.format(new Date(valor)).replace('.', '');
}

export function hoyEnTexto() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

export function plural(cantidad, singular, pluralTexto = `${singular}s`) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}
