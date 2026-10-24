import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { etiquetaDeEstado } from '../formato.js';
import { BOUNCY, SNAPPY, entrada, presion } from '../movimiento.js';

const MotionLink = motion.create(Link);

export function Boton({ variante = 'secundario', className = '', ...props }) {
  return <motion.button {...presion} className={`boton boton-${variante} ${className}`} {...props} />;
}

export function EnlaceBoton({ variante = 'secundario', className = '', ...props }) {
  return <MotionLink {...presion} className={`boton boton-${variante} ${className}`} {...props} />;
}

export function EtiquetaEstado({ estado }) {
  return <span className={`etiqueta-estado estado-${estado}`}>{etiquetaDeEstado(estado)}</span>;
}

export function NumeroAnimado({ valor, sufijo = '' }) {
  const reducido = useReducedMotion();
  const actual = useMotionValue(valor);
  const texto = useTransform(actual, (numero) => `${Math.round(numero)}${sufijo}`);
  useEffect(() => {
    if (reducido) {
      actual.set(valor);
      return undefined;
    }
    const control = animate(actual, valor, { type: 'spring', stiffness: 160, damping: 26 });
    return () => control.stop();
  }, [actual, valor, reducido]);
  return <motion.span>{texto}</motion.span>;
}

export function BarraAvance({ porcentaje, grande = false, etiqueta }) {
  return (
    <div
      className={`barra-avance ${grande ? 'barra-avance-grande' : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={porcentaje}
      aria-label={etiqueta ?? 'Avance del proyecto'}
    >
      <motion.div
        className="barra-avance-relleno"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: porcentaje / 100 }}
        transition={SNAPPY}
      />
    </div>
  );
}

export function Campo({ etiqueta, error, ayuda, id, children }) {
  return (
    <div className={`campo ${error ? 'campo-con-error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error ? (
        <motion.p className="campo-error" id={`${id}-error`} role="alert" {...entrada}>
          {error}
        </motion.p>
      ) : (
        ayuda && <p className="campo-ayuda">{ayuda}</p>
      )}
    </div>
  );
}

export function Mensaje({ tipo = 'info', titulo, children, accion }) {
  return (
    <motion.div className={`mensaje mensaje-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'} {...entrada}>
      {titulo && <p className="mensaje-titulo">{titulo}</p>}
      {children && <div className="mensaje-cuerpo">{children}</div>}
      {accion}
    </motion.div>
  );
}

export function Cargando({ texto }) {
  return (
    <motion.p className="cargando" role="status" {...entrada}>
      {texto}
    </motion.p>
  );
}

export function FiltroSegmentado({ opciones, valor, onCambiar, etiqueta, idGrupo }) {
  return (
    <div className="segmentado" role="radiogroup" aria-label={etiqueta}>
      {opciones.map((opcion) => {
        const activa = opcion.valor === valor;
        return (
          <motion.button
            type="button"
            key={opcion.valor}
            role="radio"
            aria-checked={activa}
            className={`segmento ${activa ? 'segmento-activo' : ''}`}
            onClick={() => onCambiar(opcion.valor)}
            whileTap={{ scale: 0.95 }}
            transition={BOUNCY}
          >
            {activa && <motion.span layoutId={`indicador-${idGrupo}`} className="segmento-indicador" transition={SNAPPY} />}
            <span className="segmento-texto">{opcion.etiqueta}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
