import puebloImg from '../../assets/PuebloN.png'

const STATS = [
  { value: '20', label: 'Años brindando servicio a la comunidad' },
  { value: '57', label: 'Abonados conectados al servicio' },
]

const VALUES = [
  {
    title: 'Responsabilidad',
    desc: 'Administramos los recursos hídricos con transparencia y honestidad.',
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
          d="M5 8.5c0-3.9 7-6.5 7-6.5s7 2.6 7 6.5c0 4.2-2.7 10.5-7 12.5-4.3-2-7-8.3-7-12.5Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m9 11.5 2 2 4-4"
        />
      </svg>
    ),
  },
  {
    title: 'Calidad',
    desc: 'Garantizamos agua potable segura y en óptimas condiciones.',
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
          d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14l-6-4.8h7.6L12 2Z"
        />
      </svg>
    ),
  },
  {
    title: 'Compromiso',
    desc: 'Trabajamos día a día por el bienestar de nuestra comunidad.',
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
          d="M12 21.5C8.5 18.5 4 14.5 4 10a8 8 0 0 1 16 0c0 4.5-4.5 8.5-8 11.5Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 10m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0"
        />
      </svg>
    ),
  },
  {
    title: 'Sostenibilidad',
    desc: 'Cuidamos el ambiente para garantizar el agua del futuro.',
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
          d="M12 22c3.3 0 6-5.4 6-12S15.3 2 12 2 6 3.4 6 10s2.7 12 6 12Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12c0 5.5 2.7 10 4 10"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 12c0 5.5-2.7 10-4 10"
        />
      </svg>
    ),
  },
]

function AboutUs() {
  return (
    <section
      id="sobre-nosotros"
      className="scroll-mt-20 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-primary-600 uppercase">
            Sobre nosotros
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold text-primary-900 sm:text-4xl">
            Conócenos
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-800">
            ASADA Pueblo Nuevo es la asociación encargada de administrar el
            acueducto comunitario, llevando agua potable de forma continua y de
            calidad a las familias de Pueblo Nuevo.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 text-center sm:mt-12 sm:grid-cols-2 sm:gap-6">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-primary-50 px-6 py-6 sm:py-8"
            >
              <p className="font-heading text-4xl font-semibold text-primary-700 sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-primary-800">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Imagen + Historia */}
        <div className="mt-8 flex flex-col items-center gap-6 sm:mt-12 md:flex-row">
          <div className="w-full overflow-hidden rounded-2xl shadow-md md:w-1/2">
            <img
              src={puebloImg}
              alt="Comunidad de Pueblo Nuevo"
              className="h-72 w-full object-cover sm:h-80"
            />
          </div>
          <div className="w-full md:w-1/2">
            <h3 className="font-heading text-2xl font-semibold text-primary-900">
              Nuestra historia
            </h3>
            <p className="mt-3 leading-relaxed text-primary-800">
              Desde nuestros inicios, hemos trabajado incansablemente para
              garantizar el acceso al agua potable a cada hogar de Pueblo Nuevo,
              adaptándonos a los desafíos y creciendo junto a nuestra comunidad.
              Cada día renovamos nuestro compromiso de ofrecer un servicio de
              calidad, con transparencia y responsabilidad.
            </p>
          </div>
        </div>

        {/* Valores */}
        <div className="mt-8 sm:mt-12">
          <h3 className="text-center font-heading text-2xl font-semibold text-primary-900">
            Nuestros valores
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="group cursor-default rounded-2xl border border-primary-100 bg-white px-5 py-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg"
              >
                <span className="inline-flex items-center justify-center text-primary-600 transition-colors duration-300 group-hover:text-primary-700">
                  {v.icon}
                </span>
                <h4 className="mt-3 font-heading text-lg font-semibold text-primary-700">
                  {v.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-primary-800">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Misión y Visión */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 sm:mt-12">
          <div className="flex flex-col items-center justify-center bg-primary-900 px-10 py-16 text-center text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="mb-5 h-12 w-12"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <path strokeLinecap="round" d="M2 12h4m12 0h4M12 2v4m0 12v4" />
            </svg>
            <h3 className="font-heading text-xl font-semibold uppercase tracking-wide">
              Nuestra Misión
            </h3>
            <p className="mt-4 max-w-sm leading-relaxed text-primary-200">
              Brindar un servicio de agua potable eficiente, continuo y de
              calidad a la comunidad de Pueblo Nuevo, garantizando el buen uso
              y la administración responsable de los recursos hídricos en
              beneficio de nuestros abonados.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center bg-primary-600 px-10 py-16 text-center text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="mb-5 h-12 w-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <h3 className="font-heading text-xl font-semibold uppercase tracking-wide">
              Nuestra Visión
            </h3>
            <p className="mt-4 max-w-sm leading-relaxed text-primary-200">
              Ser una ASADA modelo, reconocida por la gestión responsable del
              recurso hídrico, la mejora continua de su infraestructura y el
              compromiso con el desarrollo sostenible de la comunidad.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}

export default AboutUs
