import { useState, useEffect, useRef } from 'react'
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

// Íconos de las opciones de la burbuja de "Perfil" (ver más abajo).
function IconEditarPerfil() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 flex-none">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4Z" />
    </svg>
  )
}

function IconContrasena() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 flex-none">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  )
}

function IconCambioCuenta() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 flex-none">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 flex-none">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function IconCerrarSesion() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 flex-none">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
    </svg>
  )
}

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, rolEfectivo, perfilActivo, cambiarPerfil, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const role = rolEfectivo ?? ''

  const visibleItems = filterMenuByRole(MENU_CONFIG, role)

  const mainItems = visibleItems.filter((item) => item.label !== 'Perfil')
  const perfilItem = visibleItems.find((item) => item.label === 'Perfil')

  // Solo tiene sentido ofrecer "Cambio de cuenta" si la cuenta realmente
  // tiene un Abonado vinculado y su rol normal no es ya 'Abonado' (mismo
  // criterio que el botón del DashboardHeader). Caso inverso: rol base
  // 'Abonado' con un Empleado vinculado — mutuamente excluyente con el
  // anterior (el rol base no puede ser 'Abonado' y otra cosa a la vez).
  const puedeVerComoAbonado = !!user?.vinculos.abonado && user.rol !== 'Abonado'
  const puedeVerComoEmpleado = !!user?.vinculos.empleado?.rol && user.rol === 'Abonado'

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

  // Burbuja de "Perfil": abre/cierra con su propio estado (no es un
  // accordion de "expanded" como el resto del menú) y se cierra sola al
  // hacer clic afuera.
  const [perfilMenuOpen, setPerfilMenuOpen] = useState(false)
  const perfilMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!perfilMenuOpen) return
    function alClicFuera(e: MouseEvent) {
      if (perfilMenuRef.current && !perfilMenuRef.current.contains(e.target as Node)) {
        setPerfilMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', alClicFuera)
    return () => document.removeEventListener('mousedown', alClicFuera)
  }, [perfilMenuOpen])

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
    setPerfilMenuOpen(false)
    navigate('/dashboard')
  }

  // Renderiza una opción de submenú: enlace directo (hoja) o, si trae su
  // propio "submenu", un grupo desplegable más (recursivo, cualquier
  // profundidad — hoy solo se usa un nivel extra, en "Edición de página").
  function renderSubItem(sub: SubMenuItem, keyPrefix: string) {
    if (!sub.submenu) {
      const active = isActive(sub.to!)
      return (
        <li key={sub.to}>
          <Link
            to={sub.to!}
            className={`block rounded-2xl pl-3 pr-3 py-2 text-sm transition-colors ${
              active
                ? '-mr-3 bg-white font-medium text-primary-900 shadow-md'
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
    // Mismo criterio que en renderItem: también se marca activo mientras
    // está desplegado, no solo cuando ya estás en una de sus subpáginas.
    const active = isSubmenuActive(sub.submenu) || isExpanded

    return (
      <li key={key}>
        <button
          type="button"
          onClick={() => toggleExpand(key)}
          className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-colors ${
            active
              ? '-mr-3 bg-white font-medium text-primary-900 shadow-md'
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
    // Un ítem con submenú se marca como activo también mientras está
    // desplegado (no solo cuando ya estás en una de sus subpáginas): así
    // se ve el "clic" al abrirlo, en vez de quedar sin resaltar hasta
    // navegar a algo de adentro.
    const active =
      (!!item.to && isActive(item.to)) ||
      (hasSubmenu && (isSubmenuActive(item.submenu!) || isExpanded))

    return (
      <li key={item.label}>
        {hasSubmenu ? (
          <>
            <button
              type="button"
              title={item.label}
              onClick={() => toggleExpand(item.label)}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                collapsed ? 'lg:justify-center' : ''
              } ${
                active
                  ? '-mr-3 bg-white text-primary-900 shadow-md'
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
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
              collapsed ? 'lg:justify-center' : ''
            } ${
              active
                ? '-mr-3 bg-white text-primary-900 shadow-md'
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
        {/* El ítem activo cancela este padding derecho con -mr-3 (ver
            renderItem/renderSubItem), para que su pastilla blanca llegue
            hasta el borde real del sidebar en vez de quedar con un margen
            oscuro alrededor — los demás ítems mantienen el padding normal. */}
        <ul className="space-y-1">{mainItems.map(renderItem)}</ul>
      </nav>

      {perfilItem && (
        <div className="border-t border-primary-700 px-3 py-3">
          {/* Burbuja flotante (como el menú de cuenta de un IDE/app de
              escritorio): se despliega hacia arriba desde el chip del
              usuario, sin empujar el resto del sidebar ni verse cortada al
              estar pegada al fondo. */}
          <div className="relative" ref={perfilMenuRef}>
            {perfilMenuOpen && (
              <div className="absolute bottom-full left-0 z-20 mb-2 w-72 overflow-hidden rounded-xl border border-primary-700 bg-primary-800 shadow-2xl">
                <div className="px-4 py-3">
                  <p className="truncate text-sm font-medium text-white">{user?.nombre}</p>
                  <p className="truncate text-xs text-primary-400">{user?.email}</p>
                </div>

                <div className="border-t border-primary-700 py-1.5">
                  <Link
                    to="/dashboard/perfil"
                    onClick={() => setPerfilMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                      isActive('/dashboard/perfil')
                        ? 'text-white'
                        : 'text-primary-200 hover:bg-primary-700 hover:text-white'
                    }`}
                  >
                    <IconEditarPerfil />
                    Editar perfil
                  </Link>
                  <Link
                    to="/dashboard/perfil/contrasena"
                    onClick={() => setPerfilMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                      isActive('/dashboard/perfil/contrasena')
                        ? 'text-white'
                        : 'text-primary-200 hover:bg-primary-700 hover:text-white'
                    }`}
                  >
                    <IconContrasena />
                    Cambio de contraseña
                  </Link>
                </div>

                {/* ── Cambio de cuenta: perfiles disponibles con este correo ── */}
                {(puedeVerComoAbonado || puedeVerComoEmpleado) && (
                  <div className="border-t border-primary-700 py-1.5">
                    <p className="flex items-center gap-2.5 px-4 pt-1 pb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-400">
                      <IconCambioCuenta />
                      Cambio de cuenta
                    </p>
                    <button
                      type="button"
                      onClick={() => seleccionarPerfil('base')}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-primary-200 transition-colors hover:bg-primary-700 hover:text-white"
                    >
                      <span className="flex-1 truncate">{user?.rol}</span>
                      {perfilActivo === 'base' && <IconCheck />}
                    </button>
                    {puedeVerComoAbonado && (
                      <button
                        type="button"
                        onClick={() => seleccionarPerfil('abonado')}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-primary-200 transition-colors hover:bg-primary-700 hover:text-white"
                      >
                        <span className="flex-1 truncate">Abonado</span>
                        {perfilActivo === 'abonado' && <IconCheck />}
                      </button>
                    )}
                    {puedeVerComoEmpleado && (
                      <button
                        type="button"
                        onClick={() => seleccionarPerfil('empleado')}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-primary-200 transition-colors hover:bg-primary-700 hover:text-white"
                      >
                        <span className="flex-1 truncate">{user?.vinculos.empleado?.puesto}</span>
                        {perfilActivo === 'empleado' && <IconCheck />}
                      </button>
                    )}
                  </div>
                )}

                <div className="border-t border-primary-700 py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPerfilMenuOpen(false)
                      logout()
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-red-300 transition-colors hover:bg-primary-700 hover:text-red-200"
                  >
                    <IconCerrarSesion />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              title="Perfil"
              onClick={() => {
                if (collapsed) onToggleCollapse()
                setPerfilMenuOpen((prev) => !prev)
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                collapsed ? 'lg:justify-center' : ''
              } ${
                perfilMenuOpen || location.pathname.startsWith('/dashboard/perfil')
                  ? 'bg-primary-800 text-white'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5 flex-none"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span className={`flex-1 truncate text-left ${collapsed ? 'lg:hidden' : ''}`}>
                Perfil
              </span>
              <Chevron expanded={perfilMenuOpen} collapsed={collapsed} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
