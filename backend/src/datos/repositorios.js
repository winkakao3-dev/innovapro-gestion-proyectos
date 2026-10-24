import { crearRepositorioActividades } from './actividades.js';
import { crearRepositorioAvances } from './avances.js';
import { crearRepositorioClientes } from './clientes.js';
import { crearRepositorioEtapas } from './etapas.js';
import { crearRepositorioProyectos } from './proyectos.js';

export function crearRepositorios(conexion) {
  return {
    clientes: crearRepositorioClientes(conexion),
    proyectos: crearRepositorioProyectos(conexion),
    etapas: crearRepositorioEtapas(conexion),
    actividades: crearRepositorioActividades(conexion),
    avances: crearRepositorioAvances(conexion),
  };
}
