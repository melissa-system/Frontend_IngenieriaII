import { useState } from 'react'
import { Link } from 'react-router-dom'

const SERVICIOS = [
  {
    title: 'Distribución de agua potable',
    desc: 'Suministro continuo y de calidad para todos los hogares de la comunidad.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-8 w-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 2.5s7 8.6 7 13.3a7 7 0 1 1-14 0c0-4.7 7-13.3 7-13.3Z"
        />
      </svg>
    ),
  },
  {
    title: 'Nuevas conexiones (paja de agua)',
    desc: 'Instalación de nuevas conexiones al acueducto para propiedades de la zona.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-8 w-8"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v6" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h8l1.5 4a5.5 5.5 0 1 1-11 0L8 10Z"
        />
      </svg>
    ),
  },
  {
    title: 'Reparación de averías',
    desc: 'Atención y reparación de fugas o daños reportados en la red de distribución.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-8 w-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m14.5 3.5-8 8a2.1 2.1 0 0 0 3 3l8-8a2.1 2.1 0 0 0-3-3Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="m8 15-4.5 4.5M11 12l1.5 1.5" />
      </svg>
    ),
  },
  {
    title: 'Desinfección y control de calidad del agua',
    desc: 'Cloración y monitoreo constante para garantizar agua potable segura.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-8 w-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 2h6M10 2v5.5L5.5 15a3 3 0 0 0 2.6 4.5h7.8a3 3 0 0 0 2.6-4.5L14 7.5V2"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Mantenimiento de la red',
    desc: 'Mantenimiento preventivo y correctivo de tuberías e infraestructura del acueducto.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-8 w-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 1 5.4-5.4l-2.3 2.3-2-2 2.3-2.3Z"
        />
      </svg>
    ),
  },
  {
    title: 'Atención al abonado',
    desc: 'Consultas, trámites y gestiones administrativas relacionadas con el servicio.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-8 w-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 19v-1a4 4 0 0 1 4-4h1m8-3a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 14h1a4 4 0 0 1 4 4v1"
        />
        <circle cx="9" cy="7" r="3" />
      </svg>
    ),
  },
]

function Services() {
  const [expanded, setExpanded] = useState(false)

  return (
    <section
      id="servicios"
      className="scroll-mt-20 bg-primary-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-primary-600 uppercase">
            Servicios
          </p>
          <h2 className="mt-2 text-3xl font-title font-bold tracking-normal text-primary-900 uppercase sm:text-4xl">
            Solicita tu paja de agua
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-800">
            ¿Necesitas una nueva conexión de agua para tu propiedad? Completa la
            solicitud de paja de agua y verificaremos la disponibilidad para tu
            ubicación.
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-6 rounded-2xl border border-primary-100 bg-white p-8 text-center shadow-md sm:mt-12 sm:p-10">
          <span className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-primary-700 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-8 w-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2.5s7 8.6 7 13.3a7 7 0 1 1-14 0c0-4.7 7-13.3 7-13.3Z"
              />
            </svg>
          </span>
          <Link
            to="/afiliacion"
            className="rounded-full bg-primary-700 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-primary-800 hover:shadow-lg"
          >
            Hacer la solicitud de paja de agua
          </Link>
        </div>

        <div className="mt-6 flex justify-center sm:mt-8">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="rounded-full border border-primary-300 px-6 py-2.5 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:border-primary-700 hover:bg-primary-700 hover:text-white"
          >
            {expanded ? 'Ver menos' : 'Ver más servicios'}
          </button>
        </div>

        {expanded && (
          <div className="mt-8 sm:mt-12">
            <h3 className="text-center text-2xl font-semibold text-primary-900">
              Nuestros servicios
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICIOS.map((s) => (
                <div
                  key={s.title}
                  className="group cursor-default rounded-2xl border border-primary-200 bg-white px-5 py-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg"
                >
                  <span className="inline-flex items-center justify-center text-primary-600 transition-colors duration-300 group-hover:text-primary-700">
                    {s.icon}
                  </span>
                  <h4 className="mt-3 text-lg font-semibold text-primary-700">
                    {s.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-primary-800">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default Services
