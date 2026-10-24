import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { BarraAvance, Boton, Campo, Mensaje, NumeroAnimado } from './comunes.jsx';
import { panelDesplegable } from '../movimiento.js';

// Muestra el avance vigente y, al abrirse, el formulario para registrar uno nuevo con su etapa y comentario.
export function PanelAvance({ proyecto, abierto, etapaSugerida, onAbrir, onCerrar, onRegistrar }) {
  const [porcentaje, setPorcentaje] = useState(proyecto.porcentajeAvance);
  const [etapaId, setEtapaId] = useState('');
  const [comentario, setComentario] = useState('');
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setPorcentaje(proyecto.porcentajeAvance);
    setEtapaId(String(etapaSugerida ?? proyecto.etapaActual?.id ?? ''));
    setComentario('');
    setErrores({});
    setErrorGeneral(null);
  }, [abierto, etapaSugerida, proyecto.porcentajeAvance, proyecto.etapaActual?.id]);

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    try {
      await onRegistrar({ porcentaje: Number(porcentaje), etapaId: etapaId ? Number(etapaId) : null, comentario });
    } catch (error) {
      setErrores(error.campos ?? {});
      setErrorGeneral(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="panel panel-avance" aria-labelledby="titulo-avance">
      <div className="panel-avance-resumen">
        <div>
          <h2 id="titulo-avance" className="titulo-seccion">
            Avance
          </h2>
          <p className="numero-grande">
            <NumeroAnimado valor={proyecto.porcentajeAvance} sufijo="%" />
          </p>
          <p className="texto-secundario">
            {proyecto.etapaActual
              ? `Etapa actual: ${proyecto.etapaActual.nombre} (${proyecto.etapaActual.orden} de ${proyecto.etapas.length})`
              : 'El proyecto todavía no tiene etapas'}
          </p>
        </div>
        {!abierto && (
          <Boton variante="primario" onClick={onAbrir}>
            Registrar avance
          </Boton>
        )}
      </div>
      <BarraAvance porcentaje={abierto ? Number(porcentaje) || 0 : proyecto.porcentajeAvance} grande />

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.form key="formulario-avance" className="desplegable" onSubmit={guardar} noValidate {...panelDesplegable}>
            <div className="desplegable-contenido formulario">
              <Campo etiqueta="Nuevo porcentaje de avance" id="avance-porcentaje" error={errores.porcentaje}>
                <div className="control-porcentaje">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Number(porcentaje) || 0}
                    onChange={(evento) => setPorcentaje(evento.target.value)}
                    aria-label="Porcentaje de avance"
                  />
                  <input
                    id="avance-porcentaje"
                    type="number"
                    min={0}
                    max={100}
                    className="entrada entrada-numero"
                    value={porcentaje}
                    onChange={(evento) => setPorcentaje(evento.target.value)}
                    aria-invalid={Boolean(errores.porcentaje)}
                    aria-describedby={errores.porcentaje ? 'avance-porcentaje-error' : undefined}
                  />
                  <span aria-hidden="true">%</span>
                </div>
              </Campo>
              <div className="campos-en-fila">
                <Campo etiqueta="Etapa" id="avance-etapa" error={errores.etapaId} ayuda="La etapa que se cerró o avanzó.">
                  <select id="avance-etapa" className="entrada" value={etapaId} onChange={(evento) => setEtapaId(evento.target.value)}>
                    <option value="">Sin etapa</option>
                    {proyecto.etapas.map((etapa) => (
                      <option key={etapa.id} value={etapa.id}>
                        {etapa.orden}. {etapa.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo etiqueta="Comentario" id="avance-comentario" error={errores.comentario} ayuda="Opcional.">
                  <input
                    id="avance-comentario"
                    className="entrada"
                    maxLength={300}
                    value={comentario}
                    onChange={(evento) => setComentario(evento.target.value)}
                  />
                </Campo>
              </div>
              {errorGeneral && <Mensaje tipo="error" titulo={errorGeneral} />}
              <div className="acciones-formulario">
                <Boton type="submit" variante="primario" disabled={guardando}>
                  {guardando ? 'Guardando…' : 'Guardar avance'}
                </Boton>
                <Boton type="button" onClick={onCerrar}>
                  Cancelar
                </Boton>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}
