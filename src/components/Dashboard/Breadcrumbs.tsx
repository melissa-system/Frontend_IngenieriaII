import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MENU_CONFIG, type SubMenuItem } from '../../lib/menuConfig'

// Ruta de navegación (breadcrumbs) de las vistas internas del dashboard:
//   Inicio › Solicitudes › Cambio de Propietario
// Se arma desde MENU_CONFIG (la misma fuente del sidebar), así menú y
// breadcrumbs nunca se desincronizan. Los grupos del menú no tienen página
// propia, por eso se muestran como texto y no como enlace.
interface Migaja {
  label: string
  to?: string
}

// Páginas que no están en el menú pero sí en el dashboard.
const EXTRAS: Record<string, Migaja[]> = {
  '/dashboard/perfil': [{ label: 'Perfil' }, { label: 'Editar perfil' }],
  '/dashboard/perfil/contrasena': [{ label: 'Perfil' }, { label: 'Cambio de contraseña' }],
}

function buscar(subs: SubMenuItem[], ruta: string, camino: Migaja[]): Migaja[] | null {
  for (const s of subs) {
    if (s.to === ruta) return [...camino, { label: s.label }]
    if (s.submenu) {
      const r = buscar(s.submenu, ruta, [...camino, { label: s.label }])
      if (r) return r
    }
  }
  return null
}

export function migajasDe(pathname: string): Migaja[] {
  const ruta = pathname.replace(/\/+$/, '') || '/'
  if (EXTRAS[ruta]) return EXTRAS[ruta]
  for (const item of MENU_CONFIG) {
    if (item.to === ruta) return [{ label: item.label }]
    if (item.submenu) {
      const r = buscar(item.submenu, ruta, [{ label: item.label }])
      if (r) return r
    }
  }
  return []
}

function Breadcrumbs() {
  const { pathname } = useLocation()
  const migajas = migajasDe(pathname)
  // En el inicio del dashboard no hay nada que mostrar.
  if (pathname.replace(/\/+$/, '') === '/dashboard' || migajas.length === 0) return null

  return (
    <nav aria-label="Ruta de navegación" className="mb-4">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-primary-500 sm:text-sm">
        <li>
          <Link to="/dashboard" className="inline-flex min-h-8 items-center rounded-full px-1 hover:text-primary-800 hover:underline pointer-coarse:min-h-11">
            Inicio
          </Link>
        </li>
        {migajas.map((m, i) => {
          const ultima = i === migajas.length - 1
          return (
            <Fragment key={`${m.label}-${i}`}>
              <li aria-hidden="true" className="text-primary-300">
                ›
              </li>
              <li className={ultima ? 'min-w-0 truncate font-medium text-primary-900' : ''} aria-current={ultima ? 'page' : undefined}>
                {m.label}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
