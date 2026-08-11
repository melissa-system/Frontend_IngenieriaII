import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import logo from '../../assets/logo.png'

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
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 bg-white text-gray-900 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center" aria-label="Inicio">
          <img
            src={logo}
            alt="ASADA Pueblo Nuevo"
            className="h-11 w-auto object-contain sm:h-12"
          />
        </Link>

        {/* Links desktop */}
        <nav className="hidden items-center gap-5 xl:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-full border border-transparent px-4 py-2 text-base font-medium text-gray-600 transition-colors hover:border-primary-700 hover:text-primary-700"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className="rounded-full bg-primary-700 px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-primary-600"
          >
            {isAuthenticated ? 'Ir al Dashboard' : 'Acceder al sistema'}
          </button>
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
              className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate(isAuthenticated ? '/dashboard' : '/login')
            }}
            className="mt-2 rounded-full bg-primary-700 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            {isAuthenticated ? 'Ir al Dashboard' : 'Acceder al sistema'}
          </button>
        </nav>
      )}
    </header>
  )
}

export default Navbar
