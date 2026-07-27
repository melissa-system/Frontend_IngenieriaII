import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.svg'

const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Sobre nosotros', to: '/#sobre-nosotros' },
  { label: 'Servicios', to: '/afiliacion' },
  { label: 'Noticias', to: '/#noticias' },
  { label: 'Averías', to: '/reportar-averia' },
  { label: 'Ubicación', to: '/#ubicacion' },
]

function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white text-gray-900 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="Inicio">
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
        </Link>

        {/* Links desktop */}
        <nav className="hidden items-center gap-5 xl:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="relative pb-1 text-base font-medium text-gray-600 transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary-600 after:transition-all after:duration-300 hover:text-primary-700 hover:after:w-full"
            >
              {link.label}
            </Link>
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
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="rounded px-3 py-3 text-sm font-medium text-primary-100 hover:bg-primary-600 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="#"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-primary-700"
          >
            Acceder al sistema
          </a>
        </nav>
      )}
    </header>
  )
}

export default Navbar
