export function leerConfiguracion(entorno = process.env) {
  const modoAutenticacion = entorno.AUTENTICACION ?? (entorno.NODE_ENV === 'production' ? undefined : 'prueba');
  if (modoAutenticacion !== 'prueba') {
    throw new Error('AUTENTICACION debe ser "prueba": el inicio de sesión real llega con la plataforma base.');
  }

  return {
    puerto: Number(entorno.PORT ?? 3001),
    urlBaseDatos: entorno.DATABASE_URL ?? 'postgres://postgres@localhost:54329/gestion_proyectos',
    origenesPermitidos: (entorno.ORIGENES_PERMITIDOS ?? 'http://localhost:5173')
      .split(',')
      .map((origen) => origen.trim())
      .filter(Boolean),
    modoAutenticacion,
  };
}
