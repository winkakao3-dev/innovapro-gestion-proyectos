import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  elegirEtapaActual,
  esFechaValida,
  validarActividad,
  validarAvance,
  validarCliente,
  validarEtapa,
  validarProyecto,
} from '../src/dominio/validaciones.js';

const proyectoValido = {
  clienteId: 1,
  nombre: 'Celda de soldadura',
  fechaInicio: '2026-10-05',
  fechaEstimadaTermino: '2026-12-18',
};

describe('validarProyecto', () => {
  it('acepta un proyecto con cliente, nombre y fechas, y pone el estado planeado por omisión', () => {
    const resultado = validarProyecto(proyectoValido);
    assert.equal(resultado.ok, true);
    assert.equal(resultado.valores.estado, 'planeado');
  });

  it('exige cliente, nombre, fecha de inicio y fecha estimada de término', () => {
    const resultado = validarProyecto({ nombre: '   ' });
    assert.equal(resultado.ok, false);
    assert.deepEqual(Object.keys(resultado.errores).sort(), ['clienteId', 'fechaEstimadaTermino', 'fechaInicio', 'nombre']);
    assert.equal(resultado.errores.fechaEstimadaTermino, 'Indica la fecha estimada de término');
  });

  it('rechaza un término anterior al inicio', () => {
    const resultado = validarProyecto({ ...proyectoValido, fechaEstimadaTermino: '2026-10-01' });
    assert.equal(resultado.errores.fechaEstimadaTermino, 'No puede ser anterior a la fecha de inicio');
  });

  it('rechaza estados fuera de la lista y enlaces que no son http', () => {
    const resultado = validarProyecto({ ...proyectoValido, estado: 'archivado', enlaceDemo: 'ftp://demo' });
    assert.ok(resultado.errores.estado);
    assert.ok(resultado.errores.enlaceDemo);
  });
});

describe('validarCliente', () => {
  it('exige el nombre y valida el correo', () => {
    const resultado = validarCliente({ nombre: '', correo: 'sin-arroba' });
    assert.equal(resultado.errores.nombre, 'Escribe el nombre del cliente');
    assert.equal(resultado.errores.correo, 'El correo no es válido');
  });

  it('convierte los campos vacíos en null', () => {
    const resultado = validarCliente({ nombre: ' Manufacturas ', contacto: '', correo: ' ' });
    assert.deepEqual(resultado.valores, { nombre: 'Manufacturas', contacto: null, correo: null, telefono: null });
  });
});

describe('validarEtapa y validarActividad', () => {
  it('exige un orden entero mayor que 0', () => {
    assert.ok(validarEtapa({ nombre: 'Diseño', orden: 0 }).errores.orden);
    assert.ok(validarEtapa({ nombre: 'Diseño', orden: 1.5 }).errores.orden);
    assert.equal(validarEtapa({ nombre: 'Diseño', orden: '2' }).valores.orden, 2);
  });

  it('exige responsable y fecha límite en una actividad', () => {
    const resultado = validarActividad({ descripcion: 'Visita a planta' });
    assert.deepEqual(Object.keys(resultado.errores).sort(), ['fechaLimite', 'responsable']);
  });
});

describe('validarAvance', () => {
  it('acepta enteros de 0 a 100', () => {
    assert.equal(validarAvance({ porcentaje: 0 }).ok, true);
    assert.equal(validarAvance({ porcentaje: '100' }).ok, true);
  });

  it('rechaza valores fuera de rango o con decimales', () => {
    for (const porcentaje of [-1, 101, 50.5, 'cincuenta', null]) {
      assert.equal(validarAvance({ porcentaje }).ok, false, `debería rechazar ${porcentaje}`);
    }
  });
});

describe('esFechaValida', () => {
  it('rechaza fechas que no existen', () => {
    assert.equal(esFechaValida('2026-02-30'), false);
    assert.equal(esFechaValida('2026-02-28'), true);
  });
});

describe('elegirEtapaActual', () => {
  it('elige la etapa en curso, luego la primera pendiente y al final la última', () => {
    const etapa = (orden, estado) => ({ orden, estado });
    assert.equal(elegirEtapaActual([etapa(1, 'terminada'), etapa(2, 'en_curso'), etapa(3, 'pendiente')]).orden, 2);
    assert.equal(elegirEtapaActual([etapa(2, 'pendiente'), etapa(1, 'terminada'), etapa(3, 'pendiente')]).orden, 2);
    assert.equal(elegirEtapaActual([etapa(1, 'terminada'), etapa(2, 'terminada')]).orden, 2);
    assert.equal(elegirEtapaActual([]), null);
  });
});
