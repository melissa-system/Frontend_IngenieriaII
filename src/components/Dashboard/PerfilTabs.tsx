import { NavLink } from 'react-router-dom'

// Pestañas de la sección "Mi perfil": hoy son solo estas dos páginas reales
// (a diferencia de un mock con pestañas decorativas, cada una enlaza a algo
// que existe). Se muestran arriba de Editar perfil y Cambio de contraseña
// para que ambas se sientan parte de la misma pantalla de configuración.
const TABS = [
  { to: '/dashboard/perfil', label: 'Editar perfil', end: true },
  { to: '/dashboard/perfil/contrasena', label: 'Cambio de contraseña', end: false },
]

function PerfilTabs() {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-primary-700 text-white'
                : 'text-primary-500 hover:bg-primary-50 hover:text-primary-700'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}

export default PerfilTabs
