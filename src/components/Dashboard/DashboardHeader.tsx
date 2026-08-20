import { useAuth } from '../../contexts/AuthContext'

function DashboardHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 items-center justify-end border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-primary-900">{user?.nombre}</p>
          <p className="text-xs text-primary-500">{user?.rol}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white">
          {user?.nombre.charAt(0).toUpperCase()}
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}

export default DashboardHeader
