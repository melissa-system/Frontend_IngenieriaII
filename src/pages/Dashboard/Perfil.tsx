import { useAuth } from '../../contexts/AuthContext'

function Perfil() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-primary-900">
          Mi Perfil
        </h1>
        <p className="mt-1 text-sm text-primary-500">
          Información de tu cuenta en SIAPB
        </p>
      </div>

      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-700 text-xl font-bold text-white">
            {user.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold text-primary-900">
              {user.nombre}
            </h2>
            <p className="text-sm text-primary-500">{user.rol}</p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-primary-700">Nombre completo</label>
            <input
              type="text"
              defaultValue={user.nombre}
              className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">Nombre de usuario</label>
            <input
              type="text"
              defaultValue={user.username}
              readOnly
              className="mt-1 w-full rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm text-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">Correo electrónico</label>
            <input
              type="email"
              defaultValue={user.email}
              className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">Rol</label>
            <input
              type="text"
              defaultValue={user.rol}
              readOnly
              className="mt-1 w-full rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm text-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">Nueva contraseña</label>
            <input
              type="password"
              placeholder="Dejar en blanco para mantener la actual"
              className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
          >
            Actualizar perfil
          </button>
        </div>
      </div>
    </div>
  )
}

export default Perfil
