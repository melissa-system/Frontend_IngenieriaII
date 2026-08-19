import { useState, useEffect, useCallback } from 'react'
import {
  obtenerPublicaciones,
  type Publicacion,
} from '../../components/Services/publicaciones.service'

function formatearFecha(fechaIso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(fechaIso))
  } catch {
    return fechaIso
  }
}

function News() {
  const [noticias, setNoticias] = useState<Publicacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(3)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setVisible(e.matches ? 1 : 3)
      setCurrent(0)
    }
    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    let cancelado = false

    obtenerPublicaciones()
      .then((data) => {
        if (!cancelado) setNoticias(data)
      })
      .catch((err) => {
        if (!cancelado) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar las noticias.',
          )
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })

    return () => {
      cancelado = true
    }
  }, [])

  const maxSlide = Math.max(noticias.length - visible, 0)

  const next = useCallback(() => {
    setCurrent((prev) => (prev < maxSlide ? prev + 1 : 0))
  }, [maxSlide])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev > 0 ? prev - 1 : maxSlide))
  }, [maxSlide])

  const slideWidth = 100 / visible

  return (
    <section
      id="noticias"
      className="scroll-mt-20 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold tracking-widest text-primary-600 uppercase">
          Noticias
        </p>
        <h2 className="mt-2 text-3xl font-title font-bold tracking-normal text-primary-900 uppercase sm:text-4xl">
          Últimas noticias y avisos
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-primary-800">
          Mantente informado sobre suspensiones, mantenimientos y comunicados
          de ASADA Pueblo Nuevo.
        </p>
      </div>

      {loading ? (
        <p className="mt-10 text-center text-sm text-primary-400">
          Cargando noticias...
        </p>
      ) : error ? (
        <p className="mt-10 text-center text-sm text-red-500">{error}</p>
      ) : noticias.length === 0 ? (
        <p className="mt-10 text-center text-sm text-primary-400">
          Aún no hay noticias publicadas.
        </p>
      ) : (
        <div className="relative mx-auto mt-8 max-w-5xl sm:mt-12">
          <div className="overflow-hidden py-3">
            <div
              className="flex items-stretch transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${current * slideWidth}%)` }}
            >
              {noticias.map((item) => (
                <div
                  key={item.id}
                  className="flex-none px-2"
                  style={{ flex: `0 0 ${slideWidth}%` }}
                >
                  <article className="group flex h-full cursor-default flex-col rounded-2xl border border-primary-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg">
                    <span className="inline-block w-fit rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 uppercase">
                      {item.categoria}
                    </span>
                    <h3 className="mt-4 text-lg font-semibold text-primary-900">
                      {item.titulo}
                    </h3>
                    <p className="mt-2 flex-1 text-sm text-primary-700">
                      {item.contenido}
                    </p>
                    <p className="mt-4 text-xs text-primary-400">
                      {formatearFecha(item.fecha_publicacion)}
                    </p>
                  </article>
                </div>
              ))}
            </div>
          </div>

          {noticias.length > visible && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Anterior"
                className="absolute top-1/2 left-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary-700 shadow-lg transition-colors hover:bg-primary-700 hover:text-white sm:h-12 sm:w-12"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 5-7 7 7 7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={next}
                aria-label="Siguiente"
                className="absolute top-1/2 right-0 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary-700 shadow-lg transition-colors hover:bg-primary-700 hover:text-white sm:h-12 sm:w-12"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                </svg>
              </button>

              <div className="mt-6 flex items-center justify-center gap-2">
                {Array.from({ length: maxSlide + 1 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-label={`Ir a slide ${i + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      i === current
                        ? 'w-8 bg-primary-700'
                        : 'w-2.5 bg-primary-300 hover:bg-primary-400'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default News
