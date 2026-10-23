import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { BOUNCY } from '../movimiento.js';

const ContextoAvisos = createContext(() => {});

export function ProveedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([]);
  const siguienteId = useRef(1);

  const avisar = useCallback((texto, tipo = 'exito') => {
    const id = siguienteId.current++;
    setAvisos((actuales) => [...actuales.slice(-2), { id, texto, tipo }]);
    setTimeout(() => setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id)), 3600);
  }, []);

  const valor = useMemo(() => avisar, [avisar]);

  return (
    <ContextoAvisos.Provider value={valor}>
      {children}
      <div className="avisos" aria-live="polite">
        <AnimatePresence initial={false}>
          {avisos.map((aviso) => (
            <motion.div
              key={aviso.id}
              layout
              className={`aviso aviso-${aviso.tipo}`}
              initial={{ opacity: 0, y: 16, scale: 0.92, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 8, scale: 0.96, filter: 'blur(6px)' }}
              transition={BOUNCY}
            >
              {aviso.texto}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ContextoAvisos.Provider>
  );
}

export function useAvisos() {
  return useContext(ContextoAvisos);
}
