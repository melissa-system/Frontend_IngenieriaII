import React, { useEffect, useState } from 'react';
import {
  obtenerUsuarios,
  obtenerRolesDisponibles,
  crearUsuario,
  cambiarEstadoUsuario,
  cambiarRolUsuario,
  type Usuario,
  type RolDisponible,
} from '../Services/usuarios.service';

const ROL_LABELS: Record<string, string> = {
  super_admin: 'Junta Directiva',
  admin: 'Administrador',
  fontanero: 'Fontanero',
  abonado: 'Abonado',
};

const ROLES_VISIBLES = ['super_admin', 'admin', 'fontanero', 'abonado'];

function getRoleBadgeColor(roleName: string) {
  const normalized = roleName.toLowerCase();
  if (normalized.includes('super') || normalized.includes('junta')) {
    return 'bg-purple-100 text-purple-800 border-purple-200';
  }
  if (normalized.includes('admin')) {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  if (normalized.includes('fontanero')) {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

const USUARIOS_POR_PAGINA = 8;

// Interruptor para activar/desactivar un usuario. No guarda nada por sí
// mismo: solo dispara la confirmación que luego llama al backend.
function EstadoSwitch({
  activo,
  disabled,
  onChange,
}: {
  activo: boolean
  disabled?: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={`Cambiar estado a ${activo ? 'Inactivo' : 'Activo'}`}
      title={`Cambiar estado a ${activo ? 'Inactivo' : 'Activo'}`}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-none items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        activo ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          activo ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}

export const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal Crear Usuario
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoRoleId, setNuevoRoleId] = useState<number | ''>('');
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [errorModalCrear, setErrorModalCrear] = useState<string | null>(null);

  // Modal Editar Rol
  const [modalEditarRol, setModalEditarRol] = useState<{
    usuario: Usuario;
    nuevoRoleId: number;
  } | null>(null);
  const [guardandoRol, setGuardandoRol] = useState(false);
  const [errorModalRol, setErrorModalRol] = useState<string | null>(null);

  // Modal Cambio de Estado (Activar / Inhabilitar)
  const [modalCambioEstado, setModalCambioEstado] = useState<{
    usuario: Usuario;
    nuevoEstado: boolean;
  } | null>(null);
  const [guardandoEstado, setGuardandoEstado] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      const [usersData, rolesData] = await Promise.all([
        obtenerUsuarios(),
        obtenerRolesDisponibles().catch(() => []),
      ]);
      setUsuarios(usersData);
      setRolesDisponibles(rolesData);
    } catch (err: any) {
      setError(err.message || 'Error al obtener usuarios del sistema');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const notificarExito = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => {
      setMensajeExito(null);
    }, 4000);
  };

  // Acciones Modal Crear Usuario
  const abrirModalCrear = () => {
    setNuevoEmail('');
    setNuevoPassword('');
    setNuevoRoleId(rolesVisibles.length > 0 ? rolesVisibles[0].id : '');    setErrorModalCrear(null);
    setModalCrearAbierto(true);
  };

  const cerrarModalCrear = () => {
    setModalCrearAbierto(false);
    setErrorModalCrear(null);
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEmail.trim() || !nuevoPassword || nuevoRoleId === '') {
      setErrorModalCrear('Todos los campos son obligatorios');
      return;
    }

    if (nuevoPassword.length < 8) {
      setErrorModalCrear('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setGuardandoUsuario(true);
      setErrorModalCrear(null);
      const nuevo = await crearUsuario({
        email: nuevoEmail.trim(),
        password: nuevoPassword,
        role_id: Number(nuevoRoleId),
      });

      if (nuevo.asociacion === 'abonado') {
        notificarExito(
          `Usuario ${nuevo.email} registrado y vinculado a su abonado.`,
        );
      } else if (nuevo.asociacion === 'empleado') {
        notificarExito(
          `Usuario ${nuevo.email} registrado y vinculado a su empleado.`,
        );
      } else {
        notificarExito(`Usuario ${nuevo.email} registrado exitosamente.`);
      }
      cerrarModalCrear();
      await cargarDatos();
    } catch (err: any) {
      setErrorModalCrear(err.message || 'No se pudo crear el usuario');
    } finally {
      setGuardandoUsuario(false);
    }
  };

  // Acciones Modal Editar Rol
  const handleConfirmarCambioRol = async () => {
    if (!modalEditarRol) return;
    setGuardandoRol(true);
    setErrorModalRol(null);
    try {
      const actualizado = await cambiarRolUsuario(
        modalEditarRol.usuario.id,
        modalEditarRol.nuevoRoleId,
      );
      setUsuarios((prev) =>
        prev.map((u) => (u.id === actualizado.id ? actualizado : u)),
      );
      notificarExito(
        `Rol de ${actualizado.email} actualizado a "${
          ROL_LABELS[actualizado.role] || actualizado.role
        }".`,
      );
      setModalEditarRol(null);
    } catch (err: any) {
      setErrorModalRol(err.message || 'No se pudo actualizar el rol');
    } finally {
      setGuardandoRol(false);
    }
  };

  // Acciones Modal Cambio de Estado
  const handleConfirmarCambioEstado = async () => {
    if (!modalCambioEstado) return;
    setGuardandoEstado(true);
    try {
      const actualizado = await cambiarEstadoUsuario(
        modalCambioEstado.usuario.id,
        modalCambioEstado.nuevoEstado,
      );
      setUsuarios((prev) =>
        prev.map((u) => (u.id === actualizado.id ? actualizado : u)),
      );
      notificarExito(
        `El usuario ${actualizado.email} ahora está ${
          actualizado.isActive ? 'Activo' : 'Inhabilitado'
        }.`,
      );
      setModalCambioEstado(null);
    } catch (err: any) {
      setError(err.message || 'No se pudo cambiar el estado del usuario');
    } finally {
      setGuardandoEstado(false);
    }
  };

  // Filtrado reactivo
  const usuariosFiltrados = usuarios.filter((u) => {
    const termino = busqueda.toLowerCase().trim();
    const coincideTexto =
      !termino ||
      u.email.toLowerCase().includes(termino) ||
      u.role.toLowerCase().includes(termino) ||
      (ROL_LABELS[u.role] || '').toLowerCase().includes(termino) ||
      String(u.id).includes(termino);

    const coincideRol =
      filtroRol === 'Todos' ||
      u.role === filtroRol ||
      ROL_LABELS[u.role] === filtroRol;

    const coincideEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'activos' && u.isActive) ||
      (filtroEstado === 'inactivos' && !u.isActive);

    return coincideTexto && coincideRol && coincideEstado;
  });

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaActual - 1) * USUARIOS_POR_PAGINA,
    paginaActual * USUARIOS_POR_PAGINA,
  );

  const rolesUnicos = [...new Set(usuarios.map((u) => u.role))];

  const rolesVisibles = rolesDisponibles.filter((rol) =>
    ROLES_VISIBLES.includes(rol.name),
  );

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">
            Gestión de Usuarios del Sistema
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            {usuarios.length} usuarios registrados en la plataforma
          </p>
        </div>
        <button
          type="button"
          onClick={abrirModalCrear}
          className="self-start rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
        >
          + Nuevo usuario
        </button>
      </div>

      {/* Mensajes de Notificación */}
      {mensajeExito && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4 text-sm font-medium text-green-800">
          <svg className="h-5 w-5 text-green-600 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{mensajeExito}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-sm font-medium text-red-800">
          <svg className="h-5 w-5 text-red-600 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs underline hover:text-red-900"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por correo, rol o ID..."
            className="w-full rounded-lg border border-primary-200 py-2.5 pl-10 pr-9 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              title="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-primary-300 hover:bg-primary-100 hover:text-primary-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Rol */}
          <select
            value={filtroRol}
            onChange={(e) => {
              setFiltroRol(e.target.value);
              setPagina(1);
            }}
            className="h-10 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="Todos">Todos los roles</option>
            {rolesUnicos.map((rol) => (
              <option key={rol} value={rol}>
                {ROL_LABELS[rol] || rol}
              </option>
            ))}
          </select>

          {/* Selector de Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value as any);
              setPagina(1);
            }}
            className="h-10 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Solo Activos</option>
            <option value="inactivos">Solo Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="rounded-xl border border-primary-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primary-100 text-left text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-primary-700">ID</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Usuario / Correo</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Rol Asignado</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha Registro</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50 text-primary-800">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-primary-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
                      <span>Cargando usuarios desde el backend...</span>
                    </div>
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-primary-500">
                    <p className="font-medium">No se encontraron usuarios coincidentes.</p>
                    <p className="text-xs text-primary-400 mt-1">
                      Intenta ajustar el término de búsqueda o los filtros seleccionados.
                    </p>
                  </td>
                </tr>
              ) : (
                usuariosPaginados.map((u) => {
                  const nombreUsuario = u.email.split('@')[0];
                  const rolLabel = ROL_LABELS[u.role] || u.role;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-primary-50/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-primary-500">
                        #{u.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-white shadow-sm flex-none">
                            {nombreUsuario.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-primary-900">
                              {nombreUsuario}
                            </p>
                            <p className="text-xs text-primary-500">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(
                            u.role,
                          )}`}
                        >
                          {rolLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <EstadoSwitch
                            activo={u.isActive}
                            onChange={() =>
                              setModalCambioEstado({
                                usuario: u,
                                nuevoEstado: !u.isActive,
                              })
                            }
                          />
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                              u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {u.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-primary-500">
                        {new Date(u.createdAt).toLocaleDateString('es-CR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setModalEditarRol({
                              usuario: u,
                                nuevoRoleId: u.role_id || rolesVisibles[0]?.id || 1,
                            });
                            setErrorModalRol(null);
                          }}
                          className="text-sm font-medium text-primary-500 hover:text-primary-700 hover:underline"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between border-t border-primary-100 px-6 py-3.5 text-sm bg-gray-50/50">
            <span className="text-xs text-primary-600">
              Página {paginaActual} de {totalPaginas} ({usuariosFiltrados.length} usuarios)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={paginaActual === 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-primary-200 bg-white px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="rounded-lg border border-primary-200 bg-white px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PARA CREAR NUEVO USUARIO */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-900">
                Registrar Nuevo Usuario
              </h2>
              <button
                type="button"
                onClick={cerrarModalCrear}
                className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-5">
              {errorModalCrear && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {errorModalCrear}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  placeholder="ejemplo@asada.com"
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Contraseña Inicial (mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  required
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Rol Asignado
                </label>
                <select
                  required
                  value={nuevoRoleId}
                  onChange={(e) => setNuevoRoleId(Number(e.target.value))}
                  className="mt-1 w-full rounded-full border border-primary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  {rolesVisibles.length === 0 ? (
                    <option value="">Cargando roles...</option>
                  ) : (
                    rolesVisibles.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {ROL_LABELS[rol.name] || rol.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={guardandoUsuario}
                  className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
                >
                  {guardandoUsuario ? 'Guardando...' : 'Registrar Usuario'}
                </button>
                <button
                  type="button"
                  onClick={cerrarModalCrear}
                  className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR ROL */}
      {modalEditarRol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-900">
                Editar Rol de Usuario
              </h2>
              <button
                type="button"
                onClick={() => setModalEditarRol(null)}
                className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              {errorModalRol && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {errorModalRol}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-primary-700">Usuario</p>
                <p className="mt-1 text-sm text-primary-500">
                  {modalEditarRol.usuario.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Nuevo Rol Asignado
                </label>
                <select
                  value={modalEditarRol.nuevoRoleId}
                  onChange={(e) =>
                    setModalEditarRol({
                      ...modalEditarRol,
                      nuevoRoleId: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-full border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
                >
                  {rolesVisibles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {ROL_LABELS[rol.name] || rol.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleConfirmarCambioRol}
                disabled={guardandoRol}
                className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
              >
                {guardandoRol ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={() => setModalEditarRol(null)}
                disabled={guardandoRol}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA CAMBIO DE ESTADO (ACTIVAR / INHABILITAR) */}
      {modalCambioEstado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-primary-900">
              {modalCambioEstado.nuevoEstado
                ? 'Confirmar activación de usuario'
                : 'Confirmar inhabilitación de usuario'}
            </h2>
            <p className="mt-3 text-sm text-primary-600">
              ¿Estás seguro de que deseas{' '}
              <span className="font-semibold text-primary-800">
                {modalCambioEstado.nuevoEstado ? 'activar' : 'inhabilitar'}
              </span>{' '}
              la cuenta de{' '}
              <span className="font-semibold text-primary-800">
                {modalCambioEstado.usuario.email}
              </span>
              ?
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                  modalCambioEstado.usuario.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {modalCambioEstado.usuario.isActive ? 'Activo' : 'Inactivo'}
              </span>
              <span aria-hidden="true" className="text-primary-400">→</span>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                  modalCambioEstado.nuevoEstado
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {modalCambioEstado.nuevoEstado ? 'Activo' : 'Inactivo'}
              </span>
            </p>
            {!modalCambioEstado.nuevoEstado && (
              <p className="mt-3 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                ⚠️ Al inhabilitar al usuario, se cerrarán de inmediato todas sus sesiones activas en cualquier dispositivo.
              </p>
            )}
            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleConfirmarCambioEstado}
                disabled={guardandoEstado}
                className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardandoEstado
                  ? 'Guardando...'
                  : modalCambioEstado.nuevoEstado
                  ? 'Sí, activar'
                  : 'Sí, inhabilitar'}
              </button>
              <button
                type="button"
                onClick={() => setModalCambioEstado(null)}
                disabled={guardandoEstado}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};