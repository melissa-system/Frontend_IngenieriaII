import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { resolverUrlArchivo } from '../../lib/urlArchivos'

interface DashboardHeaderProps {
  onToggleSidebar: () => void
}

// Ícono de "cambiar" (dos flechas cruzadas), usado en mobile donde no cabe
// el texto completo del botón de cambiar perfil.
function CambiarPerfilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}

function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const { user, rolEfectivo, perfilActivo, cambiarPerfil } = useAuth()
  const navigate = useNavigate()

  // Solo tiene sentido ofrecer el cambio si la cuenta realmente es abonada
  // vinculada Y su rol normal no es ya 'Abonado' (si ya lo es, no hay nada
  // que "ver como"). Caso inverso: personal cuyo rol base SÍ es Abonado
  // pero también tiene un Empleado vinculado (ej. alguien de la Junta que
  // se registró primero como abonado) — mutuamente excluyente con el
  // anterior, porque el rol base no puede ser 'Abonado' y otra cosa a la vez.
  const puedeVerComoAbonado = !!user?.vinculos.abonado && user.rol !== 'Abonado'
  const puedeVerComoEmpleado = !!user?.vinculos.empleado?.rol && user.rol === 'Abonado'

  const etiquetaAlterno = puedeVerComoAbonado
    ? 'Abonado'
    : (user?.vinculos.empleado?.puesto ?? '')

  async function alternarPerfil() {
    if (puedeVerComoAbonado) {
      await cambiarPerfil(perfilActivo === 'abonado' ? 'base' : 'abonado')
    } else if (puedeVerComoEmpleado) {
      await cambiarPerfil(perfilActivo === 'empleado' ? 'base' : 'empleado')
    }
    // El home del dashboard decide qué mostrar según el perfil activo
    // (ver DashboardHome.tsx) — volver ahí después de cambiar evita quedar
    // en una pantalla que ya no aplica al perfil nuevo (ej. Administración).
    navigate('/dashboard')
  }

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
        {(puedeVerComoAbonado || puedeVerComoEmpleado) && (
          <button
            type="button"
            onClick={alternarPerfil}
            title={
              perfilActivo !== 'base'
                ? `Volver a tu vista de ${user?.rol}`
                : `Ver como ${etiquetaAlterno}`
            }
            className="rounded-lg px-2 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-800 sm:rounded-full sm:border sm:border-primary-200 sm:px-3"
          >
            <span className="hidden sm:inline">
              {perfilActivo !== 'base' ? `Volver a ${user?.rol}` : `Ver como ${etiquetaAlterno}`}
            </span>
            <span className="sm:hidden">
              <CambiarPerfilIcon />
            </span>
          </button>
        )}

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
