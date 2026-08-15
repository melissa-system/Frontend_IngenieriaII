import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { MENU_CONFIG, filterMenuByRole, type MenuItemConfig } from '../../lib/menuConfig'

function Sidebar() {
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
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-primary-900 text-white">
      <div className="border-b border-primary-700 px-5 py-5">
        <span className="text-2xl font-black tracking-tight uppercase">
          SIAPB
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">{mainItems.map(renderItem)}</ul>
      </nav>

      {perfilItem && (
        <div className="border-t border-primary-700 px-3 py-3">
          <ul className="space-y-1">{renderItem(perfilItem)}</ul>
        </div>
      )}
    </aside>
  )
}

export default Sidebar