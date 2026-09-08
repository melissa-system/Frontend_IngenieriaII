import { useAuth } from '../../contexts/AuthContext'
import { resolverUrlArchivo } from '../../lib/urlArchivos'

interface DashboardHeaderProps {
  onToggleSidebar: () => void
}

function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  // El cambio de perfil (Abonado <-> rol base) se hace únicamente desde
  // "Perfil > Cambio de cuenta" en el Sidebar; acá ya no hay un botón
  // duplicado para eso.
  const { user, rolEfectivo } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-primary-700 hover:bg-primary-50"
        aria-label="Mostrar u ocultar el menú"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-primary-900">{user?.nombre}</p>
          <p className="text-xs text-primary-500">{rolEfectivo}</p>
        </div>
        {/* Misma foto que se administra en Editar perfil (PerfilEditar.tsx)
            — si no hay foto_url todavía cargado o nunca se subió una, se
            muestra la inicial como respaldo. El botón de cerrar sesión se
            quitó de acá: ya vive en la burbuja de 'Perfil' del sidebar. */}
        {user?.fotoUrl ? (
          <img
            src={resolverUrlArchivo(user.fotoUrl)}
            alt="Foto de perfil"
            className="h-9 w-9 flex-none rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white">
            {user?.nombre.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  )
}

export default DashboardHeader
