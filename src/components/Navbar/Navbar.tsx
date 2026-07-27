import { useState } from 'react'
import logo from '../../assets/logo.svg'

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Sobre nosotros', href: '#sobre-nosotros' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Noticias', href: '#noticias' },
  { label: 'Averías', href: '#averias' },
  { label: 'Ubicación', href: '#ubicacion' },
]

function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white text-gray-900 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#inicio" className="flex items-center gap-3" aria-label="Inicio">
          <img
            src={logo}
            alt="Logo ASADA Pueblo Nuevo"
            className="h-14 w-14 rounded-full bg-white object-cover shadow-sm"
          />
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-wide text-slate-900 sm:text-lg lg:text-xl">
              ASADA
            </div>
            <div className="text-sm font-semibold tracking-wide text-slate-900 sm:text-base">
              Pueblo Nuevo
            </div>
          </div>
        </a>

        {/* Links desktop */}
        <nav className="hidden items-center gap-5 xl:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative pb-1 text-base font-medium text-gray-600 transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary-600 after:transition-all after:duration-300 hover:text-primary-700 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#"
            className="rounded-full bg-primary-700 px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-primary-600"
          >
            Acceder al sistema
          </a>
        </nav>

        {/* Botón hamburguesa mobile */}
        <button
          type="button"
          className="flex flex-col gap-1.5 xl:hidden"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="h-0.5 w-6 bg-gray-800" />
          <span className="h-0.5 w-6 bg-gray-800" />
          <span className="h-0.5 w-6 bg-gray-800" />
        </button>
      </div>

      {/* Menú mobile */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-gray-200 bg-white px-4 pb-4 xl:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded px-2 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-primary-700"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-primary-700 px-5 py-2.5 text-center text-base font-semibold text-white"
          >
            Acceder al sistema
          </a>
        </nav>
      )}
    </header>
  )
}

export default Navbar
