const STATS = [
  { value: '20', label: 'Años brindando servicio a la comunidad' },
  { value: '57', label: 'Abonados conectados al servicio' },
]

function AboutUs() {
  return (
    <section
      id="sobre-nosotros"
      className="scroll-mt-20 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-5xl text-center">
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

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6">
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

        {/* Misión y Visión */}
        <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:mt-12 sm:gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-primary-100 px-6 py-6 sm:py-8">
            <h3 className="font-heading text-xl font-semibold text-primary-700">
              Misión
            </h3>
            <p className="mt-3 text-primary-800">
              Brindar un servicio de agua potable eficiente, continuo y de
              calidad a la comunidad de Pueblo Nuevo, garantizando el buen uso
              y la administración responsable de los recursos hídricos en
              beneficio de nuestros abonados.
            </p>
          </div>
          <div className="rounded-2xl border border-primary-100 px-6 py-6 sm:py-8">
            <h3 className="font-heading text-xl font-semibold text-primary-700">
              Visión
            </h3>
            <p className="mt-3 text-primary-800">
              Ser una ASADA modelo, reconocida por la gestión responsable del
              recurso hídrico, la mejora continua de su infraestructura y el
              compromiso con el desarrollo sostenible de la comunidad.
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-primary-400 italic">
          * Misión y visión provisionales, pendientes de tu texto definitivo.
        </p>
      </div>
    </section>
  )
}

export default AboutUs
