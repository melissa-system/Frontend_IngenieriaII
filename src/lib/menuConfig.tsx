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
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function PersonalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
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
    label: 'Personal',
    icon: <PersonalIcon />,
    to: '/dashboard/personal',
    roles: ['Administrador'],
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