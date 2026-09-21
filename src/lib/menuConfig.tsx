import type { ReactNode } from 'react'

export interface SubMenuItem {
  label: string
  // Un SubMenuItem es una hoja (con "to", navega) o un grupo (con
  // "submenu", se despliega en más opciones) — nunca ambos.
  to?: string
  roles: string[]
  /** Solo si se define: el ítem se muestra únicamente a abonados de estos
   * tipos ('Física' | 'Jurídica'). Administrador y Junta Directiva ven el
   * ítem sin importar este campo. */
  tipoAbonado?: string[]
  /** Marca ítems exclusivos de la vista de Abonado: solo aparecen con rol
   * efectivo 'Abonado', ni siquiera para Junta Directiva (que por la "Regla
   * de Oro" ve el resto del menú completo). Ej: "Mis Averías". */
  soloAbonado?: boolean
  /** Ignora la "Regla de Oro" de Junta Directiva (que por defecto ve todo el
   * menú): el ítem solo se muestra a los roles listados en `roles`, tal
   * cual. Útil para ítems que ya están cubiertos por otra sección del panel
   * administrativo y solo tienen sentido para roles operativos (Abonado,
   * Fontanero). Ej: "Documentos Oficiales". */
  estrictoPorRol?: boolean
  submenu?: SubMenuItem[]
}

export interface MenuItemConfig {
  label: string
  icon: ReactNode
  to?: string
  submenu?: SubMenuItem[]
  roles: string[]
  soloAbonado?: boolean
  estrictoPorRol?: boolean
}

function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function SolicitudesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
    </svg>
  )
}

function InventarioIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function AveriasIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function AuditoriaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}

function ReportesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function PerfilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function DocumentosOficialesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function EdicionPaginaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  )
}

export const MENU_CONFIG: MenuItemConfig[] = [
  {
    label: 'Dashboard',
    icon: <DashboardIcon />,
    to: '/dashboard',
    roles: ['Administrador', 'Fontanero', 'Junta Directiva', 'Abonado'],
  },
  {
    label: 'Solicitudes',
    icon: <SolicitudesIcon />,
    roles: ['Administrador', 'Junta Directiva', 'Abonado'],
    submenu: [
      // Paja de Agua es solo para administración; los abonados no la ven.
      { label: 'Paja de Agua', to: '/dashboard/solicitudes/paja-de-agua', roles: ['Administrador', 'Junta Directiva'] },
      { label: 'Cambio de Propietario', to: '/dashboard/solicitudes/cambio-propietario', roles: ['Administrador', 'Junta Directiva', 'Abonado'], tipoAbonado: ['Física'] },
      { label: 'Cambio de Representante', to: '/dashboard/solicitudes/cambio-representante', roles: ['Administrador', 'Junta Directiva', 'Abonado'], tipoAbonado: ['Jurídica'] },
      { label: 'Cambio de Medidor', to: '/dashboard/solicitudes/cambio-medidor', roles: ['Administrador', 'Junta Directiva', 'Abonado'] },
      { label: 'Otro', to: '/dashboard/solicitudes/otro', roles: ['Administrador', 'Junta Directiva', 'Abonado'] },
    ],
  },
  {
    label: 'Inventario',
    icon: <InventarioIcon />,
    roles: ['Administrador'],
    submenu: [
      { label: 'Artículos', to: '/dashboard/inventario/articulos', roles: ['Administrador'] },
      { label: 'Proveedores', to: '/dashboard/inventario/proveedores', roles: ['Administrador'] },
    ],
  },
  {
    label: 'Averías',
    icon: <AveriasIcon />,
    to: '/dashboard/averias',
    roles: ['Administrador', 'Fontanero'],
  },
  {
    label: 'Mis Averías',
    icon: <AveriasIcon />,
    to: '/dashboard/mis-averias',
    // Exclusivo de la vista de Abonado: ni la Junta Directiva lo ve.
    soloAbonado: true,
    roles: ['Abonado'],
  },
  {
    label: 'Administración',
    icon: <AdminIcon />,
    roles: ['Administrador', 'Junta Directiva'],
    submenu: [
      { label: 'Abonados', to: '/dashboard/abonados', roles: ['Administrador', 'Junta Directiva'] },
      { label: 'Empleados', to: '/dashboard/personal', roles: ['Administrador', 'Junta Directiva'] },
      { label: 'Usuarios', to: '/dashboard/seguridad', roles: ['Administrador', 'Junta Directiva'] },
    ],
  },
  {
    label: 'Edición de página',
    icon: <EdicionPaginaIcon />,
    roles: ['Administrador', 'Junta Directiva'],
    submenu: [
      { label: 'Horario de Atención', to: '/dashboard/horario-asada', roles: ['Administrador', 'Junta Directiva'] },
      { label: 'Info. de Contacto', to: '/dashboard/contacto-asada', roles: ['Administrador', 'Junta Directiva'] },
      { label: 'Documentos', to: '/dashboard/documentos', roles: ['Administrador', 'Junta Directiva'] },
      { label: 'Noticias', to: '/dashboard/administrativo', roles: ['Administrador', 'Junta Directiva'] },
    ],
  },
  {
    // Auditoría es un módulo propio y no un submenú de Administración: es una
    // herramienta de consulta sobre TODO el sistema (abonados, solicitudes,
    // averías, inventario...), no la gestión de un área en particular.
    label: 'Auditoría',
    icon: <AuditoriaIcon />,
    to: '/dashboard/auditoria',
    roles: ['Administrador', 'Junta Directiva'],
  },
  {
    label: 'Reportes',
    icon: <ReportesIcon />,
    to: '/dashboard/reportes',
    roles: ['Administrador'],
  },
  {
    label: 'Documentos Oficiales',
    icon: <DocumentosOficialesIcon />,
    to: '/dashboard/documentos-oficiales',
    // Solo para Abonado y Fontanero: Administrador/Junta Directiva ya
    // tienen su propia sección "Documentos" en Edición de página, así que
    // estrictoPorRol evita que la "Regla de Oro" se lo muestre también ahí.
    roles: ['Abonado', 'Fontanero'],
    estrictoPorRol: true,
  },
  {
    // Sin "to": el Sidebar arma su propio submenú anidado para este ítem
    // (Mi perfil / Cambio de cuenta) en vez de usar el renderItem genérico.
    // Se mantiene acá solo para el filtrado por rol y el ícono.
    label: 'Perfil',
    icon: <PerfilIcon />,
    roles: ['Administrador', 'Fontanero', 'Junta Directiva', 'Abonado'],
  },
]

// Filtra un submenú por rol de forma recursiva: un grupo (sub.submenu) solo
// sobrevive si le queda al menos una opción visible para el rol. El tipo de
// abonado ('Física' | 'Jurídica') solo acota los ítems con 'tipoAbonado'
// definido y únicamente cuando el rol efectivo es 'Abonado'; Administrador y
// Junta Directiva (que ven el menú completo) ignoran esa restricción.
function filterSubMenuByRole(
  subs: SubMenuItem[],
  role: string,
  tipoAbonado?: string | null,
): SubMenuItem[] {
  return subs
    // 'Junta Directiva' (SUPER_ADMIN) ve todo, igual que la "Regla de Oro"
    // del RolesGuard del backend — así no hay que acordarse de agregarlo a
    // mano en cada ítem nuevo (eso fue justo lo que faltó en varios).
    .filter((sub) => {
      if (sub.soloAbonado) return role === 'Abonado'
      if (role !== 'Junta Directiva' && !sub.roles.includes(role)) return false
      if (sub.tipoAbonado && role === 'Abonado') {
        return tipoAbonado ? sub.tipoAbonado.includes(tipoAbonado) : false
      }
      return true
    })
    .map((sub) => ({
      ...sub,
      submenu: sub.submenu ? filterSubMenuByRole(sub.submenu, role, tipoAbonado) : undefined,
    }))
    .filter((sub) => !sub.submenu || sub.submenu.length > 0)
}

export function filterMenuByRole(
  items: MenuItemConfig[],
  role: string,
  tipoAbonado?: string | null,
): MenuItemConfig[] {
  return items
    .filter((item) => {
      if (item.soloAbonado) return role === 'Abonado'
      if (item.estrictoPorRol) return item.roles.includes(role)
      return role === 'Junta Directiva' || item.roles.includes(role)
    })
    .map((item) => ({
      ...item,
      submenu: item.submenu
        ? filterSubMenuByRole(item.submenu, role, tipoAbonado)
        : undefined,
    }))
}