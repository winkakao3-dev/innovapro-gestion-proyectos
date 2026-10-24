import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { api } from '../api.js';
import { ESTADOS_ETAPA, formatearFecha, hoyEnTexto, plural } from '../formato.js';
import { BOUNCY, SNAPPY, entradaEscalonada, panelDesplegable } from '../movimiento.js';
import { useAvisos } from './avisos.jsx';
import { Boton, Campo, Mensaje } from './comunes.jsx';

function useEnvio(enviar) {
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  async function ejecutar(...argumentos) {
    setEnviando(true);
    setErrorGeneral(null);
    try {
      await enviar(...argumentos);
      setErrores({});
      return true;
    } catch (error) {
      setErrores(error.campos ?? {});
      setErrorGeneral(error.message);
      return false;
    } finally {
      setEnviando(false);
    }
  }
  return { errores, setErrores, errorGeneral, enviando, ejecutar };
}

function FormularioEtapa({ inicial, idBase, textoGuardar, onGuardar, onCancelar }) {
  const [valores, setValores] = useState(inicial);
  const { errores, setErrores, errorGeneral, enviando, ejecutar } = useEnvio(onGuardar);
  const props = (campo) => ({
    id: `${idBase}-${campo}`,
    value: valores[campo] ?? '',
    onChange: (evento) => {
      setValores((actuales) => ({ ...actuales, [campo]: evento.target.value }));
      setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
    },
    'aria-invalid': Boolean(errores[campo]),
    'aria-describedby': errores[campo] ? `${idBase}-${campo}-error` : undefined,
  });

  return (
    <form
      className="formulario formulario-compacto"
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        ejecutar({ ...valores, orden: Number(valores.orden) });
      }}
    >
      <div className="campos-en-fila campos-etapa">
        <Campo etiqueta="Orden" id={`${idBase}-orden`} error={errores.orden}>
          <input type="number" min={1} className="entrada entrada-numero" {...props('orden')} />
        </Campo>
        <Campo etiqueta="Nombre de la etapa" id={`${idBase}-nombre`} error={errores.nombre}>
          <input className="entrada" maxLength={100} placeholder="Por ejemplo: Diseño" {...props('nombre')} />
        </Campo>
      </div>
      <div className="campos-en-fila">
        <Campo etiqueta="Inicio" id={`${idBase}-fechaInicio`} error={errores.fechaInicio}>
          <input type="date" className="entrada" {...props('fechaInicio')} />
        </Campo>
        <Campo etiqueta="Fin" id={`${idBase}-fechaFin`} error={errores.fechaFin}>
          <input type="date" className="entrada" min={valores.fechaInicio || undefined} {...props('fechaFin')} />
        </Campo>
        <Campo etiqueta="Estado" id={`${idBase}-estado`} error={errores.estado}>
          <select className="entrada" {...props('estado')}>
            {ESTADOS_ETAPA.map((estado) => (
              <option key={estado.valor} value={estado.valor}>
                {estado.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      {errorGeneral && <Mensaje tipo="error" titulo={errorGeneral} />}
      <div className="acciones-formulario">
        <Boton type="submit" variante="primario" disabled={enviando}>
          {enviando ? 'Guardando…' : textoGuardar}
        </Boton>
        <Boton type="button" onClick={onCancelar}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}

function FormularioActividad({ etapa, onGuardada, onCancelar }) {
  const [valores, setValores] = useState({ descripcion: '', responsable: '', fechaLimite: etapa.fechaFin ?? '' });
  const { errores, setErrores, errorGeneral, enviando, ejecutar } = useEnvio(async (datos) => {
    await api.etapas.crearActividad(etapa.id, datos);
    await onGuardada();
  });
  const idBase = `actividad-nueva-${etapa.id}`;
  const props = (campo) => ({
    id: `${idBase}-${campo}`,
    value: valores[campo],
    onChange: (evento) => {
      setValores((actuales) => ({ ...actuales, [campo]: evento.target.value }));
      setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
    },
    'aria-invalid': Boolean(errores[campo]),
    'aria-describedby': errores[campo] ? `${idBase}-${campo}-error` : undefined,
  });

  return (
    <form
      className="formulario formulario-compacto"
      noValidate
      onSubmit={async (evento) => {
        evento.preventDefault();
        if (await ejecutar(valores)) setValores({ descripcion: '', responsable: valores.responsable, fechaLimite: valores.fechaLimite });
      }}
    >
      <Campo etiqueta="Actividad" id={`${idBase}-descripcion`} error={errores.descripcion}>
        <input className="entrada" maxLength={300} placeholder="Qué hay que hacer" {...props('descripcion')} />
      </Campo>
      <div className="campos-en-fila">
        <Campo etiqueta="Responsable" id={`${idBase}-responsable`} error={errores.responsable}>
          <input className="entrada" maxLength={150} placeholder="Nombre de la persona" {...props('responsable')} />
        </Campo>
        <Campo etiqueta="Fecha límite" id={`${idBase}-fechaLimite`} error={errores.fechaLimite}>
          <input type="date" className="entrada" {...props('fechaLimite')} />
        </Campo>
      </div>
      {errorGeneral && <Mensaje tipo="error" titulo={errorGeneral} />}
      <div className="acciones-formulario">
        <Boton type="submit" variante="primario" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Agregar actividad'}
        </Boton>
        <Boton type="button" onClick={onCancelar}>
          Listo
        </Boton>
      </div>
    </form>
  );
}

function ActividadFila({ actividad, indice, onCambio }) {
  const avisar = useAvisos();
  const [ocupada, setOcupada] = useState(false);
  const terminada = actividad.estado === 'terminada';
  const vencida = !terminada && actividad.fechaLimite < hoyEnTexto();

  async function ejecutar(operacion, textoError) {
    setOcupada(true);
    try {
      await operacion();
      await onCambio();
    } catch (error) {
      avisar(`${textoError}: ${error.message}`, 'error');
    } finally {
      setOcupada(false);
    }
  }

  return (
    <motion.li
      layout
      className={`actividad ${terminada ? 'actividad-terminada' : ''}`}
      {...entradaEscalonada(indice)}
      exit={{ opacity: 0, height: 0, filter: 'blur(4px)' }}
      transition={{ ...entradaEscalonada(indice).transition, layout: SNAPPY }}
    >
      <motion.button
        type="button"
        role="checkbox"
        aria-checked={terminada}
        aria-label={terminada ? `Marcar "${actividad.descripcion}" como pendiente` : `Marcar "${actividad.descripcion}" como terminada`}
        className="casilla"
        disabled={ocupada}
        whileTap={{ scale: 0.85 }}
        transition={BOUNCY}
        onClick={() =>
          ejecutar(
            () => api.actividades.actualizar(actividad.id, { ...actividad, estado: terminada ? 'pendiente' : 'terminada' }),
            'No se pudo actualizar la actividad',
          )
        }
      >
        <AnimatePresence initial={false}>
          {terminada && (
            <motion.svg
              key="marca"
              viewBox="0 0 16 16"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={BOUNCY}
              aria-hidden="true"
            >
              <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
      <div className="actividad-detalle">
        <span className="actividad-descripcion">{actividad.descripcion}</span>
        <span className="texto-pequeno texto-secundario">
          {actividad.responsable} · Límite {formatearFecha(actividad.fechaLimite)}
          {actividad.estado === 'en_curso' && ' · En curso'}
          {vencida && <span className="vencida"> · Vencida</span>}
        </span>
      </div>
      <button
        type="button"
        className="boton-icono"
        aria-label={`Eliminar "${actividad.descripcion}"`}
        disabled={ocupada}
        onClick={() => ejecutar(() => api.actividades.eliminar(actividad.id), 'No se pudo eliminar la actividad')}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </motion.li>
  );
}

function EtapaTarjeta({ etapa, indice, onCambio, onEtapaTerminada }) {
  const avisar = useAvisos();
  const [modo, setModo] = useState('ver');
  const [agregandoActividad, setAgregandoActividad] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const terminadas = etapa.actividades.filter((actividad) => actividad.estado === 'terminada').length;

  async function cambiarEstado(estado) {
    setCambiandoEstado(true);
    try {
      await api.etapas.actualizar(etapa.id, { ...etapa, estado });
      await onCambio();
      if (estado === 'terminada') onEtapaTerminada(etapa.id);
    } catch (error) {
      avisar(`No se pudo cambiar el estado: ${error.message}`, 'error');
    } finally {
      setCambiandoEstado(false);
    }
  }

  async function eliminar() {
    try {
      await api.etapas.eliminar(etapa.id);
      avisar(`Se eliminó la etapa ${etapa.nombre}`);
      await onCambio();
    } catch (error) {
      avisar(`No se pudo eliminar la etapa: ${error.message}`, 'error');
      setModo('ver');
    }
  }

  return (
    <motion.li layout className={`etapa etapa-${etapa.estado}`} {...entradaEscalonada(indice)} transition={{ ...entradaEscalonada(indice).transition, layout: SNAPPY }}>
      <div className="etapa-encabezado">
        <span className="etapa-orden" aria-hidden="true">
          {etapa.orden}
        </span>
        <div className="etapa-titulo">
          <h3>{etapa.nombre}</h3>
          <span className="texto-pequeno texto-secundario">
            {etapa.fechaInicio || etapa.fechaFin
              ? `${formatearFecha(etapa.fechaInicio)} a ${formatearFecha(etapa.fechaFin)}`
              : 'Sin fechas'}{' '}
            · {etapa.actividades.length
              ? `${terminadas} de ${etapa.actividades.length} ${etapa.actividades.length === 1 ? 'actividad terminada' : 'actividades terminadas'}`
              : 'Sin actividades'}
          </span>
        </div>
        <label className="selector-estado">
          <span className="visualmente-oculto">Estado de la etapa {etapa.nombre}</span>
          <select className="entrada entrada-compacta" value={etapa.estado} disabled={cambiandoEstado} onChange={(evento) => cambiarEstado(evento.target.value)}>
            {ESTADOS_ETAPA.map((estado) => (
              <option key={estado.valor} value={estado.valor}>
                {estado.etiqueta}
              </option>
            ))}
          </select>
        </label>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {modo === 'editar' && (
          <motion.div key="editar" className="desplegable" {...panelDesplegable}>
            <div className="desplegable-contenido">
              <FormularioEtapa
                idBase={`etapa-${etapa.id}`}
                inicial={{ nombre: etapa.nombre, orden: etapa.orden, fechaInicio: etapa.fechaInicio ?? '', fechaFin: etapa.fechaFin ?? '', estado: etapa.estado }}
                textoGuardar="Guardar etapa"
                onGuardar={async (datos) => {
                  await api.etapas.actualizar(etapa.id, datos);
                  await onCambio();
                  setModo('ver');
                  avisar('Etapa actualizada');
                }}
                onCancelar={() => setModo('ver')}
              />
            </div>
          </motion.div>
        )}
        {modo === 'confirmar' && (
          <motion.div key="confirmar" className="desplegable" {...panelDesplegable}>
            <div className="desplegable-contenido confirmacion">
              <p>
                ¿Eliminar la etapa <strong>{etapa.nombre}</strong>
                {etapa.actividades.length ? ` y sus ${plural(etapa.actividades.length, 'actividad', 'actividades')}` : ''}? No se puede deshacer.
              </p>
              <div className="acciones-formulario">
                <Boton variante="peligro" onClick={eliminar}>
                  Sí, eliminar
                </Boton>
                <Boton onClick={() => setModo('ver')}>No, conservarla</Boton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {etapa.actividades.length > 0 && (
        <ul className="actividades">
          <AnimatePresence initial={false}>
            {etapa.actividades.map((actividad, posicion) => (
              <ActividadFila key={actividad.id} actividad={actividad} indice={posicion} onCambio={onCambio} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence initial={false}>
        {agregandoActividad && (
          <motion.div key="nueva-actividad" className="desplegable" {...panelDesplegable}>
            <div className="desplegable-contenido">
              <FormularioActividad
                etapa={etapa}
                onGuardada={async () => {
                  await onCambio();
                  avisar('Actividad agregada');
                }}
                onCancelar={() => setAgregandoActividad(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {modo === 'ver' && (
        <div className="etapa-acciones">
          {!agregandoActividad && (
            <button type="button" className="enlace-texto" onClick={() => setAgregandoActividad(true)}>
              Agregar actividad
            </button>
          )}
          <button type="button" className="enlace-texto" onClick={() => setModo('editar')}>
            Editar etapa
          </button>
          <button type="button" className="enlace-texto enlace-peligro" onClick={() => setModo('confirmar')}>
            Eliminar
          </button>
        </div>
      )}
    </motion.li>
  );
}

export function Etapas({ proyecto, onCambio, onEtapaTerminada }) {
  const avisar = useAvisos();
  const [agregando, setAgregando] = useState(false);
  const siguienteOrden = Math.max(0, ...proyecto.etapas.map((etapa) => etapa.orden)) + 1;

  return (
    <section className="panel" aria-labelledby="titulo-etapas">
      <div className="panel-encabezado">
        <h2 id="titulo-etapas" className="titulo-seccion">
          Etapas y actividades
        </h2>
        {!agregando && (
          <Boton onClick={() => setAgregando(true)}>Agregar etapa</Boton>
        )}
      </div>

      {proyecto.etapas.length === 0 && !agregando && (
        <p className="texto-secundario">
          Define las etapas del proyecto, por ejemplo levantamiento, diseño, ejecución y entrega, para dar seguimiento a sus actividades.
        </p>
      )}

      <ol className="etapas">
        <AnimatePresence initial={false}>
          {proyecto.etapas.map((etapa, indice) => (
            <EtapaTarjeta key={etapa.id} etapa={etapa} indice={indice} onCambio={onCambio} onEtapaTerminada={onEtapaTerminada} />
          ))}
        </AnimatePresence>
      </ol>

      <AnimatePresence initial={false}>
        {agregando && (
          <motion.div key="nueva-etapa" className="desplegable" {...panelDesplegable}>
            <div className="desplegable-contenido nueva-etapa">
              <h3>Nueva etapa</h3>
              <FormularioEtapa
                idBase="etapa-nueva"
                inicial={{ nombre: '', orden: siguienteOrden, fechaInicio: '', fechaFin: '', estado: 'pendiente' }}
                textoGuardar="Agregar etapa"
                onGuardar={async (datos) => {
                  await api.proyectos.crearEtapa(proyecto.id, datos);
                  await onCambio();
                  setAgregando(false);
                  avisar('Etapa agregada');
                }}
                onCancelar={() => setAgregando(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

