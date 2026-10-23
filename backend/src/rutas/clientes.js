import { Router } from 'express';
import { validarCliente } from '../dominio/validaciones.js';
import { noEncontrado } from '../errores.js';
import { exigirValido, leerId, leerTextoDeConsulta } from './parametros.js';

export function rutasClientes({ clientes }) {
  const rutas = Router();

  rutas.get('/', async (solicitud, respuesta) => {
    respuesta.json(await clientes.listar({ buscar: leerTextoDeConsulta(solicitud.query.buscar) }));
  });

  rutas.get('/:id', async (solicitud, respuesta) => {
    const cliente = await clientes.obtener(leerId(solicitud.params.id, 'El cliente'));
    if (!cliente) throw noEncontrado('El cliente');
    respuesta.json(cliente);
  });

  rutas.post('/', async (solicitud, respuesta) => {
    const valores = exigirValido(validarCliente(solicitud.body));
    respuesta.status(201).json(await clientes.crear(valores));
  });

  rutas.put('/:id', async (solicitud, respuesta) => {
    const id = leerId(solicitud.params.id, 'El cliente');
    const valores = exigirValido(validarCliente(solicitud.body));
    const cliente = await clientes.actualizar(id, valores);
    if (!cliente) throw noEncontrado('El cliente');
    respuesta.json(cliente);
  });

  return rutas;
}
