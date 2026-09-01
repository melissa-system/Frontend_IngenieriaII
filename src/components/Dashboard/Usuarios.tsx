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
    setNuevoRoleId(rolesDisponibles.length > 0 ? rolesDisponibles[0].id : '');
    setErrorModalCrear(null);
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
      await crearUsuario({
        email: nuevoEmail.trim(),
        password: nuevoPassword,
        role_id: Number(nuevoRoleId),
      });

      notificarExito(`Usuario ${nuevoEmail.trim()} registrado exitosamente.`);
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

  // Estadísticas rápidas
  const totalActivos = usuarios.filter((u) => u.isActive).length;
  const totalInactivos = usuarios.length - totalActivos;
  const rolesUnicos = [...new Set(usuarios.map((u) => u.role))];

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={cargarDatos}
            disabled={cargando}
            className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-sm hover:bg-primary-50 transition-colors disabled:opacity-60"
            title="Recargar datos del servidor"
          >
            <svg
              className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Actualizar
          </button>
          <button
            type="button"
            onClick={abrirModalCrear}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white font-medium rounded-full shadow text-sm transition-colors"
          >
            + Nuevo usuario
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">
            Total Usuarios
          </p>
          <p className="mt-2 text-3xl font-bold text-primary-900">
            {usuarios.length}
          </p>
          <p className="mt-1 text-xs text-primary-400">Registrados en BD</p>
        </div>
        <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
            Cuentas Activas
          </p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {totalActivos}
          </p>
          <p className="mt-1 text-xs text-green-600">Con acceso autorizado</p>
        </div>
        <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
            Inactivos / Pendientes
          </p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {totalInactivos}
          </p>
          <p className="mt-1 text-xs text-red-400">Sin acceso o desactivados</p>
        </div>
        <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">
            Roles Asignados
          </p>
          <p className="mt-2 text-3xl font-bold text-primary-900">
            {rolesUnicos.length}
          </p>
          <p className="mt-1 text-xs text-primary-400">Perfiles de seguridad</p>
        </div>
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
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por correo, rol o ID..."
            className="w-full rounded-full border border-primary-200 bg-white pl-10 pr-4 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none placeholder:text-primary-400"
          />
          <svg
            className="absolute left-3.5 top-2.5 h-4 w-4 text-primary-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
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
            <thead className="bg-primary-50 text-primary-700 font-semibold">
              <tr>
                <th className="px-6 py-3.5">ID</th>
                <th className="px-6 py-3.5">Usuario / Correo</th>
                <th className="px-6 py-3.5">Rol Asignado</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5">Fecha Registro</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50 text-primary-800">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-primary-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
                      <span>Cargando usuarios desde el backend...</span>
                    </div>
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-primary-500">
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
                      <td className="px-6 py-4 font-mono text-xs text-primary-500">
                        #{u.id}
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(
                            u.role,
                          )}`}
                        >
                          {rolLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-primary-500">
                        {new Date(u.createdAt).toLocaleDateString('es-CR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 text-sm whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setModalEditarRol({
                              usuario: u,
                              nuevoRoleId: u.role_id || rolesDisponibles[0]?.id || 1,
                            });
                            setErrorModalRol(null);
                          }}
                          className="px-3 py-1 rounded-md text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors border border-primary-200"
                        >
                          Editar Rol
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setModalCambioEstado({
                              usuario: u,
                              nuevoEstado: !u.isActive,
                            })
                          }
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors border ${
                            u.isActive
                              ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                              : 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200'
                          }`}
                        >
                          {u.isActive ? 'Inhabilitar' : 'Activar'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-primary-100">
            <div className="flex items-center justify-between border-b border-primary-100 pb-3">
              <h2 className="text-lg font-semibold text-primary-900">
                Registrar Nuevo Usuario
              </h2>
              <button
                type="button"
                onClick={cerrarModalCrear}
                className="rounded-lg p-1 text-primary-400 hover:bg-primary-50 hover:text-primary-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="mt-4 space-y-4">
              {errorModalCrear && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {errorModalCrear}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  placeholder="ejemplo@asada.com"
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">
                  Contraseña Inicial (mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  required
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">
                  Rol Asignado
                </label>
                <select
                  required
                  value={nuevoRoleId}
                  onChange={(e) => setNuevoRoleId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                >
                  {rolesDisponibles.length === 0 ? (
                    <option value="">Cargando roles...</option>
                  ) : (
                    rolesDisponibles.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {ROL_LABELS[rol.name] || rol.name} {rol.description ? `(${rol.description})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-primary-100">
                <button
                  type="button"
                  onClick={cerrarModalCrear}
                  disabled={guardandoUsuario}
                  className="px-4 py-2 border border-primary-200 text-primary-700 rounded-lg text-sm hover:bg-primary-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoUsuario}
                  className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg text-sm font-medium shadow transition-colors disabled:opacity-50"
                >
                  {guardandoUsuario ? 'Guardando...' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR ROL */}
      {modalEditarRol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-primary-100">
            <div className="flex items-center justify-between border-b border-primary-100 pb-3">
              <h2 className="text-lg font-semibold text-primary-900">
                Editar Rol de Usuario
              </h2>
              <button
                type="button"
                onClick={() => setModalEditarRol(null)}
                className="rounded-lg p-1 text-primary-400 hover:bg-primary-50 hover:text-primary-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {errorModalRol && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {errorModalRol}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase text-primary-500">
                  Usuario
                </p>
                <p className="text-sm font-medium text-primary-900 mt-0.5">
                  {modalEditarRol.usuario.email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-primary-500 mb-1">
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
                  className="w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
                >
                  {rolesDisponibles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {ROL_LABELS[rol.name] || rol.name} {rol.description ? `(${rol.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-primary-100 pt-3">
              <button
                type="button"
                onClick={() => setModalEditarRol(null)}
                disabled={guardandoRol}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarCambioRol}
                disabled={guardandoRol}
                className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
              >
                {guardandoRol ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA CAMBIO DE ESTADO (ACTIVAR / INHABILITAR) */}
      {modalCambioEstado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-primary-100">
            <h2 className="text-lg font-semibold text-primary-900">
              {modalCambioEstado.nuevoEstado
                ? 'Confirmar Activación de Usuario'
                : 'Confirmar Inhabilitación de Usuario'}
            </h2>
            <p className="mt-3 text-sm text-primary-600">
              ¿Estás seguro de que deseas{' '}
              <strong className="font-semibold text-primary-900">
                {modalCambioEstado.nuevoEstado ? 'activar' : 'inhabilitar'}
              </strong>{' '}
              la cuenta de{' '}
              <strong className="font-semibold text-primary-900">
                {modalCambioEstado.usuario.email}
              </strong>
              ?
            </p>
            {!modalCambioEstado.nuevoEstado && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                ⚠️ Al inhabilitar al usuario, se cerrarán de inmediato todas sus sesiones activas en cualquier dispositivo.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-primary-100 pt-3">
              <button
                type="button"
                onClick={() => setModalCambioEstado(null)}
                disabled={guardandoEstado}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarCambioEstado}
                disabled={guardandoEstado}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${
                  modalCambioEstado.nuevoEstado
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {guardandoEstado
                  ? 'Procesando...'
                  : modalCambioEstado.nuevoEstado
                  ? 'Sí, activar cuenta'
                  : 'Sí, inhabilitar cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};