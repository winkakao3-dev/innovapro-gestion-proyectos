import { MotionConfig } from 'motion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';
import { ProveedorAvisos } from './componentes/avisos.jsx';
import { ProveedorSesion } from './sesion.jsx';
import './estilos.css';

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ProveedorSesion>
          <ProveedorAvisos>
            <App />
          </ProveedorAvisos>
        </ProveedorSesion>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
);
