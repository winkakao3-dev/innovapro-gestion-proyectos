import { createContext, useContext, useMemo, useState } from 'react';

// Cuentas simuladas mientras la plataforma base no tiene inicio de sesión. Los ids coinciden con los datos de prueba.
export const SESIONES_DE_PRUEBA = [
  { clave: 'personal', etiqueta: 'Personal de Innovapro', rol: 'personal' },
  { clave: 'cliente-1', etiqueta: 'Cliente: Manufacturas del Norte', rol: 'cliente', usuarioId: '11111111-1111-4111-8111-000000000001' },
  { clave: 'cliente-2', etiqueta: 'Cliente: Ensambles Chihuahua', rol: 'cliente', usuarioId: '11111111-1111-4111-8111-000000000002' },
  { clave: 'cliente-3', etiqueta: 'Cliente: Plásticos Sierra Madre', rol: 'cliente', usuarioId: '11111111-1111-4111-8111-000000000003' },
];

const CLAVE_GUARDADA = 'innovapro.sesionDePrueba';

function leerGuardada() {
  try {
    const clave = localStorage.getItem(CLAVE_GUARDADA);
    return SESIONES_DE_PRUEBA.find((sesion) => sesion.clave === clave) ?? SESIONES_DE_PRUEBA[0];
  } catch {
    return SESIONES_DE_PRUEBA[0];
  }
}

let sesionVigente = leerGuardada();

export function encabezadosDeSesion() {
  if (sesionVigente.rol === 'personal') return {};
  return { 'x-usuario-prueba': sesionVigente.usuarioId, 'x-rol-prueba': sesionVigente.rol };
}

const ContextoSesion = createContext(null);

export function ProveedorSesion({ children }) {
  const [sesion, setSesion] = useState(sesionVigente);

  const valor = useMemo(
    () => ({
      sesion,
      cambiarSesion(clave) {
        const nueva = SESIONES_DE_PRUEBA.find((item) => item.clave === clave) ?? SESIONES_DE_PRUEBA[0];
        sesionVigente = nueva;
        try {
          localStorage.setItem(CLAVE_GUARDADA, nueva.clave);
        } catch {
          // Sin almacenamiento local la sesión dura hasta recargar la página.
        }
        setSesion(nueva);
      },
    }),
    [sesion],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion() {
  return useContext(ContextoSesion);
}
