import { motion } from 'motion/react';
import { Link, useParams } from 'react-router';
import { api } from '../api.js';
import { BarraAvance, Cargando, EnlaceBoton, EtiquetaEstado, Mensaje, NumeroAnimado } from '../componentes/comunes.jsx';
import { HistorialAvance } from '../componentes/HistorialAvance.jsx';
import { formatearFecha } from '../formato.js';
import { entradaEscalonada } from '../movimiento.js';
import { useDatos } from '../usarDatos.js';

export default function MiProyecto() {
  const { id } = useParams();
  const { datos: proyecto, error } = useDatos(() => api.misProyectos.obtener(id), [id]);

  if (error) {
    return (
      <div className="pagina pagina-estrecha">
        <Mensaje
          tipo="error"
          titulo={error.estado === 404 ? 'No encontramos este proyecto' : 'No se pudo cargar el proyecto'}
          accion={<EnlaceBoton to="/mis-proyectos">Ver tus proyectos</EnlaceBoton>}
        >
          {error.estado === 404 ? 'Solo puedes consultar los proyectos de tu empresa.' : error.message}
        </Mensaje>
      </div>
    );
  }
  if (!proyecto) return <Cargando texto="Cargando proyecto…" />;

  return (
    <div className="pagina pagina-estrecha">
      <Link to="/mis-proyectos" className="enlace-regreso">
        Tus proyectos
      </Link>
      <h1>{proyecto.nombre}</h1>
      <p className="meta-proyecto">
        <EtiquetaEstado estado={proyecto.estado} />
        <span className="texto-secundario">
          {formatearFecha(proyecto.fechaInicio)} a {formatearFecha(proyecto.fechaEstimadaTermino)} (término estimado)
        </span>
      </p>
      {proyecto.descripcion && <p className="descripcion">{proyecto.descripcion}</p>}

      <section className="panel panel-avance" aria-labelledby="titulo-avance-cliente">
        <div className="panel-avance-resumen">
          <div>
            <h2 id="titulo-avance-cliente" className="titulo-seccion">
              Avance del proyecto
            </h2>
            <p className="numero-grande">
              <NumeroAnimado valor={proyecto.porcentajeAvance} sufijo="%" />
            </p>
            <p className="texto-secundario">
              {proyecto.etapaActual ? `Etapa actual: ${proyecto.etapaActual.nombre}` : 'Las etapas se definirán pronto'}
            </p>
          </div>
          {proyecto.enlaceDemo && (
            <a className="boton boton-primario" href={proyecto.enlaceDemo} target="_blank" rel="noreferrer">
              Ver demo
            </a>
          )}
        </div>
        <BarraAvance porcentaje={proyecto.porcentajeAvance} grande />
      </section>

      {proyecto.etapas.length > 0 && (
        <section className="panel" aria-labelledby="titulo-etapas-cliente">
          <h2 id="titulo-etapas-cliente" className="titulo-seccion">
            Etapas
          </h2>
          <ol className="linea-etapas">
            {proyecto.etapas.map((etapa, indice) => (
              <motion.li key={etapa.id} className={`linea-etapa etapa-${etapa.estado}`} {...entradaEscalonada(indice)}>
                <span className="etapa-orden" aria-hidden="true">
                  {etapa.orden}
                </span>
                <div>
                  <p className="linea-etapa-nombre">
                    {etapa.nombre}
                    {proyecto.etapaActual?.id === etapa.id && <span className="etiqueta-actual">Actual</span>}
                  </p>
                  <p className="texto-pequeno texto-secundario">
                    <EtiquetaEstado estado={etapa.estado} />{' '}
                    {etapa.fechaInicio || etapa.fechaFin ? `${formatearFecha(etapa.fechaInicio)} a ${formatearFecha(etapa.fechaFin)}` : ''}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>
      )}

      <section className="panel" aria-labelledby="titulo-historial-cliente">
        <h2 id="titulo-historial-cliente" className="titulo-seccion">
          Historial de avance
        </h2>
        <HistorialAvance registros={proyecto.historialAvance} mostrarAutor={false} />
      </section>
    </div>
  );
}
