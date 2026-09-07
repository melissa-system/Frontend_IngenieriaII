import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type PerfilActivo } from '../../contexts/AuthContext'
import {
  MENU_CONFIG,
  filterMenuByRole,
  type MenuItemConfig,
  type SubMenuItem,
} from '../../lib/menuConfig'

// Aplana un submenú (incluyendo los grupos anidados) a la lista de rutas
// que contiene, para saber si alguna está activa sin importar la profundidad.
function rutasDe(subs: SubMenuItem[]): string[] {
  return subs.flatMap((s) => [
    ...(s.to ? [s.to] : []),
    ...(s.submenu ? rutasDe(s.submenu) : []),
  ])
}

// Ícono de flecha usado como chevron en todos los toggles de submenú
// (nivel 1, 2 y 3) — evita repetir el mismo SVG en cada lugar.
function Chevron({ expanded, collapsed }: { expanded: boolean; collapsed?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={`h-4 w-4 flex-none transition-transform ${expanded ? 'rotate-180' : ''} ${
        collapsed ? 'lg:hidden' : ''
      }`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  )
}

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

// Claves de expansión propias del bloque "Perfil" (submenú anidado de dos
// niveles, armado a mano más abajo porque mezcla enlaces de ruta con
// acciones de cambio de perfil, algo que el renderItem genérico no soporta).
const PERFIL_KEY = 'Perfil'
const MI_PERFIL_KEY = 'Perfil__MiPerfil'
const CAMBIO_CUENTA_KEY = 'Perfil__CambioCuenta'

function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, rolEfectivo, perfilActivo, cambiarPerfil } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const role = rolEfectivo ?? ''

  const visibleItems = filterMenuByRole(MENU_CONFIG, role)

  const mainItems = visibleItems.filter((item) => item.label !== 'Perfil')
  const perfilItem = visibleItems.find((item) => item.label === 'Perfil')

  // Solo tiene sentido ofrecer "Cambio de cuenta" si la cuenta realmente
  // tiene un Abonado vinculado y su rol normal no es ya 'Abonado' (mismo
  // criterio que el botón del DashboardHeader).
  const puedeVerComoAbonado = !!user?.vinculos.abonado && user.rol !== 'Abonado'

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Mismo criterio que isActive: si la ruta trae query string hay que
    // compararlo también, si no, solo el pathname.
    const rutaActiva = (to: string) => {
      const actual = to.includes('?')
        ? `${location.pathname}${location.search}`
        : location.pathname
      return actual === to
    }
    // Recorre un submenú (con posibles grupos anidados) y arma las claves
    // de expansión de todo ancestro que contenga la ruta activa.
    const clavesActivas = (subs: SubMenuItem[], prefix: string): Record<string, boolean> => {
      const out: Record<string, boolean> = {}
      for (const sub of subs) {
        if (sub.submenu) {
          const key = `${prefix}__${sub.label}`
          if (rutasDe(sub.submenu).some(rutaActiva)) {
            out[key] = true
            Object.assign(out, clavesActivas(sub.submenu, key))
          }
        }
      }
      return out
    }

    const initial: Record<string, boolean> = {}
    for (const item of visibleItems) {
      if (item.submenu) {
        initial[item.label] = rutasDe(item.submenu).some(rutaActiva)
        Object.assign(initial, clavesActivas(item.submenu, item.label))
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

  // Auto-expande el bloque "Perfil" hasta el nivel de la ruta activa
  // (Editar perfil / Cambio de contraseña), aparte del efecto anterior
  // porque depende de location.pathname en cada navegación, no solo del rol.
  useEffect(() => {
    if (!location.pathname.startsWith('/dashboard/perfil')) return
    setExpanded((prev) => ({ ...prev, [PERFIL_KEY]: true, [MI_PERFIL_KEY]: true }))
  }, [location.pathname])

  const toggleExpand = (label: string) => {
    // Si el sidebar está colapsado (solo pasa en escritorio), un submenú no
    // tiene espacio para mostrarse: primero se expande el sidebar completo
    // y de una vez se abre el submenú, en vez de dejarlo en un estado roto.
    if (collapsed) onToggleCollapse()
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  // Algunos submenús comparten la misma ruta y se distinguen solo por un
  // query string (ej. Publicaciones = /dashboard/administrativo, Documentos
  // = /dashboard/administrativo?tab=documentos). Si "to" trae query, hay que
  // comparar pathname + search completos; si no trae, comparar solo el
  // pathname (así una ruta sin query nunca "roba" el resaltado de otra que
  // sí lo tiene, y viceversa).
  const isActive = (to: string) => {
    const actual = to.includes('?')
      ? `${location.pathname}${location.search}`
      : location.pathname
    return actual === to
  }
  const isSubmenuActive = (items: SubMenuItem[]) => rutasDe(items).some(isActive)

  // Cambia el perfil activo (rol base <-> Abonado) y vuelve al home del
  // dashboard, igual que el switcher del DashboardHeader — evita quedar en
  // una pantalla que ya no aplica al perfil nuevo (ej. Administración).
  function seleccionarPerfil(perfil: PerfilActivo) {
    cambiarPerfil(perfil)
    navigate('/dashboard')
  }

  // Renderiza una opción de submenú: enlace directo (hoja) o, si trae su
  // propio "submenu", un grupo desplegable más (recursivo, cualquier
  // profundidad — hoy solo se usa un nivel extra, en "Edición de página").
  function renderSubItem(sub: SubMenuItem, keyPrefix: string) {
    if (!sub.submenu) {
      return (
        <li key={sub.to}>
          <Link
            to={sub.to!}
            className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive(sub.to!)
                ? 'bg-primary-700 text-white font-medium'
                : 'text-primary-300 hover:bg-primary-800 hover:text-white'
            }`}
          >
            {sub.label}
          </Link>
        </li>
      )
    }

    const key = `${keyPrefix}__${sub.label}`
    const isExpanded = expanded[key] ?? false
    const active = isSubmenuActive(sub.submenu)

    return (
      <li key={key}>
        <button
          type="button"
          onClick={() => toggleExpand(key)}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
            active
              ? 'bg-primary-700 text-white font-medium'
              : 'text-primary-300 hover:bg-primary-800 hover:text-white'
          }`}
        >
          <span className="flex-1 text-left">{sub.label}</span>
          <Chevron expanded={isExpanded} />
        </button>
        {isExpanded && (
          <ul className="ml-2 mt-1 space-y-1 border-l border-primary-700 pl-4">
            {sub.submenu.map((child) => renderSubItem(child, key))}
          </ul>
        )}
      </li>
    )
  }

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
                {item.submenu!.map((sub) => renderSubItem(sub, item.label))}
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
          {/* Todo este bloque se despliega hacia arriba (flex-col-reverse en
              cada nivel): al estar pegado al fondo del sidebar, si abriera
              hacia abajo como el resto del menú no habría espacio y se vería
              cortado. Con la columna invertida el botón que dispara cada
              nivel queda fijo donde está y sus opciones aparecen encima. */}
          <ul className="space-y-1">
            <li className="flex flex-col-reverse">
              <button
                type="button"
                title="Perfil"
                onClick={() => toggleExpand(PERFIL_KEY)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  collapsed ? 'lg:justify-center' : ''
                } ${
                  location.pathname.startsWith('/dashboard/perfil')
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                }`}
              >
                <span className="flex-none">{perfilItem.icon}</span>
                <span className={`flex-1 text-left ${collapsed ? 'lg:hidden' : ''}`}>
                  Perfil
                </span>
                <Chevron expanded={expanded[PERFIL_KEY] ?? false} collapsed={collapsed} />
              </button>

              {expanded[PERFIL_KEY] && (
                <ul
                  className={`ml-2 mb-1 space-y-1 border-l border-primary-700 pl-4 ${
                    collapsed ? 'lg:hidden' : ''
                  }`}
                >
                  {/* ── Mi perfil: editar datos / cambiar contraseña ── */}
                  <li className="flex flex-col-reverse">
                    <button
                      type="button"
                      onClick={() => toggleExpand(MI_PERFIL_KEY)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        location.pathname.startsWith('/dashboard/perfil')
                          ? 'bg-primary-700 text-white font-medium'
                          : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                      }`}
                    >
                      <span className="flex-1 text-left">Mi perfil</span>
                      <Chevron expanded={expanded[MI_PERFIL_KEY] ?? false} />
                    </button>

                    {expanded[MI_PERFIL_KEY] && (
                      <ul className="ml-2 mb-1 space-y-1 border-l border-primary-700 pl-4">
                        <li>
                          <Link
                            to="/dashboard/perfil"
                            className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                              isActive('/dashboard/perfil')
                                ? 'bg-primary-700 text-white font-medium'
                                : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                            }`}
                          >
                            Editar perfil
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/dashboard/perfil/contrasena"
                            className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                              isActive('/dashboard/perfil/contrasena')
                                ? 'bg-primary-700 text-white font-medium'
                                : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                            }`}
                          >
                            Cambio de contraseña
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>

                  {/* ── Cambio de cuenta: perfiles disponibles con este correo ── */}
                  {puedeVerComoAbonado && (
                    <li className="flex flex-col-reverse">
                      <button
                        type="button"
                        onClick={() => toggleExpand(CAMBIO_CUENTA_KEY)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary-300 transition-colors hover:bg-primary-800 hover:text-white"
                      >
                        <span className="flex-1 text-left">Cambio de cuenta</span>
                        <Chevron expanded={expanded[CAMBIO_CUENTA_KEY] ?? false} />
                      </button>

                      {expanded[CAMBIO_CUENTA_KEY] && (
                        <ul className="ml-2 mb-1 space-y-1 border-l border-primary-700 pl-4">
                          <li>
                            <button
                              type="button"
                              onClick={() => seleccionarPerfil('base')}
                              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                perfilActivo === 'base'
                                  ? 'bg-primary-700 text-white font-medium'
                                  : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                              }`}
                            >
                              {user?.rol}
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => seleccionarPerfil('abonado')}
                              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                perfilActivo === 'abonado'
                                  ? 'bg-primary-700 text-white font-medium'
                                  : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                              }`}
                            >
                              Abonado
                            </button>
                          </li>
                        </ul>
                      )}
                    </li>
                  )}
                </ul>
              )}
            </li>
          </ul>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
