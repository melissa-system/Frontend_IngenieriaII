import { useState } from 'react'

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
    <header className="sticky top-0 z-50 bg-primary-700 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a
          href="#inicio"
          className="font-heading text-lg font-semibold tracking-wide sm:text-xl lg:text-2xl"
        >
          ASADA Pueblo Nuevo
        </a>

        {/* Links desktop */}
        <nav className="hidden items-center gap-5 xl:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative pb-1 text-sm font-medium text-primary-100 transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary-300 after:transition-all after:duration-300 hover:text-white hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
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
          <span className="h-0.5 w-6 bg-white" />
          <span className="h-0.5 w-6 bg-white" />
          <span className="h-0.5 w-6 bg-white" />
        </button>
      </div>

      {/* Menú mobile */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-primary-600 bg-primary-700 px-4 pb-4 xl:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded px-3 py-3 text-sm font-medium text-primary-100 hover:bg-primary-600 hover:text-white"
            >
              {link.label}
            </a>
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
