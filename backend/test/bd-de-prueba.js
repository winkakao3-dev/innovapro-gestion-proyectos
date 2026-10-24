import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { crearConexion } from '../src/datos/conexion.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const URL_ADMINISTRACION = process.env.URL_BD_PRUEBA ?? 'postgres://postgres@localhost:54329/postgres';

async function leerScripts(carpeta) {
  const directorio = path.join(RAIZ, 'database', carpeta);
  const archivos = (await readdir(directorio)).filter((nombre) => nombre.endsWith('.sql')).sort();
  return Promise.all(archivos.map((nombre) => readFile(path.join(directorio, nombre), 'utf8')));
}

// Crea una base nueva con las migraciones y los datos de prueba; se borra al terminar.
export async function crearBaseDePrueba() {
  const nombre = `gestion_proyectos_prueba_${process.pid}`;
  const administracion = new pg.Client({ connectionString: URL_ADMINISTRACION });
  try {
    await administracion.connect();
  } catch (error) {
    throw new Error(`No hay PostgreSQL en ${URL_ADMINISTRACION}. Inicia la base local con: npm run bd:iniciar`, { cause: error });
  }
  await administracion.query(`drop database if exists ${nombre}`);
  await administracion.query(`create database ${nombre}`);
  await administracion.end();

  const url = new URL(URL_ADMINISTRACION);
  url.pathname = `/${nombre}`;
  const conexion = crearConexion(url.toString());
  for (const script of [...(await leerScripts('migraciones')), ...(await leerScripts('semillas'))]) {
    await conexion.query(script);
  }

  return {
    conexion,
    async borrar() {
      await conexion.end();
      const limpieza = new pg.Client({ connectionString: URL_ADMINISTRACION });
      await limpieza.connect();
      await limpieza.query(`drop database if exists ${nombre}`);
      await limpieza.end();
    },
  };
}
