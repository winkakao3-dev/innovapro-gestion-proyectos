// Resortes del sistema de movimiento: SNAPPY para posiciones e indicadores, BOUNCY para presiones y tamaños, SOFT para entradas.
export const SNAPPY = { type: 'spring', stiffness: 520, damping: 34 };
export const BOUNCY = { type: 'spring', stiffness: 420, damping: 18 };
export const SOFT = { type: 'spring', stiffness: 180, damping: 24 };

export const entrada = {
  initial: { opacity: 0, y: 8, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -4, filter: 'blur(4px)' },
  transition: SOFT,
};

export function entradaEscalonada(indice) {
  return { ...entrada, transition: { ...SOFT, delay: Math.min(indice, 12) * 0.035 } };
}

export const presion = { whileTap: { scale: 0.96 }, transition: BOUNCY };

export const panelDesplegable = {
  initial: { height: 0, opacity: 0, filter: 'blur(6px)' },
  animate: { height: 'auto', opacity: 1, filter: 'blur(0px)' },
  exit: { height: 0, opacity: 0, filter: 'blur(4px)' },
  transition: SNAPPY,
};
