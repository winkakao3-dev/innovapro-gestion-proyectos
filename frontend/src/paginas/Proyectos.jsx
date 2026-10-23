import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api.js';
import { BarraAvance, Cargando, EnlaceBoton, EtiquetaEstado, FiltroSegmentado, Mensaje } from '../componentes/comunes.jsx';
import { ESTADOS_PROYECTO, formatearFecha, plural } from '../formato.js';
import { SNAPPY, entradaEscalonada } from '../movimiento.js';
import { useDatos } from '../usarDatos.js';

const FILTROS = [{ valor: '', etiqueta: 'Todos' }, ...ESTADOS_PROYECTO];

export default function Proyectos() {
  const [parametros, setParametros] = useSearchParams();
  const estado = parametros.get('estado') ?? '';
  const clienteId = parametros.get('clienteId') ?? '';
  const buscarEnUrl = parametros.get('buscar') ?? '';
  const [buscar, setBuscar] = useState(buscarEnUrl);

  useEffect(() => {
    const espera = setTimeout(() => {
      if (buscar.trim() === buscarEnUrl) return;
      actualizarParametro('buscar', buscar.trim());
    }, 250);
    return () => clearTimeout(espera);
  }, [buscar, buscarEnUrl]);

  function actualizarParametro(nombre, valor) {
    setParametros(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales);
        if (valor) nuevos.set(nombre, valor);
        else nuevos.delete(nombre);
        return nuevos;
      },
      { replace: true },
    );
  }

  const { datos: proyectos, error, cargando, recargar } = useDatos(
    () => api.proyectos.listar({ buscar: buscarEnUrl, estado, clienteId }),
    [buscarEnUrl, estado, clienteId],
  );
  const { datos: cliente } = useDatos(() => (clienteId ? api.clientes.obtener(clienteId) : Promise.resolve(null)), [clienteId]);

  const hayFiltros = Boolean(buscarEnUrl || estado || clienteId);

  return (
    <div className="pagina">
      <div className="pagina-encabezado">
        <div>
          <h1>Proyectos</h1>
          <p className="texto-secundario">
            {proyectos ? plural(proyectos.length, hayFiltros ? 'proyecto encontrado' : 'proyecto registrado', hayFiltros ? 'proyectos encontrados' : 'proyectos registrados') : 'Proyectos de ingeniería de Innovapro'}
          </p>
        </div>
        <EnlaceBoton variante="primario" to="/proyectos/nuevo">
          Nuevo proyecto
        </EnlaceBoton>
      </div>

      <div className="barra-filtros">
        <input
          type="search"
          className="entrada buscador"
          placeholder="Buscar por proyecto o cliente"
          aria-label="Buscar por proyecto o cliente"
          value={buscar}
          onChange={(evento) => setBuscar(evento.target.value)}
        />
        <FiltroSegmentado
          etiqueta="Filtrar por estado"
          idGrupo="estado-proyecto"
          opciones={FILTROS}
          valor={estado}
          onCambiar={(valor) => actualizarParametro('estado', valor)}
        />
      </div>

      {clienteId && (
        <p className="filtro-activo">
          Solo proyectos de <strong>{cliente?.nombre ?? 'este cliente'}</strong>
          <button type="button" className="enlace-texto" onClick={() => actualizarParametro('clienteId', '')}>
            Ver todos
          </button>
        </p>
      )}

      {error && (
        <Mensaje
          tipo="error"
          titulo="No se pudieron cargar los proyectos"
          accion={
            <button type="button" className="enlace-texto" onClick={recargar}>
              Intentar de nuevo
            </button>
          }
        >
          {error.message}
        </Mensaje>
      )}

      {!proyectos && cargando && <Cargando texto="Cargando proyectos…" />}

      {proyectos && proyectos.length === 0 && (
        <Mensaje
          titulo={hayFiltros ? 'Ningún proyecto coincide con la búsqueda' : 'Todavía no hay proyectos'}
          accion={
            hayFiltros ? (
              <button
                type="button"
                className="enlace-texto"
                onClick={() => {
                  setBuscar('');
                  setParametros({}, { replace: true });
                }}
              >
                Quitar filtros
              </button>
            ) : null
          }
        >
          {hayFiltros ? 'Prueba con otro nombre o con otro estado.' : 'Registra el primero con el botón Nuevo proyecto.'}
        </Mensaje>
      )}

      {proyectos && proyectos.length > 0 && (
        <motion.ul className={`lista-proyectos ${cargando ? 'recargando' : ''}`} layout>
          <AnimatePresence initial={true}>
            {proyectos.map((proyecto, indice) => (
              <motion.li key={proyecto.id} layout {...entradaEscalonada(indice)} transition={{ ...entradaEscalonada(indice).transition, layout: SNAPPY }}>
                <Link to={`/proyectos/${proyecto.id}`} className="fila-proyecto">
                  <div className="fila-proyecto-principal">
                    <span className="fila-proyecto-nombre">{proyecto.nombre}</span>
                    <span className="texto-secundario">{proyecto.clienteNombre}</span>
                  </div>
                  <div className="fila-proyecto-etapa">
                    <span className="texto-pequeno texto-secundario">
                      {proyecto.etapaActual ? `Etapa ${proyecto.etapaActual.orden} de ${proyecto.totalEtapas}` : 'Sin etapas'}
                    </span>
                    <span>{proyecto.etapaActual?.nombre ?? 'Define las etapas'}</span>
                  </div>
                  <div className="fila-proyecto-avance">
                    <BarraAvance porcentaje={proyecto.porcentajeAvance} etiqueta={`Avance de ${proyecto.nombre}`} />
                    <span className="porcentaje">{proyecto.porcentajeAvance}%</span>
                  </div>
                  <EtiquetaEstado estado={proyecto.estado} />
                  <div className="fila-proyecto-fecha">
                    <span className="texto-pequeno texto-secundario">Término estimado</span>
                    <span>{formatearFecha(proyecto.fechaEstimadaTermino)}</span>
                  </div>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
