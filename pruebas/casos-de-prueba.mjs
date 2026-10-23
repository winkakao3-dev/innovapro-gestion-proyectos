// Ejecuta los 20 casos de prueba funcionales (actividad 12) contra la app corriendo en local
// y escribe el registro de resultados en docs/pruebas/. Requiere la base recién reiniciada
// (npm run bd:reiniciar) porque los resultados esperados dependen de los datos de prueba.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const BASE = process.env.URL_APP ?? 'http://localhost:5173';
const CHROME = process.env.RUTA_CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CARPETA = new URL('../docs/pruebas/', import.meta.url);
const EVIDENCIAS = new URL('evidencias/', CARPETA);
const ESPERA = 6000;

const navegador = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await navegador.newPage();
await page.setViewport({ width: 1280, height: 860 });
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

const contexto = {};

async function ir(ruta) {
  await page.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle0' });
}

async function esperarTexto(texto, dentroDe = 'body') {
  await page.waitForFunction(
    (selector, buscado) => document.querySelector(selector)?.innerText.includes(buscado),
    { timeout: ESPERA },
    dentroDe,
    texto,
  );
}

async function clic(texto) {
  await page.locator(`::-p-text(${texto})`).setTimeout(ESPERA).click();
}

// Selecciona el contenido y lo reemplaza al teclear, como lo haría una persona.
async function escribir(selector, valor) {
  await vaciar(selector);
  await page.type(selector, valor);
}

async function vaciar(selector) {
  await page.waitForSelector(selector, { timeout: ESPERA });
  await page.$eval(selector, (campo) => campo.select());
  await page.keyboard.press('Backspace');
}

// Los campos de fecha no aceptan texto escrito igual en todos los idiomas; se asigna el valor como lo haría el selector de fecha.
async function fijarFecha(selector, valor) {
  await page.$eval(selector, (campo, nuevo) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(campo, nuevo);
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  }, valor);
}

async function elegirPorTexto(selector, texto) {
  const valor = await page.$eval(selector, (lista, buscado) => [...lista.options].find((opcion) => opcion.textContent.includes(buscado))?.value, texto);
  if (!valor) throw new Error(`No hay opción "${texto}" en ${selector}`);
  await page.select(selector, valor);
}

async function enviarFormularioDe(selector) {
  await page.$eval(selector, (campo) => campo.form.requestSubmit());
}

async function textoDe(selector) {
  await page.waitForSelector(selector, { timeout: ESPERA });
  return page.$eval(selector, (elemento) => elemento.textContent.trim());
}

async function etapa(nombre) {
  await page.waitForFunction((buscado) => [...document.querySelectorAll('li.etapa h3')].some((titulo) => titulo.textContent === buscado), { timeout: ESPERA }, nombre);
  return page.evaluateHandle((buscado) => [...document.querySelectorAll('li.etapa')].find((li) => li.querySelector('h3')?.textContent === buscado), nombre);
}

async function nombresDeProyectos() {
  return page.$$eval('.fila-proyecto', (filas) => filas.map((fila) => ({
    nombre: fila.querySelector('.fila-proyecto-nombre')?.textContent.trim(),
    texto: fila.innerText,
  })));
}

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

async function usarSesion(clave) {
  await page.evaluate((valor) => localStorage.setItem('innovapro.sesionDePrueba', valor), clave);
}

const CASOS = [
  {
    id: 'CP-01', modulo: 'Clientes', titulo: 'Registrar un cliente con todos sus datos',
    pasos: 'Abrir Clientes > Nuevo cliente, capturar empresa, contacto, correo y teléfono, y guardar.',
    esperado: 'Aviso «Cliente registrado» y el cliente aparece en la lista.',
    async ejecutar() {
      await ir('/clientes/nuevo');
      await escribir('#cliente-nombre', 'Fundiciones del Valle');
      await escribir('#cliente-contacto', 'Ingeniería de planta');
      await escribir('#cliente-correo', 'planta@fundiciones.example.com');
      await escribir('#cliente-telefono', '614 555 0101');
      await clic('Registrar cliente');
      await esperarTexto('Cliente registrado');
      await ir('/clientes');
      await esperarTexto('Fundiciones del Valle');
      return 'Se muestra el aviso y «Fundiciones del Valle» aparece en la lista de clientes.';
    },
  },
  {
    id: 'CP-02', modulo: 'Clientes', titulo: 'Rechazar un cliente sin nombre y con correo inválido',
    pasos: 'Abrir Nuevo cliente, dejar la empresa vacía, escribir «correo-malo» en correo y guardar.',
    esperado: 'No se guarda; aparecen «Escribe el nombre del cliente» y «El correo no es válido» debajo de cada campo.',
    async ejecutar() {
      await ir('/clientes/nuevo');
      await escribir('#cliente-correo', 'correo-malo');
      await clic('Registrar cliente');
      const nombre = await textoDe('#cliente-nombre-error');
      const correo = await textoDe('#cliente-correo-error');
      exigir(nombre === 'Escribe el nombre del cliente', `Mensaje de nombre: ${nombre}`);
      exigir(correo === 'El correo no es válido', `Mensaje de correo: ${correo}`);
      exigir(page.url().endsWith('/clientes/nuevo'), 'La página cambió como si se hubiera guardado');
      return `Se muestran «${nombre}» y «${correo}»; el formulario no se envía.`;
    },
  },
  {
    id: 'CP-03', modulo: 'Clientes', titulo: 'Editar los datos de un cliente',
    pasos: 'En la lista de clientes, abrir Editar de «Fundiciones del Valle», cambiar el contacto y guardar.',
    esperado: 'Aviso «Cambios guardados» y la lista muestra el contacto nuevo.',
    async ejecutar() {
      await ir('/clientes');
      const fila = await page.waitForSelector('::-p-xpath(//li[contains(@class,"fila-cliente")][.//*[text()="Fundiciones del Valle"]])', { timeout: ESPERA });
      await (await fila.$('::-p-text(Editar)')).click();
      await page.waitForSelector('#cliente-contacto', { timeout: ESPERA });
      await escribir('#cliente-contacto', 'Gerencia de mantenimiento');
      await clic('Guardar cambios');
      await esperarTexto('Cambios guardados');
      await ir('/clientes');
      await esperarTexto('Gerencia de mantenimiento');
      return 'Se guarda el cambio y la lista muestra «Gerencia de mantenimiento».';
    },
  },
  {
    id: 'CP-04', modulo: 'Proyectos', titulo: 'Registrar un proyecto con los datos obligatorios',
    pasos: 'Abrir Nuevo proyecto, elegir el cliente, capturar nombre, fecha de inicio y fecha estimada de término, y registrar.',
    esperado: 'Aviso «Proyecto registrado» y se abre el detalle del proyecto nuevo.',
    async ejecutar() {
      await ir('/proyectos/nuevo');
      await page.waitForSelector('#proyecto-clienteId option:nth-child(2)', { timeout: ESPERA });
      await elegirPorTexto('#proyecto-clienteId', 'Fundiciones del Valle');
      await escribir('#proyecto-nombre', 'Horno de templado');
      await fijarFecha('#proyecto-fechaInicio', '2026-11-03');
      await fijarFecha('#proyecto-fechaEstimadaTermino', '2027-02-26');
      await clic('Registrar proyecto');
      await esperarTexto('Proyecto registrado');
      await page.waitForFunction(() => /\/proyectos\/\d+$/.test(location.pathname), { timeout: ESPERA });
      await esperarTexto('Horno de templado', 'h1');
      contexto.proyectoNuevo = page.url().split('/').pop();
      return `Se registra y se abre el detalle /proyectos/${contexto.proyectoNuevo}.`;
    },
  },
  {
    id: 'CP-05', modulo: 'Proyectos', titulo: 'Rechazar un proyecto sin datos obligatorios',
    pasos: 'Abrir Nuevo proyecto y registrar sin capturar nada.',
    esperado: 'No se guarda; aparecen los mensajes de cliente, nombre, fecha de inicio y fecha estimada de término.',
    async ejecutar() {
      await ir('/proyectos/nuevo');
      await clic('Registrar proyecto');
      await page.waitForSelector('.campo-error', { timeout: ESPERA });
      const mensajes = await page.$$eval('.campo-error', (errores) => errores.map((error) => error.textContent.trim()));
      const esperados = ['Elige el cliente del proyecto', 'Escribe el nombre del proyecto', 'Indica la fecha de inicio', 'Indica la fecha estimada de término'];
      for (const mensaje of esperados) exigir(mensajes.includes(mensaje), `Falta el mensaje «${mensaje}»; hay: ${mensajes.join(' / ')}`);
      return `Aparecen los 4 mensajes: ${mensajes.join('; ')}.`;
    },
  },
  {
    id: 'CP-06', modulo: 'Proyectos', titulo: 'Rechazar una fecha de término anterior a la de inicio',
    pasos: 'En Nuevo proyecto, capturar inicio 01/12/2026 y término 01/11/2026 con los demás datos completos, y registrar.',
    esperado: 'No se guarda; debajo de la fecha de término aparece «No puede ser anterior a la fecha de inicio».',
    async ejecutar() {
      await ir('/proyectos/nuevo');
      await page.waitForSelector('#proyecto-clienteId option:nth-child(2)', { timeout: ESPERA });
      await elegirPorTexto('#proyecto-clienteId', 'Fundiciones del Valle');
      await escribir('#proyecto-nombre', 'Proyecto con fechas invertidas');
      await fijarFecha('#proyecto-fechaInicio', '2026-12-01');
      await fijarFecha('#proyecto-fechaEstimadaTermino', '2026-11-01');
      await clic('Registrar proyecto');
      const mensaje = await textoDe('#proyecto-fechaEstimadaTermino-error');
      exigir(mensaje === 'No puede ser anterior a la fecha de inicio', `Mensaje: ${mensaje}`);
      return `Aparece «${mensaje}» y el proyecto no se registra.`;
    },
  },
  {
    id: 'CP-07', modulo: 'Proyectos', titulo: 'Editar el estado de un proyecto',
    pasos: 'Abrir Editar proyecto de «Horno de templado», cambiar el estado a Pausado y guardar; filtrar la lista por Pausado.',
    esperado: 'Aviso «Cambios guardados» y el proyecto aparece en el filtro Pausado.',
    async ejecutar() {
      await ir(`/proyectos/${contexto.proyectoNuevo}/editar`);
      await page.waitForFunction(() => document.querySelector('#proyecto-nombre')?.value === 'Horno de templado', { timeout: ESPERA });
      await page.select('#proyecto-estado', 'pausado');
      await clic('Guardar cambios');
      await esperarTexto('Cambios guardados');
      await ir('/proyectos?estado=pausado');
      await esperarTexto('Horno de templado');
      return 'Se guarda el estado y «Horno de templado» aparece al filtrar por Pausado.';
    },
  },
  {
    id: 'CP-08', modulo: 'Proyectos', titulo: 'Buscar proyectos por nombre del cliente',
    pasos: 'En Proyectos, escribir «Ensambles» en el buscador.',
    esperado: 'Solo aparecen los 2 proyectos de Ensambles Chihuahua.',
    async ejecutar() {
      await ir('/proyectos');
      await page.waitForSelector('.fila-proyecto', { timeout: ESPERA });
      await page.type('.buscador', 'Ensambles');
      await page.waitForFunction(() => new URLSearchParams(location.search).get('buscar') === 'Ensambles', { timeout: ESPERA });
      await page.waitForFunction(() => document.querySelectorAll('.fila-proyecto').length === 2, { timeout: ESPERA });
      const filas = await nombresDeProyectos();
      exigir(filas.every((fila) => fila.texto.includes('Ensambles Chihuahua')), 'Hay proyectos de otro cliente');
      return `Aparecen 2 proyectos: ${filas.map((fila) => fila.nombre).join(' y ')}.`;
    },
  },
  {
    id: 'CP-09', modulo: 'Proyectos', titulo: 'Filtrar proyectos por estado',
    pasos: 'En Proyectos, elegir el filtro Terminado.',
    esperado: 'Solo aparecen los 2 proyectos terminados.',
    async ejecutar() {
      await ir('/proyectos');
      await page.waitForSelector('.fila-proyecto', { timeout: ESPERA });
      await page.locator('.segmentado ::-p-text(Terminado)').click();
      await page.waitForFunction(() => document.querySelectorAll('.fila-proyecto').length === 2, { timeout: ESPERA });
      const filas = await nombresDeProyectos();
      exigir(filas.every((fila) => fila.texto.includes('Terminado')), 'Hay proyectos con otro estado');
      return `Aparecen 2 proyectos terminados: ${filas.map((fila) => fila.nombre).join(' y ')}.`;
    },
  },
  {
    id: 'CP-10', modulo: 'Proyectos', titulo: 'Búsqueda sin resultados',
    pasos: 'En Proyectos, escribir «zzzz» en el buscador.',
    esperado: 'Se muestra «Ningún proyecto coincide» en lugar de la lista.',
    async ejecutar() {
      await ir('/proyectos');
      await page.waitForSelector('.fila-proyecto', { timeout: ESPERA });
      await page.type('.buscador', 'zzzz');
      await esperarTexto('Ningún proyecto coincide');
      exigir((await page.$$('.fila-proyecto')).length === 0, 'Siguen apareciendo proyectos');
      return 'Se muestra el mensaje de búsqueda sin resultados y ningún proyecto.';
    },
  },
  {
    id: 'CP-11', modulo: 'Etapas', titulo: 'Agregar una etapa a un proyecto',
    pasos: 'En el detalle de «Horno de templado», usar Agregar etapa con el nombre «Levantamiento» y el orden propuesto.',
    esperado: 'Aviso «Etapa agregada» y la etapa aparece con el orden 1 y estado Pendiente.',
    async ejecutar() {
      await ir(`/proyectos/${contexto.proyectoNuevo}`);
      await esperarTexto('Define las etapas del proyecto');
      await clic('Agregar etapa');
      await escribir('#etapa-nueva-nombre', 'Levantamiento');
      const orden = await page.$eval('#etapa-nueva-orden', (campo) => campo.value);
      await enviarFormularioDe('#etapa-nueva-nombre');
      await esperarTexto('Etapa agregada');
      const tarjeta = await etapa('Levantamiento');
      const datos = await tarjeta.evaluate((li) => ({ orden: li.querySelector('.etapa-orden').textContent, estado: li.querySelector('select').value }));
      exigir(orden === '1' && datos.orden === '1' && datos.estado === 'pendiente', `Orden ${datos.orden}, estado ${datos.estado}`);
      return 'La etapa «Levantamiento» aparece con el orden 1 y estado Pendiente.';
    },
  },
  {
    id: 'CP-12', modulo: 'Etapas', titulo: 'Rechazar dos etapas con el mismo orden',
    pasos: 'Agregar otra etapa «Diseño» con el orden 1; después corregir el orden a 2 y guardar.',
    esperado: 'Primero aparece «Ya hay una etapa con ese orden»; con el orden 2 la etapa se agrega.',
    async ejecutar() {
      await clic('Agregar etapa');
      await escribir('#etapa-nueva-nombre', 'Diseño');
      await escribir('#etapa-nueva-orden', '1');
      await enviarFormularioDe('#etapa-nueva-nombre');
      const mensaje = await textoDe('#etapa-nueva-orden-error');
      exigir(mensaje === 'Ya hay una etapa con ese orden', `Mensaje: ${mensaje}`);
      await escribir('#etapa-nueva-orden', '2');
      await enviarFormularioDe('#etapa-nueva-nombre');
      await etapa('Diseño');
      return `Con el orden repetido aparece «${mensaje}»; con el orden 2 se agrega «Diseño».`;
    },
  },
  {
    id: 'CP-13', modulo: 'Etapas', titulo: 'Terminar una etapa abre el registro de avance',
    pasos: 'Cambiar el estado de «Levantamiento» a Terminada.',
    esperado: 'La etapa queda Terminada, se muestra el aviso para registrar el avance y se abre el panel de avance.',
    async ejecutar() {
      const tarjeta = await etapa('Levantamiento');
      const selector = await tarjeta.$('select');
      await selector.select('terminada');
      await esperarTexto('Etapa terminada. Registra el nuevo avance del proyecto.');
      await page.waitForSelector('#avance-porcentaje', { visible: true, timeout: ESPERA });
      return 'El estado cambia a Terminada, aparece el aviso y se abre el panel de avance.';
    },
  },
  {
    id: 'CP-14', modulo: 'Avance', titulo: 'Rechazar un avance fuera de 0 a 100',
    pasos: 'En el panel de avance, escribir 150 y guardar.',
    esperado: 'No se guarda; aparece «El avance debe ser un número entero de 0 a 100».',
    async ejecutar() {
      await escribir('#avance-porcentaje', '150');
      await clic('Guardar avance');
      await esperarTexto('El avance debe ser un número entero de 0 a 100');
      exigir((await textoDe('.numero-grande')) === '0%', 'El avance cambió');
      return 'Aparece el mensaje y el avance del proyecto sigue en 0%.';
    },
  },
  {
    id: 'CP-15', modulo: 'Avance', titulo: 'Registrar el avance con fecha, valor y usuario',
    pasos: 'En el panel de avance, escribir 25, el comentario «Levantamiento cerrado» y guardar.',
    esperado: 'El avance del proyecto pasa a 25% y el historial muestra el valor, el comentario, la fecha, la etapa y el usuario.',
    async ejecutar() {
      await escribir('#avance-porcentaje', '25');
      await escribir('#avance-comentario', 'Levantamiento cerrado');
      await clic('Guardar avance');
      await esperarTexto('Avance registrado: 25%');
      await page.waitForFunction(() => document.querySelector('.numero-grande')?.textContent === '25%', { timeout: ESPERA });
      const registro = await page.$eval('.historial-registro', (elemento) => elemento.innerText.replace(/\s*\n\s*/g, ' | '));
      exigir(registro.includes('25%') && registro.includes('Levantamiento cerrado') && registro.includes('Cuenta'), `Registro: ${registro}`);
      return `Avance en 25%; primer registro del historial: «${registro}».`;
    },
  },
  {
    id: 'CP-16', modulo: 'Actividades', titulo: 'Agregar una actividad a una etapa',
    pasos: 'En la etapa «Diseño», usar Agregar actividad con descripción, responsable y fecha límite.',
    esperado: 'Aviso «Actividad agregada» y la actividad aparece en la etapa con su responsable y fecha límite.',
    async ejecutar() {
      const tarjeta = await etapa('Diseño');
      await (await tarjeta.$('::-p-text(Agregar actividad)')).click();
      const idBase = await page.waitForSelector('[id^="actividad-nueva-"][id$="-descripcion"]', { timeout: ESPERA })
        .then((campo) => campo.evaluate((elemento) => elemento.id.replace(/-descripcion$/, '')));
      await escribir(`#${idBase}-descripcion`, 'Diseño del sistema de control de temperatura');
      await escribir(`#${idBase}-responsable`, 'Daniela Fuentes');
      await fijarFecha(`#${idBase}-fechaLimite`, '2026-12-11');
      await enviarFormularioDe(`#${idBase}-descripcion`);
      await esperarTexto('Actividad agregada');
      await esperarTexto('Daniela Fuentes', 'ol.etapas');
      contexto.actividadIdBase = idBase;
      return 'La actividad aparece en «Diseño» con Daniela Fuentes como responsable y límite 11 dic 2026.';
    },
  },
  {
    id: 'CP-17', modulo: 'Actividades', titulo: 'Rechazar una actividad sin responsable',
    pasos: 'En el formulario de actividad de «Diseño», que sigue abierto, escribir otra descripción, borrar el responsable y agregar.',
    esperado: 'No se guarda; aparece «Indica quién es responsable».',
    async ejecutar() {
      const idBase = contexto.actividadIdBase;
      await escribir(`#${idBase}-descripcion`, 'Actividad sin responsable');
      await vaciar(`#${idBase}-responsable`);
      await enviarFormularioDe(`#${idBase}-descripcion`);
      const mensaje = await textoDe(`#${idBase}-responsable-error`);
      exigir(mensaje === 'Indica quién es responsable', `Mensaje: ${mensaje}`);
      const tarjeta = await etapa('Diseño');
      const actividades = await tarjeta.$$eval('li.actividad', (filas) => filas.length);
      exigir(actividades === 1, `La etapa tiene ${actividades} actividades`);
      return `Aparece «${mensaje}» y la etapa sigue con 1 actividad.`;
    },
  },
  {
    id: 'CP-18', modulo: 'Actividades', titulo: 'Marcar una actividad como terminada y conservarlo al recargar',
    pasos: 'Marcar la casilla de la actividad nueva y recargar la página.',
    esperado: 'La casilla queda marcada después de recargar y la etapa indica «1 de 1 actividad terminada».',
    async ejecutar() {
      const casilla = 'button[aria-label*="Diseño del sistema de control de temperatura"][aria-checked]';
      await page.locator(casilla).setTimeout(ESPERA).click();
      await page.waitForFunction((selector) => document.querySelector(selector)?.getAttribute('aria-checked') === 'true', { timeout: ESPERA }, casilla);
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForFunction((selector) => document.querySelector(selector)?.getAttribute('aria-checked') === 'true', { timeout: ESPERA }, casilla);
      await esperarTexto('1 de 1 actividad terminada');
      return 'Después de recargar, la casilla sigue marcada y la etapa indica «1 de 1 actividad terminada».';
    },
  },
  {
    id: 'CP-19', modulo: 'Etapas', titulo: 'Eliminar una etapa con confirmación',
    pasos: 'En la etapa «Diseño», usar Eliminar y confirmar con «Sí, eliminar».',
    esperado: 'Se pide confirmación, aparece el aviso «Se eliminó la etapa Diseño» y la etapa desaparece.',
    async ejecutar() {
      const tarjeta = await etapa('Diseño');
      await (await tarjeta.$('::-p-text(Eliminar)')).click();
      await esperarTexto('No se puede deshacer');
      await clic('Sí, eliminar');
      await esperarTexto('Se eliminó la etapa Diseño');
      await page.waitForFunction(() => ![...document.querySelectorAll('li.etapa h3')].some((titulo) => titulo.textContent === 'Diseño'), { timeout: ESPERA });
      return 'Se pide confirmación y, al aceptar, la etapa «Diseño» y su actividad desaparecen.';
    },
  },
  {
    id: 'CP-20', modulo: 'Consulta del cliente', titulo: 'El cliente consulta solo sus propios proyectos',
    pasos: 'Entrar con la sesión de prueba de Manufacturas del Norte, revisar Mis proyectos y abrir la dirección de un proyecto de otro cliente (/mis-proyectos/2).',
    esperado: 'Aparecen solo sus 2 proyectos con etapa actual y avance; el proyecto de otro cliente muestra «No encontramos este proyecto».',
    async ejecutar() {
      await ir('/');
      await usarSesion('cliente-1');
      await ir('/mis-proyectos');
      await page.waitForSelector('.tarjeta-cliente', { timeout: ESPERA });
      const propios = await page.$$eval('.tarjeta-cliente h2', (titulos) => titulos.map((titulo) => titulo.textContent.trim()));
      exigir(propios.length === 2 && propios.includes('Línea de ensamble automatizada') && propios.includes('Sistema de visión para inspección'), `Proyectos: ${propios.join(', ')}`);
      await ir('/mis-proyectos/2');
      await esperarTexto('No encontramos este proyecto');
      await usarSesion('personal');
      return `Ve solo «${propios.join('» y «')}»; el proyecto 2, de otro cliente, aparece como no encontrado.`;
    },
  },
];

await mkdir(EVIDENCIAS, { recursive: true });
await ir('/');
await usarSesion('personal');

const resultados = [];
for (const caso of CASOS) {
  let obtenido;
  let pasa = true;
  try {
    obtenido = await caso.ejecutar();
  } catch (error) {
    pasa = false;
    obtenido = `Falla: ${error.message.split('\n')[0]}`;
  }
  await new Promise((listo) => setTimeout(listo, 700));
  await page.screenshot({ path: fileURLToPath(new URL(`${caso.id}.png`, EVIDENCIAS)) });
  resultados.push({ ...caso, obtenido, pasa });
  console.log(`${caso.id} ${pasa ? 'pasa' : 'FALLA'}  ${obtenido}`);
}
await navegador.close();

const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Chihuahua' }).format(new Date());
const aprobados = resultados.filter((resultado) => resultado.pasa).length;
const celda = (texto) => texto.replaceAll('|', '\\|');
const documento = [
  '# Casos de prueba del módulo de gestión de proyectos',
  '',
  `Ejecución: ${fecha}, contra la app en local con los datos de prueba recién cargados (\`npm run bd:reiniciar\`). Resultado: **${aprobados} de ${resultados.length} casos pasan**.`,
  '',
  'Los casos se ejecutan con `npm run pruebas:funcionales`, que maneja la app en Chrome como lo haría una persona y guarda una captura de cada caso en `evidencias/`. Este archivo lo genera el mismo script.',
  '',
  '| ID | Módulo | Caso | Pasos | Resultado esperado | Resultado obtenido | Estado |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...resultados.map((r) => `| ${r.id} | ${r.modulo} | ${celda(r.titulo)} | ${celda(r.pasos)} | ${celda(r.esperado)} | ${celda(r.obtenido)} | ${r.pasa ? 'Pasa' : 'Falla'} |`),
  '',
].join('\n');
await writeFile(new URL('casos-de-prueba.md', CARPETA), documento);
process.exitCode = aprobados === resultados.length ? 0 : 1;
