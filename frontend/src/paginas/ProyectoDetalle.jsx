import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../api.js';
import { useAvisos } from '../componentes/avisos.jsx';
import { Cargando, EnlaceBoton, EtiquetaEstado, Mensaje } from '../componentes/comunes.jsx';
import { Etapas } from '../componentes/Etapas.jsx';
import { HistorialAvance } from '../componentes/HistorialAvance.jsx';
import { PanelAvance } from '../componentes/PanelAvance.jsx';
import { formatearFecha } from '../formato.js';
import { useDatos } from '../usarDatos.js';

export default function ProyectoDetalle() {
  const { id } = useParams();
  const avisar = useAvisos();
  const { datos: proyecto, error, recargar } = useDatos(() => api.proyectos.obtener(id), [id]);
  const [avanceAbierto, setAvanceAbierto] = useState(false);
  const [etapaSugerida, setEtapaSugerida] = useState(null);

  if (error && !proyecto) {
    return (
      <div className="pagina pagina-estrecha">
        <Mensaje
          tipo="error"
          titulo={error.estado === 404 ? 'Este proyecto no existe' : 'No se pudo cargar el proyecto'}
          accion={<EnlaceBoton to="/proyectos">Volver a proyectos</EnlaceBoton>}
        >
          {error.estado === 404 ? 'Puede que el enlace esté mal escrito.' : error.message}
        </Mensaje>
      </div>
    );
  }
  if (!proyecto) return <Cargando texto="Cargando proyecto…" />;

  async function registrarAvance(datos) {
    await api.proyectos.registrarAvance(proyecto.id, datos);
    await recargar();
    setAvanceAbierto(false);
    setEtapaSugerida(null);
    avisar(`Avance registrado: ${datos.porcentaje}%`);
  }

  return (
    <div className="pagina">
      <Link to="/proyectos" className="enlace-regreso">
        Proyectos
      </Link>
      <div className="pagina-encabezado">
        <div>
          <h1>{proyecto.nombre}</h1>
          <p className="meta-proyecto">
            <Link to={`/proyectos?clienteId=${proyecto.clienteId}`}>{proyecto.clienteNombre}</Link>
            <EtiquetaEstado estado={proyecto.estado} />
            <span className="texto-secundario">
              {formatearFecha(proyecto.fechaInicio)} a {formatearFecha(proyecto.fechaEstimadaTermino)}
            </span>
          </p>
          {proyecto.descripcion && <p className="descripcion">{proyecto.descripcion}</p>}
          {proyecto.enlaceDemo && (
            <a className="enlace-texto" href={proyecto.enlaceDemo} target="_blank" rel="noreferrer">
              Abrir demo del proyecto
            </a>
          )}
        </div>
        <EnlaceBoton to={`/proyectos/${proyecto.id}/editar`}>Editar proyecto</EnlaceBoton>
      </div>

      <div className="detalle-columnas">
        <div className="detalle-principal">
          <PanelAvance
            proyecto={proyecto}
            abierto={avanceAbierto}
            etapaSugerida={etapaSugerida}
            onAbrir={() => setAvanceAbierto(true)}
            onCerrar={() => {
              setAvanceAbierto(false);
              setEtapaSugerida(null);
            }}
            onRegistrar={registrarAvance}
          />
          <Etapas
            proyecto={proyecto}
            onCambio={recargar}
            onEtapaTerminada={(etapaId) => {
              setEtapaSugerida(etapaId);
              setAvanceAbierto(true);
              avisar('Etapa terminada. Registra el nuevo avance del proyecto.');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
        <aside className="panel detalle-lateral" aria-labelledby="titulo-historial">
          <h2 id="titulo-historial" className="titulo-seccion">
            Historial de avance
          </h2>
          <HistorialAvance registros={proyecto.historialAvance} />
        </aside>
      </div>
    </div>
  );
}
