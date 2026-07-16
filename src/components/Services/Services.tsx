import { Link } from 'react-router-dom'

function Services() {
  return (
    <section
      id="servicios"
      className="scroll-mt-20 bg-primary-50 px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold tracking-widest text-primary-600 uppercase">
          Servicios
        </p>
        <h2 className="mt-2 font-heading text-3xl font-semibold text-primary-900 sm:text-4xl">
          Afíliate al servicio de agua potable
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-primary-800">
          ¿Necesitas una nueva conexión de agua para tu propiedad? Completa la
          solicitud de afiliación y verificaremos la disponibilidad de paja de
          agua para tu ubicación.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl rounded-2xl bg-white p-8 shadow-md sm:p-10">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-primary-700 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-7 w-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21c-4.5-4.2-7.5-7.9-7.5-11.3A7.5 7.5 0 0 1 12 2a7.5 7.5 0 0 1 7.5 7.7C19.5 13.1 16.5 16.8 12 21Z"
              />
              <circle cx="12" cy="9.7" r="2.6" />
            </svg>
          </span>
          <div className="flex-1">
            <h3 className="font-heading text-xl font-semibold text-primary-900">
              Solicitud de afiliación
            </h3>
            <p className="mt-2 text-primary-700">
              Nueva conexión de paja de agua para tu propiedad. Llena el
              formulario con tus datos y nos pondremos en contacto para
              confirmar la disponibilidad.
            </p>
          </div>
          <Link
            to="/afiliacion"
            className="w-full flex-none rounded-full bg-primary-700 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-800 sm:w-auto"
          >
            Solicitar afiliación
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Services
