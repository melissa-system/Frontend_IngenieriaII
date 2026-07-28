import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.svg'

interface SubMenuItem {
  label: string
  to: string
}

interface MenuItem {
  label: string
  icon: React.ReactNode
  to?: string
  submenu?: SubMenuItem[]
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    to: '/dashboard',
  },
  {
    label: 'Gestión',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    submenu: [
      { label: 'Abonados', to: '/dashboard/abonados' },
      { label: 'Solicitudes', to: '/dashboard/solicitudes' },
    ],
  },
  {
    label: 'Operaciones',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    submenu: [
      { label: 'Inventario', to: '/dashboard/inventario' },
      { label: 'Averías', to: '/dashboard/averias' },
    ],
  },
  {
    label: 'Administración',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
      </svg>
    ),
    submenu: [
      { label: 'Administrativo', to: '/dashboard/administrativo' },
      { label: 'Seguridad', to: '/dashboard/seguridad' },
    ],
  },
]

const BOTTOM_MENU: MenuItem[] = [
  {
    label: 'Perfil',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    to: '/dashboard/perfil',
  },
]

function Sidebar() {
  const location = useLocation()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Gestión: true,
    Operaciones: false,
    Administración: false,
  })

  const toggleExpand = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isActive = (to: string) => location.pathname === to
  const isSubmenuActive = (items: SubMenuItem[]) =>
    items.some((item) => location.pathname === item.to)

  return (
    <aside className="flex h-screen w-64 flex-col bg-primary-900 text-white">
      {/* Logo + SIAPB */}
      <div className="flex items-center gap-3 border-b border-primary-700 px-5 py-4">
        <img
          src={logo}
          alt="Logo SIAPB"
          className="h-10 w-10 rounded-full bg-white object-cover"
        />
        <span className="font-heading text-xl font-semibold tracking-wide">
          SIAPB
        </span>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {MENU_ITEMS.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0
            const isExpanded = expanded[item.label]
            const active =
              (item.to && isActive(item.to)) ||
              (hasSubmenu && isSubmenuActive(item.submenu!))

            return (
              <li key={item.label}>
                {hasSubmenu ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.label)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary-700 text-white'
                          : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                      }`}
                    >
                      <span className="flex-none">{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className={`h-4 w-4 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <ul className="ml-2 mt-1 space-y-1 border-l border-primary-700 pl-4">
                        {item.submenu!.map((sub) => (
                          <li key={sub.to}>
                            <Link
                              to={sub.to}
                              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                                isActive(sub.to)
                                  ? 'bg-primary-700 text-white font-medium'
                                  : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                              }`}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.to!}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary-700 text-white'
                        : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                    }`}
                  >
                    <span className="flex-none">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom: Perfil */}
      <div className="border-t border-primary-700 px-3 py-3">
        <ul className="space-y-1">
          {BOTTOM_MENU.map((item) => (
            <li key={item.label}>
              <Link
                to={item.to!}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.to!)
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                }`}
              >
                <span className="flex-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

export default Sidebar
