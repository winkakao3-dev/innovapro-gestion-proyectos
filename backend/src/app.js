import cors from 'cors';
import express from 'express';
import { exigirRol } from './autenticacion/sesion-de-prueba.js';
import { ErrorDeSolicitud, manejarErrores } from './errores.js';
import { rutasActividades } from './rutas/actividades.js';
import { rutasClientes } from './rutas/clientes.js';
import { rutasEtapas } from './rutas/etapas.js';
import { rutasMisProyectos } from './rutas/mis-proyectos.js';
import { rutasProyectos } from './rutas/proyectos.js';

export function crearApp({ repositorios, autenticacion, origenesPermitidos }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: origenesPermitidos }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/salud', (_solicitud, respuesta) => respuesta.json({ estado: 'ok' }));

  app.use('/api', autenticacion);
  app.get('/api/sesion', (solicitud, respuesta) => respuesta.json(solicitud.usuario));
  app.use('/api/clientes', exigirRol('personal'), rutasClientes(repositorios));
  app.use('/api/proyectos', exigirRol('personal'), rutasProyectos(repositorios));
  app.use('/api/etapas', exigirRol('personal'), rutasEtapas(repositorios));
  app.use('/api/actividades', exigirRol('personal'), rutasActividades(repositorios));
  app.use('/api/mis-proyectos', exigirRol('cliente'), rutasMisProyectos(repositorios));

  app.use('/api', (_solicitud, _respuesta, siguiente) => siguiente(new ErrorDeSolicitud(404, 'La ruta no existe')));
  app.use(manejarErrores);
  return app;
}
