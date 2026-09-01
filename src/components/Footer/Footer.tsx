import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logoFooter from '../../assets/logo-footer.png'
import { obtenerConfiguracion, type Configuracion } from '../Services/configuracion.service'

const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Sobre nosotros', to: '/#sobre-nosotros' },
  { label: 'Servicios', to: '/#servicios' },
  { label: 'Noticias', to: '/#noticias' },
  { label: 'Averías', to: '/reportar-averia' },
  { label: 'Ubicación', to: '/#ubicacion' },
]

// Valores por defecto (actuales hardcodeados) — se usan si la API falla
const DEFAULTS = {
  direccion: 'Pueblo Nuevo, Paquera, Puntarenas',
  telefono: '8741-8543',
  telefonoLink: '+50687418543',
  correo: 'asadapueblonuevo06@gmail.com',
  enlaceGoogleMaps: 'https://maps.app.goo.gl/VKAEtDsXSU6P1yQ16',
  telJunta1: '8435-8518',
  telJunta1Link: '+50684358518',
  telJunta2: '8305-0012',
  telJunta2Link: '+50683050012',
  horarioLunVie: '8:00 am - 5:00 pm',
  horarioSabado: '8:00 am - 1:00 pm',
  horarioDomingo: 'Cerrado',
}

function formatearLinkTelefono(tel: string): string {
  const soloNumeros = tel.replace(/\D/g, '')
  return soloNumeros ? `+506${soloNumeros}` : tel
}

function Footer() {
  const [config, setConfig] = useState<Configuracion | null>(null)

  useEffect(() => {
    obtenerConfiguracion()
      .then(setConfig)
      .catch(() => {
        /* fallback a DEFAULTS */
      })
  }, [])

  const direccion = config?.direccion || DEFAULTS.direccion
  const telefono = config?.telefono || DEFAULTS.telefono
  const telefonoLink = config?.telefono
    ? formatearLinkTelefono(config.telefono)
    : DEFAULTS.telefonoLink
  const correo = config?.correo_electronico || DEFAULTS.correo
  const mapsLink = config?.enlace_google_maps || DEFAULTS.enlaceGoogleMaps
  const telJunta1 = config?.telefono_miembro_junta_1 || DEFAULTS.telJunta1
  const telJunta1Link = config?.telefono_miembro_junta_1
    ? formatearLinkTelefono(config.telefono_miembro_junta_1)
    : DEFAULTS.telJunta1Link
  const telJunta2 = config?.telefono_miembro_junta_2 || DEFAULTS.telJunta2
  const telJunta2Link = config?.telefono_miembro_junta_2
    ? formatearLinkTelefono(config.telefono_miembro_junta_2)
    : DEFAULTS.telJunta2Link
  const horarioLunVie = config?.horario_lunes_viernes || DEFAULTS.horarioLunVie
  const horarioSabado = config?.horario_sabado || DEFAULTS.horarioSabado
  const horarioDomingo = config?.horario_domingo || DEFAULTS.horarioDomingo

  return (
    <footer className="relative mt-16 bg-primary-900 pt-16 pb-10 text-white sm:mt-24 sm:pt-20">
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

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="flex flex-col items-start gap-4">
          <img
            src={logoFooter}
            alt="ASADA Pueblo Nuevo"
            className="h-14 w-auto object-contain"
          />
          <p className="text-sm leading-relaxed text-primary-200">
            Comprometidos con la distribución de agua potable de calidad para
            nuestras comunidades.
          </p>
        </div>

        <div>
          <p className="text-xl font-semibold">
            Navegación del sistema
          </p>
          <ul className="mt-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-primary-200 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xl font-semibold">
            Horario de atención
          </p>
          <ul className="mt-4 space-y-2 text-primary-200">
            <li>Lunes - Viernes: {horarioLunVie}</li>
            <li>Sábados: {horarioSabado}</li>
            <li>Domingos: {horarioDomingo}</li>
          </ul>
        </div>

        <div>
          <p className="text-xl font-semibold">Contacto</p>
          <ul className="mt-4 space-y-3 text-primary-200">
            <li className="flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="mt-0.5 h-5 w-5 flex-none"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21c-4.5-4.2-7.5-7.9-7.5-11.3A7.5 7.5 0 0 1 12 2a7.5 7.5 0 0 1 7.5 7.7C19.5 13.1 16.5 16.8 12 21Z"
                />
                <circle cx="12" cy="9.7" r="2.6" />
              </svg>
              <a
                href={mapsLink}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                {direccion}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="mt-0.5 h-5 w-5 flex-none"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5.5c0-1.1.9-2 2-2h2.3c.5 0 1 .4 1.1.9l1 3.6c.1.4 0 .9-.3 1.2L7.8 10.6a13 13 0 0 0 5.6 5.6l1.4-1.3c.3-.3.8-.4 1.2-.3l3.6 1c.5.1.9.6.9 1.1V19c0 1.1-.9 2-2 2h-1C9.5 21 3 14.5 3 6.5v-1Z"
                />
              </svg>
              <a href={`tel:${telefonoLink}`} className="hover:text-white">
                {telefono}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="mt-0.5 h-5 w-5 flex-none"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4 6.5 8 6.5 8-6.5"
                />
              </svg>
              <a
                href={`mailto:${correo}`}
                className="hover:text-white"
              >
                {correo}
              </a>
            </li>
            <li className="mt-2 border-t border-primary-700 pt-3 text-sm">
              <p>Para más información, llamar a:</p>
              <p className="mt-1">
                <a href={`tel:${telJunta1Link}`} className="hover:text-white">
                  {telJunta1}
                </a>{' '}
                /{' '}
                <a href={`tel:${telJunta2Link}`} className="hover:text-white">
                  {telJunta2}
                </a>
              </p>
              <p className="mt-1 text-primary-300 italic">
                — Miembros de junta —
              </p>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-primary-700 px-4 pt-6 text-center text-sm text-primary-300 sm:px-6 lg:px-8">
        <p>
          © {new Date().getFullYear()} ASADA Pueblo Nuevo. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  )
}

export default Footer
