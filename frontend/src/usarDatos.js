import { useCallback, useEffect, useRef, useState } from 'react';

// Carga datos y conserva los anteriores mientras recarga, para que la lista no parpadee al filtrar.
export function useDatos(cargar, dependencias) {
  const [estado, setEstado] = useState({ datos: null, error: null, cargando: true });
  const peticionVigente = useRef(0);

  const recargar = useCallback(async () => {
    const numero = ++peticionVigente.current;
    setEstado((anterior) => ({ ...anterior, cargando: true }));
    try {
      const datos = await cargar();
      if (numero === peticionVigente.current) setEstado({ datos, error: null, cargando: false });
    } catch (error) {
      if (numero === peticionVigente.current) setEstado((anterior) => ({ ...anterior, error, cargando: false }));
    }
  }, dependencias);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { ...estado, recargar };
}
