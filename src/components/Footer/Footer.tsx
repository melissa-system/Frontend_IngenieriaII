const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Sobre nosotros', href: '#sobre-nosotros' },
  { label: 'Ubicación', href: '#ubicacion' },
]

const SERVICE_LINKS = [
  { label: 'Afiliación', href: '#servicios' },
  { label: 'Solicitud de paja de agua', href: '#servicios' },
  { label: 'Reportar avería', href: '#averias' },
]

function Footer() {
  return (
    <footer className="relative mt-24 bg-primary-900 pt-20 pb-10 text-white">
      {/* Borde ondulado de transición */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute top-0 left-0 h-16 w-full -translate-y-full text-primary-900 sm:h-20"
      >
        <path
          fill="currentColor"
          d="M0,64 C240,120 480,0 720,32 C960,64 1200,112 1440,64 L1440,120 L0,120 Z"
        />
      </svg>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="font-heading text-xl font-semibold">
            ASADA Pueblo Nuevo
          </p>
          <ul className="mt-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-primary-200 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-heading text-xl font-semibold">Servicios</p>
          <ul className="mt-4 space-y-2">
            {SERVICE_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-primary-200 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-heading text-xl font-semibold">Contacto</p>
          <ul className="mt-4 space-y-2 text-primary-200">
            <li>
              100 metros norte de la Iglesia San Francisco de Asís, Pueblo
              Nuevo
            </li>
            <li>
              <a href="tel:+50687418543" className="hover:text-white">
                8741-8543
              </a>
            </li>
            <li>
              <a
                href="mailto:asadapueblonuevo06@gmail.com"
                className="hover:text-white"
              >
                asadapueblonuevo06@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-primary-700 px-4 pt-6 text-sm text-primary-300 sm:px-6 lg:px-8">
        <p>
          © {new Date().getFullYear()} ASADA Pueblo Nuevo. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  )
}

export default Footer
