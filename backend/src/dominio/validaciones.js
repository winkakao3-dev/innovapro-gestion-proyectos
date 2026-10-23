export const ESTADOS_PROYECTO = ['planeado', 'en_curso', 'pausado', 'terminado'];
export const ESTADOS_ETAPA = ['pendiente', 'en_curso', 'terminada'];
export const ESTADOS_ACTIVIDAD = ['pendiente', 'en_curso', 'terminada'];

function texto(valor) {
  if (valor === undefined || valor === null) return '';
  return String(valor).trim();
}

function textoOpcional(valor) {
  const limpio = texto(valor);
  return limpio === '' ? null : limpio;
}

function enteroPositivo(valor) {
  const numero = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor;
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

export function esFechaValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().startsWith(valor);
}

function resultado(valores, errores) {
  return Object.keys(errores).length > 0 ? { ok: false, errores } : { ok: true, valores };
}

function exigirTexto(errores, campo, valor, { mensaje, maximo }) {
  if (!valor) errores[campo] = mensaje;
  else if (valor.length > maximo) errores[campo] = `Usa como máximo ${maximo} caracteres`;
}

function limitarTexto(errores, campo, valor, maximo) {
  if (valor && valor.length > maximo) errores[campo] = `Usa como máximo ${maximo} caracteres`;
}

function validarPeriodo(errores, inicio, fin, { campoInicio, campoFin, obligatorio }) {
  if (inicio === null) {
    if (obligatorio) errores[campoInicio] = 'Indica la fecha de inicio';
  } else if (!esFechaValida(inicio)) {
    errores[campoInicio] = 'La fecha no es válida';
  }
  if (fin === null) {
    if (obligatorio) errores[campoFin] = 'Indica la fecha de término';
  } else if (!esFechaValida(fin)) {
    errores[campoFin] = 'La fecha no es válida';
  }
  if (!errores[campoInicio] && !errores[campoFin] && inicio && fin && fin < inicio) {
    errores[campoFin] = 'No puede ser anterior a la fecha de inicio';
  }
}

export function validarCliente(datos = {}) {
  const valores = {
    nombre: texto(datos.nombre),
    contacto: textoOpcional(datos.contacto),
    correo: textoOpcional(datos.correo),
    telefono: textoOpcional(datos.telefono),
  };
  const errores = {};
  exigirTexto(errores, 'nombre', valores.nombre, { mensaje: 'Escribe el nombre del cliente', maximo: 150 });
  limitarTexto(errores, 'contacto', valores.contacto, 150);
  if (valores.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.correo)) errores.correo = 'El correo no es válido';
  limitarTexto(errores, 'correo', valores.correo, 150);
  if (valores.telefono && !/^[\d\s()+-]{7,30}$/.test(valores.telefono)) errores.telefono = 'Usa solo números, espacios y guiones';
  return resultado(valores, errores);
}

export function validarProyecto(datos = {}) {
  const valores = {
    clienteId: enteroPositivo(datos.clienteId),
    nombre: texto(datos.nombre),
    descripcion: textoOpcional(datos.descripcion),
    fechaInicio: textoOpcional(datos.fechaInicio),
    fechaEstimadaTermino: textoOpcional(datos.fechaEstimadaTermino),
    estado: textoOpcional(datos.estado) ?? 'planeado',
    enlaceDemo: textoOpcional(datos.enlaceDemo),
  };
  const errores = {};
  if (valores.clienteId === null) errores.clienteId = 'Elige el cliente del proyecto';
  exigirTexto(errores, 'nombre', valores.nombre, { mensaje: 'Escribe el nombre del proyecto', maximo: 150 });
  validarPeriodo(errores, valores.fechaInicio, valores.fechaEstimadaTermino, {
    campoInicio: 'fechaInicio',
    campoFin: 'fechaEstimadaTermino',
    obligatorio: true,
  });
  if (errores.fechaEstimadaTermino === 'Indica la fecha de término') {
    errores.fechaEstimadaTermino = 'Indica la fecha estimada de término';
  }
  if (!ESTADOS_PROYECTO.includes(valores.estado)) errores.estado = 'Elige un estado de la lista';
  if (valores.enlaceDemo && !/^https?:\/\/\S+$/.test(valores.enlaceDemo)) {
    errores.enlaceDemo = 'El enlace debe empezar con http:// o https://';
  }
  limitarTexto(errores, 'enlaceDemo', valores.enlaceDemo, 500);
  return resultado(valores, errores);
}

export function validarEtapa(datos = {}) {
  const valores = {
    nombre: texto(datos.nombre),
    orden: enteroPositivo(datos.orden),
    fechaInicio: textoOpcional(datos.fechaInicio),
    fechaFin: textoOpcional(datos.fechaFin),
    estado: textoOpcional(datos.estado) ?? 'pendiente',
  };
  const errores = {};
  exigirTexto(errores, 'nombre', valores.nombre, { mensaje: 'Escribe el nombre de la etapa', maximo: 100 });
  if (valores.orden === null) errores.orden = 'El orden debe ser un número entero mayor que 0';
  else if (valores.orden > 100) errores.orden = 'El orden debe ser menor o igual a 100';
  validarPeriodo(errores, valores.fechaInicio, valores.fechaFin, {
    campoInicio: 'fechaInicio',
    campoFin: 'fechaFin',
    obligatorio: false,
  });
  if (!ESTADOS_ETAPA.includes(valores.estado)) errores.estado = 'Elige un estado de la lista';
  return resultado(valores, errores);
}

export function validarActividad(datos = {}) {
  const valores = {
    descripcion: texto(datos.descripcion),
    responsable: texto(datos.responsable),
    fechaLimite: textoOpcional(datos.fechaLimite),
    estado: textoOpcional(datos.estado) ?? 'pendiente',
  };
  const errores = {};
  exigirTexto(errores, 'descripcion', valores.descripcion, { mensaje: 'Describe la actividad', maximo: 300 });
  exigirTexto(errores, 'responsable', valores.responsable, { mensaje: 'Indica quién es responsable', maximo: 150 });
  if (valores.fechaLimite === null) errores.fechaLimite = 'Indica la fecha límite';
  else if (!esFechaValida(valores.fechaLimite)) errores.fechaLimite = 'La fecha no es válida';
  if (!ESTADOS_ACTIVIDAD.includes(valores.estado)) errores.estado = 'Elige un estado de la lista';
  return resultado(valores, errores);
}

export function validarAvance(datos = {}) {
  const porcentaje = typeof datos.porcentaje === 'string' && datos.porcentaje.trim() !== '' ? Number(datos.porcentaje) : datos.porcentaje;
  const valores = {
    porcentaje,
    etapaId: datos.etapaId === undefined || datos.etapaId === null || datos.etapaId === '' ? null : enteroPositivo(datos.etapaId),
    comentario: textoOpcional(datos.comentario),
  };
  const errores = {};
  if (!Number.isInteger(porcentaje) || porcentaje < 0 || porcentaje > 100) {
    errores.porcentaje = 'El avance debe ser un número entero de 0 a 100';
  }
  if (valores.etapaId === null && datos.etapaId !== undefined && datos.etapaId !== null && datos.etapaId !== '') {
    errores.etapaId = 'La etapa no es válida';
  }
  limitarTexto(errores, 'comentario', valores.comentario, 300);
  return resultado(valores, errores);
}

// La etapa actual es la que está en curso; si no hay, la primera pendiente; si todas terminaron, la última.
export function elegirEtapaActual(etapas) {
  const ordenadas = [...etapas].sort((a, b) => a.orden - b.orden);
  return (
    ordenadas.find((etapa) => etapa.estado === 'en_curso') ??
    ordenadas.find((etapa) => etapa.estado === 'pendiente') ??
    ordenadas.at(-1) ??
    null
  );
}
