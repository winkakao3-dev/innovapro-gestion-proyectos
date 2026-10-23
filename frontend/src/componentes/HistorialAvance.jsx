import { motion } from 'motion/react';
import { formatearFechaHora } from '../formato.js';
import { entradaEscalonada } from '../movimiento.js';

// Mientras no exista la tabla de perfiles de la plataforma base, se muestra el inicio del id de la cuenta.
function autor(usuarioId) {
  return usuarioId ? `Cuenta ${usuarioId.slice(0, 8)}` : null;
}

export function HistorialAvance({ registros, mostrarAutor = true }) {
  if (registros.length === 0) {
    return <p className="texto-secundario">Aún no se ha registrado avance en este proyecto.</p>;
  }
  return (
    <ol className="historial">
      {registros.map((registro, indice) => (
        <motion.li key={registro.id} className="historial-registro" {...entradaEscalonada(indice)}>
          <span className="historial-porcentaje">{registro.porcentaje}%</span>
          <div className="historial-detalle">
            <span>{registro.comentario ?? (registro.etapaNombre ? `Avance en ${registro.etapaNombre}` : 'Avance registrado')}</span>
            <span className="texto-pequeno texto-secundario">
              {formatearFechaHora(registro.registradoEn)}
              {registro.etapaNombre && registro.comentario ? ` · ${registro.etapaNombre}` : ''}
              {mostrarAutor && registro.modificadoPor ? (
                <span title={registro.modificadoPor}> · {autor(registro.modificadoPor)}</span>
              ) : null}
            </span>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
