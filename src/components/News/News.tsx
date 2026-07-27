import { NEWS } from '../../lib/newsData'

function News() {
  return (
    <section
      id="noticias"
      className="scroll-mt-20 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold tracking-widest text-primary-600 uppercase">
          Noticias
        </p>
        <h2 className="mt-2 font-heading text-3xl font-semibold text-primary-900 sm:text-4xl">
          Últimas noticias y avisos
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-primary-800">
          Mantente informado sobre suspensiones, mantenimientos y comunicados
          de ASADA Pueblo Nuevo.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-5 sm:mt-12 sm:gap-6 md:grid-cols-3">
        {NEWS.map((item) => (
          <article
            key={item.id}
            className="flex flex-col rounded-2xl border border-primary-100 p-6 text-left"
          >
            <span className="inline-block w-fit rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 uppercase">
              {item.categoria}
            </span>
            <h3 className="mt-4 font-heading text-lg font-semibold text-primary-900">
              {item.titulo}
            </h3>
            <p className="mt-2 flex-1 text-sm text-primary-700">
              {item.resumen}
            </p>
            <p className="mt-4 text-xs text-primary-400">{item.fecha}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default News
