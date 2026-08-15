const MAPS_LINK = 'https://maps.app.goo.gl/VKAEtDsXSU6P1yQ16'
const MAPS_EMBED_SRC =
  'https://www.google.com/maps?q=9.9263539,-84.9810364&z=16&output=embed'

function Location() {
  return (
    <section
      id="ubicacion"
      className="scroll-mt-20 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold tracking-widest text-primary-600 uppercase">
          Visítanos
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-normal text-primary-900 uppercase sm:text-4xl">
          Dónde encontrarnos
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-primary-800">
          Nuestras instalaciones están ubicadas en Pueblo Nuevo. Te esperamos
          para cualquier consulta o trámite.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-6 sm:mt-12 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl shadow-md">
          <iframe
            src={MAPS_EMBED_SRC}
            title="Ubicación de ASADA Pueblo Nuevo"
            className="h-64 w-full border-0 sm:h-80 lg:h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="flex flex-col justify-center rounded-2xl bg-primary-50 p-6 shadow-sm sm:p-8">
          <h3 className="text-xl font-semibold text-primary-900">
            Ubicación y contacto
          </h3>

          <div className="mt-6 space-y-5">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary-700 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21c-4.5-4.2-7.5-7.9-7.5-11.3A7.5 7.5 0 0 1 12 2a7.5 7.5 0 0 1 7.5 7.7C19.5 13.1 16.5 16.8 12 21Z"
                  />
                  <circle cx="12" cy="9.7" r="2.6" />
                </svg>
              </span>
              <p className="text-primary-800">
                100 metros norte de la Iglesia San Francisco de Asís
                <br />
                Pueblo Nuevo, Paquera, Puntarenas
              </p>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary-700 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5.5c0-1.1.9-2 2-2h2.3c.5 0 1 .4 1.1.9l1 3.6c.1.4 0 .9-.3 1.2L7.8 10.6a13 13 0 0 0 5.6 5.6l1.4-1.3c.3-.3.8-.4 1.2-.3l3.6 1c.5.1.9.6.9 1.1V19c0 1.1-.9 2-2 2h-1C9.5 21 3 14.5 3 6.5v-1Z"
                  />
                </svg>
              </span>
              <p className="text-primary-800">
                <a href="tel:+50687418543" className="hover:text-primary-700">
                  8741-8543
                </a>
              </p>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary-700 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5"
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
              </span>
              <p className="text-primary-800">
                <a
                  href="mailto:asadapueblonuevo06@gmail.com"
                  className="hover:text-primary-700"
                >
                  asadapueblonuevo06@gmail.com
                </a>
              </p>
            </div>
          </div>

          <a
            href={MAPS_LINK}
            target="_blank"
            rel="noreferrer"
            className="mt-8 rounded-full bg-primary-700 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-800"
          >
            Ver en Google Maps
          </a>
        </div>
      </div>
    </section>
  )
}

export default Location
