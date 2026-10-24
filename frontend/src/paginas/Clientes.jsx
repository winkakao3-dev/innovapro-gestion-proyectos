import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { Cargando, EnlaceBoton, Mensaje } from '../componentes/comunes.jsx';
import { plural } from '../formato.js';
import { SNAPPY, entradaEscalonada } from '../movimiento.js';
import { useDatos } from '../usarDatos.js';

export default function Clientes() {
  const [buscar, setBuscar] = useState('');
  const [buscarAplicado, setBuscarAplicado] = useState('');

  useEffect(() => {
    const espera = setTimeout(() => setBuscarAplicado(buscar.trim()), 250);
    return () => clearTimeout(espera);
  }, [buscar]);

  const { datos: clientes, error, cargando, recargar } = useDatos(() => api.clientes.listar(buscarAplicado), [buscarAplicado]);

  return (
    <div className="pagina">
      <div className="pagina-encabezado">
        <div>
          <h1>Clientes</h1>
          <p className="texto-secundario">{clientes ? plural(clientes.length, 'cliente') : 'Empresas para las que Innovapro desarrolla proyectos'}</p>
        </div>
        <EnlaceBoton variante="primario" to="/clientes/nuevo">
          Nuevo cliente
        </EnlaceBoton>
      </div>

      <div className="barra-filtros">
        <input
          type="search"
          className="entrada buscador"
          placeholder="Buscar por empresa, contacto o correo"
          aria-label="Buscar por empresa, contacto o correo"
          value={buscar}
          onChange={(evento) => setBuscar(evento.target.value)}
        />
      </div>

      {error && (
        <Mensaje
          tipo="error"
          titulo="No se pudieron cargar los clientes"
          accion={
            <button type="button" className="enlace-texto" onClick={recargar}>
              Intentar de nuevo
            </button>
          }
        >
          {error.message}
        </Mensaje>
      )}
      {!clientes && cargando && <Cargando texto="Cargando clientes…" />}
      {clientes && clientes.length === 0 && (
        <Mensaje titulo={buscarAplicado ? 'Ningún cliente coincide con la búsqueda' : 'Todavía no hay clientes'}>
          {buscarAplicado ? 'Prueba con otro nombre o correo.' : 'Registra el primero con el botón Nuevo cliente.'}
        </Mensaje>
      )}

      {clientes && clientes.length > 0 && (
        <motion.ul className={`lista-clientes ${cargando ? 'recargando' : ''}`} layout>
          <AnimatePresence>
            {clientes.map((cliente, indice) => (
              <motion.li key={cliente.id} className="fila-cliente" layout {...entradaEscalonada(indice)} transition={{ ...entradaEscalonada(indice).transition, layout: SNAPPY }}>
                <div className="fila-cliente-principal">
                  <span className="fila-proyecto-nombre">{cliente.nombre}</span>
                  <span className="texto-secundario">{cliente.contacto ?? 'Sin contacto registrado'}</span>
                </div>
                <div className="fila-cliente-contacto texto-secundario">
                  <span>{cliente.correo ?? 'Sin correo'}</span>
                  <span>{cliente.telefono ?? 'Sin teléfono'}</span>
                </div>
                <span className={`acceso ${cliente.tieneAcceso ? 'acceso-si' : ''}`}>
                  {cliente.tieneAcceso ? 'Consulta su avance' : 'Sin cuenta de consulta'}
                </span>
                <Link to={`/proyectos?clienteId=${cliente.id}`} className="enlace-texto">
                  {plural(cliente.totalProyectos, 'proyecto')}
                </Link>
                <Link to={`/clientes/${cliente.id}/editar`} className="enlace-texto">
                  Editar
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
