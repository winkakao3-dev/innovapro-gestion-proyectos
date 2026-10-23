import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { crearApp } from '../src/app.js';
import { sesionDePrueba } from '../src/autenticacion/sesion-de-prueba.js';
import { crearRepositorios } from '../src/datos/repositorios.js';
import { crearBaseDePrueba } from './bd-de-prueba.js';

const CLIENTE_1 = { 'x-usuario-prueba': '11111111-1111-4111-8111-000000000001', 'x-rol-prueba': 'cliente' };
const CLIENTE_2 = { 'x-usuario-prueba': '11111111-1111-4111-8111-000000000002', 'x-rol-prueba': 'cliente' };

let base;
let servidor;
let urlBase;

async function pedir(metodo, ruta, { cuerpo, encabezados = {} } = {}) {
  const respuesta = await fetch(`${urlBase}${ruta}`, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...encabezados },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await respuesta.text();
  return { estado: respuesta.status, datos: texto ? JSON.parse(texto) : null };
}

before(async () => {
  base = await crearBaseDePrueba();
  const app = crearApp({
    repositorios: crearRepositorios(base.conexion),
    autenticacion: sesionDePrueba(),
    origenesPermitidos: [],
  });
  await new Promise((listo) => {
    servidor = app.listen(0, listo);
  });
  urlBase = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  await new Promise((listo) => servidor.close(listo));
  await base.borrar();
});

describe('clientes', () => {
  it('lista los 5 clientes de prueba y busca por nombre', async () => {
    assert.equal((await pedir('GET', '/api/clientes')).datos.length, 5);
    const { datos } = await pedir('GET', '/api/clientes?buscar=sierra');
    assert.deepEqual(datos.map((cliente) => cliente.nombre), ['Plásticos Sierra Madre']);
  });

  it('trata los comodines de la búsqueda como texto', async () => {
    assert.equal((await pedir('GET', '/api/clientes?buscar=%25')).datos.length, 0);
  });

  it('registra y edita un cliente, y responde 422 con los campos inválidos', async () => {
    const invalido = await pedir('POST', '/api/clientes', { cuerpo: { nombre: '', correo: 'x' } });
    assert.equal(invalido.estado, 422);
    assert.ok(invalido.datos.campos.nombre && invalido.datos.campos.correo);

    const creado = await pedir('POST', '/api/clientes', { cuerpo: { nombre: 'Troqueles Cuauhtémoc', correo: 'compras@example.com' } });
    assert.equal(creado.estado, 201);
    const editado = await pedir('PUT', `/api/clientes/${creado.datos.id}`, { cuerpo: { nombre: 'Troqueles Cuauhtémoc SA' } });
    assert.equal(editado.datos.nombre, 'Troqueles Cuauhtémoc SA');
    assert.equal(editado.datos.correo, null);
  });

  it('responde 404 para un cliente que no existe o un id mal formado', async () => {
    assert.equal((await pedir('GET', '/api/clientes/9999')).estado, 404);
    assert.equal((await pedir('GET', '/api/clientes/abc')).estado, 404);
  });
});

describe('proyectos', () => {
  it('lista los 10 proyectos con su etapa actual y filtra por estado y búsqueda', async () => {
    const todos = await pedir('GET', '/api/proyectos');
    assert.equal(todos.datos.length, 10);
    const linea = todos.datos.find((proyecto) => proyecto.id === 1);
    assert.equal(linea.etapaActual.nombre, 'Ejecución');
    assert.equal(linea.etapasTerminadas, 2);

    const terminados = await pedir('GET', '/api/proyectos?estado=terminado');
    assert.deepEqual(terminados.datos.map((proyecto) => proyecto.id).sort(), [3, 7]);
    assert.equal((await pedir('GET', '/api/proyectos?estado=borrado')).estado, 422);

    const porCliente = await pedir('GET', '/api/proyectos?buscar=ensambles');
    assert.deepEqual(porCliente.datos.map((proyecto) => proyecto.id).sort(), [2, 7]);
  });

  it('no registra un proyecto sin cliente, nombre o fechas', async () => {
    const respuesta = await pedir('POST', '/api/proyectos', { cuerpo: {} });
    assert.equal(respuesta.estado, 422);
    assert.deepEqual(Object.keys(respuesta.datos.campos).sort(), ['clienteId', 'fechaEstimadaTermino', 'fechaInicio', 'nombre']);
  });

  it('no registra un proyecto de un cliente que no existe', async () => {
    const respuesta = await pedir('POST', '/api/proyectos', {
      cuerpo: { clienteId: 9999, nombre: 'Prueba', fechaInicio: '2026-11-02', fechaEstimadaTermino: '2026-12-04' },
    });
    assert.equal(respuesta.estado, 422);
    assert.equal(respuesta.datos.campos.clienteId, 'El cliente elegido no existe');
  });

  it('registra y edita un proyecto sin cambiar su avance', async () => {
    const creado = await pedir('POST', '/api/proyectos', {
      cuerpo: { clienteId: 2, nombre: 'Robot paletizador', fechaInicio: '2026-11-02', fechaEstimadaTermino: '2027-03-05' },
    });
    assert.equal(creado.estado, 201);
    assert.equal(creado.datos.porcentajeAvance, 0);
    assert.equal(creado.datos.fechaInicio, '2026-11-02');

    const editado = await pedir('PUT', `/api/proyectos/${creado.datos.id}`, {
      cuerpo: { ...creado.datos, estado: 'en_curso', porcentajeAvance: 90 },
    });
    assert.equal(editado.datos.estado, 'en_curso');
    assert.equal(editado.datos.porcentajeAvance, 0);
  });

  it('devuelve el detalle con etapas, actividades e historial', async () => {
    const { datos } = await pedir('GET', '/api/proyectos/1');
    assert.equal(datos.clienteNombre, 'Manufacturas del Norte');
    assert.deepEqual(datos.etapas.map((etapa) => etapa.nombre), ['Levantamiento', 'Diseño', 'Ejecución', 'Entrega']);
    assert.equal(datos.etapas[0].actividades.length, 2);
    assert.deepEqual(datos.historialAvance.map((avance) => avance.porcentaje), [60, 50, 25]);
  });
});

describe('etapas y actividades', () => {
  it('registra una etapa, rechaza un orden repetido y la edita', async () => {
    const creada = await pedir('POST', '/api/proyectos/4/etapas', { cuerpo: { nombre: 'Garantía', orden: 5 } });
    assert.equal(creada.estado, 201);
    assert.equal(creada.datos.estado, 'pendiente');

    const repetida = await pedir('POST', '/api/proyectos/4/etapas', { cuerpo: { nombre: 'Otra', orden: 5 } });
    assert.equal(repetida.estado, 409);
    assert.ok(repetida.datos.campos.orden);

    const editada = await pedir('PUT', `/api/etapas/${creada.datos.id}`, {
      cuerpo: { nombre: 'Garantía', orden: 5, fechaInicio: '2027-03-01', fechaFin: '2027-02-01' },
    });
    assert.equal(editada.estado, 422);
    assert.ok(editada.datos.campos.fechaFin);
  });

  it('registra una actividad, la marca como terminada y la reabre', async () => {
    const { datos: proyecto } = await pedir('GET', '/api/proyectos/4');
    const etapaId = proyecto.etapas[0].id;
    const creada = await pedir('POST', `/api/etapas/${etapaId}/actividades`, {
      cuerpo: { descripcion: 'Medir el área de la banda', responsable: 'Carlos Ibarra', fechaLimite: '2026-11-20' },
    });
    assert.equal(creada.estado, 201);
    assert.equal(creada.datos.terminadaEn, null);

    const terminada = await pedir('PUT', `/api/actividades/${creada.datos.id}`, { cuerpo: { ...creada.datos, estado: 'terminada' } });
    assert.equal(terminada.datos.estado, 'terminada');
    assert.ok(terminada.datos.terminadaEn);

    const reabierta = await pedir('PUT', `/api/actividades/${creada.datos.id}`, { cuerpo: { ...creada.datos, estado: 'en_curso' } });
    assert.equal(reabierta.datos.terminadaEn, null);

    assert.equal((await pedir('DELETE', `/api/actividades/${creada.datos.id}`)).estado, 204);
    assert.equal((await pedir('DELETE', `/api/actividades/${creada.datos.id}`)).estado, 404);
  });
});

describe('avance', () => {
  it('rechaza porcentajes fuera de 0 a 100 y etapas de otro proyecto', async () => {
    assert.equal((await pedir('POST', '/api/proyectos/2/avances', { cuerpo: { porcentaje: 120 } })).estado, 422);
    const { datos: otro } = await pedir('GET', '/api/proyectos/1');
    const ajena = await pedir('POST', '/api/proyectos/2/avances', { cuerpo: { porcentaje: 40, etapaId: otro.etapas[0].id } });
    assert.equal(ajena.estado, 422);
    assert.equal(ajena.datos.campos.etapaId, 'La etapa no pertenece a este proyecto');
  });

  it('guarda el valor, la fecha y el usuario, y actualiza el proyecto', async () => {
    const { datos: proyecto } = await pedir('GET', '/api/proyectos/2');
    const etapa = proyecto.etapas.find((item) => item.estado === 'en_curso');
    const registrado = await pedir('POST', '/api/proyectos/2/avances', {
      cuerpo: { porcentaje: 50, etapaId: etapa.id, comentario: 'Cierre del diseño' },
    });
    assert.equal(registrado.estado, 201);
    assert.equal(registrado.datos.modificadoPor, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001');
    assert.equal(registrado.datos.etapaNombre, etapa.nombre);
    assert.ok(registrado.datos.registradoEn);

    const { datos: actualizado } = await pedir('GET', '/api/proyectos/2');
    assert.equal(actualizado.porcentajeAvance, 50);
    assert.equal(actualizado.historialAvance[0].porcentaje, 50);
  });
});

describe('consulta del cliente', () => {
  it('muestra a cada cliente solo sus proyectos, con etapa actual y avance', async () => {
    const { datos } = await pedir('GET', '/api/mis-proyectos', { encabezados: CLIENTE_1 });
    assert.deepEqual(datos.map((proyecto) => proyecto.id).sort(), [1, 3]);
    assert.ok(datos.every((proyecto) => proyecto.etapaActual && Number.isInteger(proyecto.porcentajeAvance)));
  });

  it('no revela proyectos de otro cliente', async () => {
    assert.equal((await pedir('GET', '/api/mis-proyectos/1', { encabezados: CLIENTE_2 })).estado, 404);
    const propio = await pedir('GET', '/api/mis-proyectos/1', { encabezados: CLIENTE_1 });
    assert.equal(propio.estado, 200);
    assert.equal(propio.datos.etapas.length, 4);
    assert.equal(propio.datos.historialAvance[0].modificadoPor, undefined);
    assert.equal(propio.datos.etapas[0].actividades, undefined);
  });

  it('un cliente no entra a la administración y el personal no entra a la consulta del cliente', async () => {
    assert.equal((await pedir('GET', '/api/proyectos', { encabezados: CLIENTE_1 })).estado, 403);
    assert.equal((await pedir('GET', '/api/clientes', { encabezados: CLIENTE_1 })).estado, 403);
    assert.equal((await pedir('GET', '/api/mis-proyectos')).estado, 403);
  });

  it('rechaza una sesión de prueba mal formada', async () => {
    const respuesta = await pedir('GET', '/api/mis-proyectos', { encabezados: { 'x-usuario-prueba': 'nadie', 'x-rol-prueba': 'cliente' } });
    assert.equal(respuesta.estado, 401);
  });
});
