import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { MENU_CONFIG, filterMenuByRole, type MenuItemConfig } from '../../lib/menuConfig'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { user } = useAuth()
  const location = useLocation()
  const role = user?.rol ?? ''

  const visibleItems = filterMenuByRole(MENU_CONFIG, role)

  const mainItems = visibleItems.filter((item) => item.label !== 'Perfil')
  const perfilItem = visibleItems.find((item) => item.label === 'Perfil')

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const initial: Record<string, boolean> = {}
    for (const item of visibleItems) {
      if (item.submenu) {
        const anyActive = item.submenu.some((sub) => location.pathname === sub.to)
        initial[item.label] = anyActive
      }
    }
    setExpanded((prev) => {
      const merged = { ...prev }
      for (const key of Object.keys(initial)) {
        if (initial[key]) merged[key] = true
      }
      return merged
    })
  }, [role])

  const toggleExpand = (label: string) => {
    // Si el sidebar está colapsado (solo pasa en escritorio), un submenú no
    // tiene espacio para mostrarse: primero se expande el sidebar completo
    // y de una vez se abre el submenú, en vez de dejarlo en un estado roto.
    if (collapsed) onToggleCollapse()
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isActive = (to: string) => location.pathname === to
  const isSubmenuActive = (items: { to: string }[]) =>
    items.some((item) => location.pathname === item.to)

  function renderItem(item: MenuItemConfig) {
    const hasSubmenu = !!item.submenu?.length
    const isExpanded = expanded[item.label] ?? false
    const active =
      (!!item.to && isActive(item.to)) ||
      (hasSubmenu && isSubmenuActive(item.submenu!))

    return (
      <li key={item.label}>
        {hasSubmenu ? (
          <>
            <button
              type="button"
              title={item.label}
              onClick={() => toggleExpand(item.label)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                collapsed ? 'lg:justify-center' : ''
              } ${
                active
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
              }`}
            >
              <span className="flex-none">{item.icon}</span>
              <span className={`flex-1 text-left ${collapsed ? 'lg:hidden' : ''}`}>
                {item.label}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className={`h-4 w-4 flex-none transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                } ${collapsed ? 'lg:hidden' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {isExpanded && (
              <ul
                className={`ml-2 mt-1 space-y-1 border-l border-primary-700 pl-4 ${
                  collapsed ? 'lg:hidden' : ''
                }`}
              >
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
            title={item.label}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              collapsed ? 'lg:justify-center' : ''
            } ${
              active
                ? 'bg-primary-700 text-white'
                : 'text-primary-200 hover:bg-primary-800 hover:text-white'
            }`}
          >
            <span className="flex-none">{item.icon}</span>
            <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
          </Link>
        )}
      </li>
    )
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-primary-900 text-white transition-all duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:translate-x-0 ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}
    >
      <div className="flex items-center justify-between border-b border-primary-700 px-5 py-5">
        <span
          className={`text-2xl font-title font-bold tracking-normal uppercase ${
            collapsed ? 'lg:hidden' : ''
          }`}
        >
          SIAPB
        </span>
        <span className={`hidden text-xl font-title font-bold uppercase ${collapsed ? 'lg:block' : ''}`}>
          S
        </span>

        {/* Botón cerrar, solo visible en el drawer móvil */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1 text-primary-300 hover:bg-primary-800 hover:text-white lg:hidden"
          aria-label="Cerrar menú"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">{mainItems.map(renderItem)}</ul>
      </nav>

      {perfilItem && (
        <div className="border-t border-primary-700 px-3 py-3">
          <ul className="space-y-1">{renderItem(perfilItem)}</ul>
        </div>
      )}

      {/* Botón retráctil: solo tiene sentido en escritorio, donde el
          sidebar es parte fija del layout (en móvil es un drawer que se
          cierra con la X de arriba o el fondo oscuro). */}
      <button
        type="button"
        onClick={onToggleCollapse}
        title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        className="hidden items-center justify-center gap-2 border-t border-primary-700 px-3 py-3 text-sm font-medium text-primary-200 transition-colors hover:bg-primary-800 hover:text-white lg:flex"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`h-4 w-4 flex-none transition-transform ${collapsed ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {!collapsed && <span>Contraer</span>}
      </button>
    </aside>
  )
}

export default Sidebar
