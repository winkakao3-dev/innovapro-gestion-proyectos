import { AnimatePresence, motion } from 'motion/react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { EnlaceBoton } from './componentes/comunes.jsx';
import { SNAPPY } from './movimiento.js';
import ClienteFormulario from './paginas/ClienteFormulario.jsx';
import Clientes from './paginas/Clientes.jsx';
import MiProyecto from './paginas/MiProyecto.jsx';
import MisProyectos from './paginas/MisProyectos.jsx';
import ProyectoDetalle from './paginas/ProyectoDetalle.jsx';
import ProyectoFormulario from './paginas/ProyectoFormulario.jsx';
import Proyectos from './paginas/Proyectos.jsx';
import { SESIONES_DE_PRUEBA, useSesion } from './sesion.jsx';

const SECCIONES_PERSONAL = [
  { ruta: '/proyectos', etiqueta: 'Proyectos' },
  { ruta: '/clientes', etiqueta: 'Clientes' },
];

function Navegacion() {
  const { pathname } = useLocation();
  return (
    <nav className="navegacion" aria-label="Secciones">
      {SECCIONES_PERSONAL.map((seccion) => {
        const activa = pathname.startsWith(seccion.ruta);
        return (
          <NavLink key={seccion.ruta} to={seccion.ruta} className={`navegacion-enlace ${activa ? 'activa' : ''}`}>
            {activa && <motion.span layoutId="navegacion-indicador" className="navegacion-indicador" transition={SNAPPY} />}
            <span>{seccion.etiqueta}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function SelectorSesion() {
  const { sesion, cambiarSesion } = useSesion();
  const navegar = useNavigate();
  return (
    <label className="selector-sesion">
      <span className="selector-sesion-titulo">Sesión de prueba</span>
      <select
        value={sesion.clave}
        onChange={(evento) => {
          const nueva = SESIONES_DE_PRUEBA.find((item) => item.clave === evento.target.value);
          cambiarSesion(nueva.clave);
          navegar(nueva.rol === 'cliente' ? '/mis-proyectos' : '/proyectos');
        }}
      >
        {SESIONES_DE_PRUEBA.map((opcion) => (
          <option key={opcion.clave} value={opcion.clave}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </label>
  );
}

function NoEncontrado({ inicio }) {
  return (
    <div className="pagina pagina-estrecha">
      <h1>Esta página no existe</h1>
      <p className="texto-secundario">Puede que el enlace esté mal escrito o que el registro se haya eliminado.</p>
      <EnlaceBoton variante="primario" to={inicio}>
        Volver al inicio
      </EnlaceBoton>
    </div>
  );
}

export default function App() {
  const { sesion } = useSesion();
  const location = useLocation();
  const esCliente = sesion.rol === 'cliente';
  const inicio = esCliente ? '/mis-proyectos' : '/proyectos';

  return (
    <div className="aplicacion">
      <header className="encabezado">
        <div className="encabezado-contenido">
          <Link className="marca" to={inicio}>
            <span className="marca-nombre">Innovapro</span>
            <span className="marca-modulo">{esCliente ? 'Avance de proyectos' : 'Gestión de proyectos'}</span>
          </Link>
          {!esCliente && <Navegacion />}
          <SelectorSesion />
        </div>
      </header>

      <main className="contenido">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${sesion.clave}-${location.pathname}`}
            initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <Routes location={location}>
              {esCliente ? (
                <>
                  <Route path="/mis-proyectos" element={<MisProyectos />} />
                  <Route path="/mis-proyectos/:id" element={<MiProyecto />} />
                </>
              ) : (
                <>
                  <Route path="/proyectos" element={<Proyectos />} />
                  <Route path="/proyectos/nuevo" element={<ProyectoFormulario />} />
                  <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
                  <Route path="/proyectos/:id/editar" element={<ProyectoFormulario />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/clientes/nuevo" element={<ClienteFormulario />} />
                  <Route path="/clientes/:id/editar" element={<ClienteFormulario />} />
                </>
              )}
              <Route path="/" element={<Navigate to={inicio} replace />} />
              <Route path="*" element={<NoEncontrado inicio={inicio} />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
