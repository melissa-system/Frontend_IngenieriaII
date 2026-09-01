import type { ReactNode } from 'react'

export interface SubMenuItem {
  label: string
  to: string
  roles: string[]
}

export interface MenuItemConfig {
  label: string
  icon: ReactNode
  to?: string
  submenu?: SubMenuItem[]
  roles: string[]
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

function AbonadosIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 1 0 0 5.292M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="8" r="4" />
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
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

export const MENU_CONFIG: MenuItemConfig[] = [
  {
    label: 'Dashboard',
    icon: <DashboardIcon />,
    to: '/dashboard',
    roles: ['Administrador', 'Fontanero', 'Junta Directiva'],
  },
  {
    label: 'Abonados',
    icon: <AbonadosIcon />,
    to: '/dashboard/abonados',
    roles: ['Administrador'],
  },
  {
    label: 'Solicitudes',
    icon: <SolicitudesIcon />,
    to: '/dashboard/solicitudes',
    roles: ['Administrador', 'Junta Directiva'],
  },
  {
    label: 'Inventario',
    icon: <InventarioIcon />,
    to: '/dashboard/inventario',
    roles: ['Administrador'],
  },
  {
    label: 'Averías',
    icon: <AveriasIcon />,
    to: '/dashboard/averias',
    roles: ['Administrador', 'Fontanero'],
  },
  {
    label: 'Administración',
    icon: <AdminIcon />,
    roles: ['Administrador', 'Junta Directiva'],
    submenu: [
      { label: 'Usuarios', to: '/dashboard/seguridad', roles: ['Administrador', 'Junta Directiva'] },
      { label: 'Publicaciones', to: '/dashboard/administrativo', roles: ['Administrador', 'Junta Directiva'] },
      { label: 'Documentos', to: '/dashboard/administrativo?tab=documentos', roles: ['Administrador', 'Junta Directiva'] },
      { label: 'Info. de Contacto', to: '/dashboard/contacto-asada', roles: ['Administrador', 'Junta Directiva'] },
      { label: 'Horario de Atención', to: '/dashboard/horario-asada', roles: ['Administrador', 'Junta Directiva'] },
    ],
  },
  {
    label: 'Reportes',
    icon: <ReportesIcon />,
    to: '/dashboard/reportes',
    roles: ['Administrador'],
  },
  {
    label: 'Perfil',
    icon: <PerfilIcon />,
    to: '/dashboard/perfil',
    roles: ['Administrador', 'Fontanero', 'Junta Directiva'],
  },
]

export function filterMenuByRole(items: MenuItemConfig[], role: string): MenuItemConfig[] {
  return items
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      submenu: item.submenu?.filter((sub) => sub.roles.includes(role)),
    }))
}