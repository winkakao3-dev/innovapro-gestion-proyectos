import { motion } from 'motion/react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { BarraAvance, Cargando, EtiquetaEstado, Mensaje } from '../componentes/comunes.jsx';
import { formatearFecha } from '../formato.js';
import { entradaEscalonada } from '../movimiento.js';
import { useSesion } from '../sesion.jsx';
import { useDatos } from '../usarDatos.js';

export default function MisProyectos() {
  const { sesion } = useSesion();
  const { datos: proyectos, error, recargar } = useDatos(() => api.misProyectos.listar(), [sesion.clave]);

  return (
    <div className="pagina pagina-estrecha">
      <h1>Tus proyectos</h1>
      <p className="texto-secundario">Consulta en qué etapa va cada proyecto que Innovapro desarrolla para tu empresa.</p>

      {error && (
        <Mensaje
          tipo="error"
          titulo="No se pudieron cargar tus proyectos"
          accion={
            <button type="button" className="enlace-texto" onClick={recargar}>
              Intentar de nuevo
            </button>
          }
        >
          {error.message}
        </Mensaje>
      )}
      {!proyectos && !error && <Cargando texto="Cargando tus proyectos…" />}
      {proyectos && proyectos.length === 0 && (
        <Mensaje titulo="Aún no tienes proyectos registrados">
          Cuando Innovapro registre un proyecto para tu empresa, aquí verás su etapa y su porcentaje de avance.
        </Mensaje>
      )}

      {proyectos && proyectos.length > 0 && (
        <ul className="tarjetas-cliente">
          {proyectos.map((proyecto, indice) => (
            <motion.li key={proyecto.id} {...entradaEscalonada(indice)}>
              <Link to={`/mis-proyectos/${proyecto.id}`} className="tarjeta-cliente">
                <div className="tarjeta-cliente-encabezado">
                  <h2>{proyecto.nombre}</h2>
                  <EtiquetaEstado estado={proyecto.estado} />
                </div>
                <p className="texto-secundario">
                  {proyecto.etapaActual
                    ? `Etapa ${proyecto.etapaActual.orden} de ${proyecto.totalEtapas}: ${proyecto.etapaActual.nombre}`
                    : 'Etapas por definir'}
                </p>
                <div className="fila-proyecto-avance">
                  <BarraAvance porcentaje={proyecto.porcentajeAvance} etiqueta={`Avance de ${proyecto.nombre}`} />
                  <span className="porcentaje">{proyecto.porcentajeAvance}%</span>
                </div>
                <p className="texto-pequeno texto-secundario">Término estimado: {formatearFecha(proyecto.fechaEstimadaTermino)}</p>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
