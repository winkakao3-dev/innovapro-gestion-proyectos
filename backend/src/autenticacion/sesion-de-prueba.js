import { ErrorDeSolicitud } from '../errores.js';

// Sesión simulada mientras la plataforma base (Supabase Auth) no está lista.
// Sin encabezados se actúa como personal de Innovapro; para probar como cliente se envían
// x-usuario-prueba (uuid de la cuenta) y x-rol-prueba ("cliente" o "personal").
export const ROLES = ['personal', 'cliente'];

export const USUARIO_PERSONAL_DE_PRUEBA = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
  rol: 'personal',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function sesionDePrueba() {
  return (solicitud, _respuesta, siguiente) => {
    const id = solicitud.get('x-usuario-prueba');
    const rol = solicitud.get('x-rol-prueba');
    if (!id && !rol) {
      solicitud.usuario = USUARIO_PERSONAL_DE_PRUEBA;
      siguiente();
      return;
    }
    if (!UUID.test(id ?? '') || !ROLES.includes(rol)) {
      siguiente(new ErrorDeSolicitud(401, 'La sesión de prueba no es válida'));
      return;
    }
    solicitud.usuario = { id, rol };
    siguiente();
  };
}

export function exigirRol(rol) {
  return (solicitud, _respuesta, siguiente) => {
    if (solicitud.usuario?.rol === rol) siguiente();
    else siguiente(new ErrorDeSolicitud(403, 'No tienes permiso para esta sección'));
  };
}
