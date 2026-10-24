import { crearApp } from './app.js';
import { sesionDePrueba } from './autenticacion/sesion-de-prueba.js';
import { leerConfiguracion } from './configuracion.js';
import { crearConexion } from './datos/conexion.js';
import { crearRepositorios } from './datos/repositorios.js';

const configuracion = leerConfiguracion();
const conexion = crearConexion(configuracion.urlBaseDatos);
const app = crearApp({
  repositorios: crearRepositorios(conexion),
  autenticacion: sesionDePrueba(),
  origenesPermitidos: configuracion.origenesPermitidos,
});

app.listen(configuracion.puerto, () => {
  console.log(`Servicios de gestión de proyectos en http://localhost:${configuracion.puerto} (sesión: ${configuracion.modoAutenticacion})`);
});
