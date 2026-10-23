import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../api.js';
import { useAvisos } from '../componentes/avisos.jsx';
import { Boton, Campo, Cargando, EnlaceBoton, Mensaje } from '../componentes/comunes.jsx';
import { useDatos } from '../usarDatos.js';

const VACIO = { nombre: '', contacto: '', correo: '', telefono: '' };

export default function ClienteFormulario() {
  const { id } = useParams();
  const edicion = Boolean(id);
  const navegar = useNavigate();
  const avisar = useAvisos();
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const { datos: cliente, error } = useDatos(() => (edicion ? api.clientes.obtener(id) : Promise.resolve(null)), [id]);

  useEffect(() => {
    if (cliente) {
      setValores({
        nombre: cliente.nombre,
        contacto: cliente.contacto ?? '',
        correo: cliente.correo ?? '',
        telefono: cliente.telefono ?? '',
      });
    }
  }, [cliente]);

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setErrorGeneral(null);
    try {
      if (edicion) await api.clientes.actualizar(id, valores);
      else await api.clientes.crear(valores);
      avisar(edicion ? 'Cambios guardados' : 'Cliente registrado');
      navegar('/clientes');
    } catch (problema) {
      setErrores(problema.campos ?? {});
      setErrorGeneral(problema.message);
    } finally {
      setGuardando(false);
    }
  }

  if (error) {
    return (
      <div className="pagina pagina-estrecha">
        <Mensaje tipo="error" titulo="No se pudo abrir el cliente" accion={<EnlaceBoton to="/clientes">Volver a clientes</EnlaceBoton>}>
          {error.message}
        </Mensaje>
      </div>
    );
  }
  if (edicion && !cliente) return <Cargando texto="Cargando cliente…" />;

  const props = (campo) => ({
    id: `cliente-${campo}`,
    value: valores[campo],
    onChange: (evento) => {
      setValores((actuales) => ({ ...actuales, [campo]: evento.target.value }));
      setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
    },
    'aria-invalid': Boolean(errores[campo]),
    'aria-describedby': errores[campo] ? `cliente-${campo}-error` : undefined,
  });

  return (
    <div className="pagina pagina-estrecha">
      <Link to="/clientes" className="enlace-regreso">
        Clientes
      </Link>
      <h1>{edicion ? 'Editar cliente' : 'Nuevo cliente'}</h1>

      <form className="formulario" onSubmit={guardar} noValidate>
        <Campo etiqueta="Empresa" id="cliente-nombre" error={errores.nombre}>
          <input className="entrada" maxLength={150} {...props('nombre')} />
        </Campo>
        <Campo etiqueta="Persona de contacto" id="cliente-contacto" error={errores.contacto} ayuda="Opcional.">
          <input className="entrada" maxLength={150} {...props('contacto')} />
        </Campo>
        <div className="campos-en-fila">
          <Campo etiqueta="Correo" id="cliente-correo" error={errores.correo} ayuda="Opcional.">
            <input type="email" className="entrada" placeholder="correo@empresa.com" {...props('correo')} />
          </Campo>
          <Campo etiqueta="Teléfono" id="cliente-telefono" error={errores.telefono} ayuda="Opcional.">
            <input type="tel" className="entrada" {...props('telefono')} />
          </Campo>
        </div>

        {errorGeneral && <Mensaje tipo="error" titulo={errorGeneral} />}

        <div className="acciones-formulario">
          <Boton type="submit" variante="primario" disabled={guardando}>
            {guardando ? 'Guardando…' : edicion ? 'Guardar cambios' : 'Registrar cliente'}
          </Boton>
          <EnlaceBoton to="/clientes">Cancelar</EnlaceBoton>
        </div>
      </form>
    </div>
  );
}
