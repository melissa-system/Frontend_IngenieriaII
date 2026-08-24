import { useState } from 'react'
import { MOCK_USUARIOS } from '../../lib/mockData'

function Seguridad() {
  const [filter, setFilter] = useState('Todos')

  const filtered =
    filter === 'Todos'
      ? MOCK_USUARIOS
      : MOCK_USUARIOS.filter((u) => u.rol === filter)

  const roles = [...new Set(MOCK_USUARIOS.map((u) => u.rol))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">
            Seguridad
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            {MOCK_USUARIOS.length} usuarios del sistema
          </p>
        </div>
        <button
          type="button"
          className="self-start rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
        >
          + Nuevo usuario
        </button>
      </div>

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="h-10 rounded-full border border-primary-200 px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
      >
        <option value="Todos">Todos los roles</option>
        {roles.map((rol) => (
          <option key={rol} value={rol}>
            {rol}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((user) => (
          <div
            key={user.id}
            className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary-900">{user.nombre}</p>
                <p className="text-xs text-primary-500">@{user.username}</p>
              </div>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  user.estado === 'Activo'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {user.estado}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm text-primary-600">
              <p>
                <span className="font-medium text-primary-700">Rol:</span> {user.rol}
              </p>
              <p>
                <span className="font-medium text-primary-700">Email:</span> {user.email}
              </p>
            </div>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
              >
                Editar
              </button>
              <button
                type="button"
                className="text-sm font-medium text-red-500 hover:text-red-700 hover:underline"
              >
                Desactivar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Seguridad
