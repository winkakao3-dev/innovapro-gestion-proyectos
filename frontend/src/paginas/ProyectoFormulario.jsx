import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../api.js';
import { useAvisos } from '../componentes/avisos.jsx';
import { Boton, Campo, Cargando, EnlaceBoton, Mensaje } from '../componentes/comunes.jsx';
import { ESTADOS_PROYECTO } from '../formato.js';
import { useDatos } from '../usarDatos.js';

const VACIO = { clienteId: '', nombre: '', descripcion: '', fechaInicio: '', fechaEstimadaTermino: '', estado: 'planeado', enlaceDemo: '' };

export default function ProyectoFormulario() {
  const { id } = useParams();
  const edicion = Boolean(id);
  const navegar = useNavigate();
  const avisar = useAvisos();
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const { datos: clientes, error: errorClientes } = useDatos(() => api.clientes.listar(), []);
  const { datos: proyecto, error: errorProyecto } = useDatos(() => (edicion ? api.proyectos.obtener(id) : Promise.resolve(null)), [id]);

  useEffect(() => {
    if (!proyecto) return;
    setValores({
      clienteId: String(proyecto.clienteId),
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion ?? '',
      fechaInicio: proyecto.fechaInicio,
      fechaEstimadaTermino: proyecto.fechaEstimadaTermino,
      estado: proyecto.estado,
      enlaceDemo: proyecto.enlaceDemo ?? '',
    });
  }, [proyecto]);

  function cambiar(campo) {
    return (evento) => {
      setValores((actuales) => ({ ...actuales, [campo]: evento.target.value }));
      setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
    };
  }

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setErrorGeneral(null);
    try {
      const datos = { ...valores, clienteId: valores.clienteId ? Number(valores.clienteId) : null };
      const guardado = edicion ? await api.proyectos.actualizar(id, datos) : await api.proyectos.crear(datos);
      avisar(edicion ? 'Cambios guardados' : 'Proyecto registrado');
      navegar(`/proyectos/${guardado.id}`);
    } catch (error) {
      setErrores(error.campos ?? {});
      setErrorGeneral(error.message);
    } finally {
      setGuardando(false);
    }
  }

  if (errorProyecto) {
    return (
      <div className="pagina pagina-estrecha">
        <Mensaje tipo="error" titulo="No se pudo abrir el proyecto" accion={<EnlaceBoton to="/proyectos">Volver a proyectos</EnlaceBoton>}>
          {errorProyecto.message}
        </Mensaje>
      </div>
    );
  }
  if (edicion && !proyecto) return <Cargando texto="Cargando proyecto…" />;

  const props = (campo) => ({
    id: `proyecto-${campo}`,
    value: valores[campo],
    onChange: cambiar(campo),
    'aria-invalid': Boolean(errores[campo]),
    'aria-describedby': errores[campo] ? `proyecto-${campo}-error` : undefined,
  });

  return (
    <div className="pagina pagina-estrecha">
      <Link to={edicion ? `/proyectos/${id}` : '/proyectos'} className="enlace-regreso">
        {edicion ? proyecto.nombre : 'Proyectos'}
      </Link>
      <h1>{edicion ? 'Editar proyecto' : 'Nuevo proyecto'}</h1>
      <p className="texto-secundario">
        El avance no se edita aquí: se registra desde el detalle del proyecto para conservar su historial.
      </p>

      {errorClientes && <Mensaje tipo="error" titulo="No se pudo cargar la lista de clientes">{errorClientes.message}</Mensaje>}

      <form className="formulario" onSubmit={guardar} noValidate>
        <Campo
          etiqueta="Cliente"
          id="proyecto-clienteId"
          error={errores.clienteId}
          ayuda={
            <>
              ¿No aparece? <Link to="/clientes/nuevo">Registra al cliente</Link> primero.
            </>
          }
        >
          <select className="entrada" {...props('clienteId')} disabled={!clientes}>
            <option value="">{clientes ? 'Elige un cliente' : 'Cargando clientes…'}</option>
            {clientes?.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Nombre del proyecto" id="proyecto-nombre" error={errores.nombre}>
          <input className="entrada" maxLength={150} {...props('nombre')} />
        </Campo>

        <Campo etiqueta="Descripción" id="proyecto-descripcion" error={errores.descripcion} ayuda="Opcional. Qué se va a construir o automatizar.">
          <textarea className="entrada" rows={3} {...props('descripcion')} />
        </Campo>

        <div className="campos-en-fila">
          <Campo etiqueta="Fecha de inicio" id="proyecto-fechaInicio" error={errores.fechaInicio}>
            <input type="date" className="entrada" {...props('fechaInicio')} />
          </Campo>
          <Campo etiqueta="Fecha estimada de término" id="proyecto-fechaEstimadaTermino" error={errores.fechaEstimadaTermino}>
            <input type="date" className="entrada" min={valores.fechaInicio || undefined} {...props('fechaEstimadaTermino')} />
          </Campo>
        </div>

        <Campo etiqueta="Estado" id="proyecto-estado" error={errores.estado}>
          <select className="entrada" {...props('estado')}>
            {ESTADOS_PROYECTO.map((estado) => (
              <option key={estado.valor} value={estado.valor}>
                {estado.etiqueta}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Enlace a la demo" id="proyecto-enlaceDemo" error={errores.enlaceDemo} ayuda="Opcional. El cliente lo verá en la consulta de su proyecto.">
          <input type="url" className="entrada" placeholder="https://" {...props('enlaceDemo')} />
        </Campo>

        {errorGeneral && <Mensaje tipo="error" titulo={errorGeneral} />}

        <div className="acciones-formulario">
          <Boton type="submit" variante="primario" disabled={guardando}>
            {guardando ? 'Guardando…' : edicion ? 'Guardar cambios' : 'Registrar proyecto'}
          </Boton>
          <EnlaceBoton to={edicion ? `/proyectos/${id}` : '/proyectos'}>Cancelar</EnlaceBoton>
        </div>
      </form>
    </div>
  );
}
