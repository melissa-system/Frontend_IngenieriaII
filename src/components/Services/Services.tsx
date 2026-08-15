import { Link } from 'react-router-dom'

function Services() {
  return (
    <section
      id="servicios"
      className="scroll-mt-20 bg-primary-50 px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold tracking-widest text-primary-600 uppercase">
          Servicios
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-normal text-primary-900 uppercase sm:text-4xl">
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
    </section>
  )
}

export default Services
