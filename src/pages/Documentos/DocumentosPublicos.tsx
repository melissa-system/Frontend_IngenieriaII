import { useEffect, useMemo, useState } from 'react'
import {
  obtenerDocumentosPublicos,
  obtenerUrlArchivo,
  TIPOS_DOCUMENTO,
  type Documento,
  type TipoDocumento,
} from '../../components/Services/documentos.service'
import { descargarArchivo, extensionDesdeUrl } from '../../lib/descargarArchivo'

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

function DocumentoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-8 w-8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  )
}

// Página pública (sin sesión) con los documentos que la ASADA marcó como
// 'Público' desde el dashboard administrativo (Documentos, misma pantalla
// de siempre — solo cambia dónde los ve el público: antes se mezclaban con
// las publicaciones en Noticias, ahora tienen su propio espacio con
// explicación de qué es esta sección).
function DocumentosPublicos() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<TipoDocumento | ''>('')

  function cargar() {
    setLoading(true)
    setError(null)
    obtenerDocumentosPublicos()
      .then(setDocumentos)
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los documentos.',
        )
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // El endpoint público no acepta filtro por tipo (a diferencia del
  // administrativo/oficiales), así que se filtra en el cliente sobre la
  // lista ya cargada — de todas formas son pocos documentos.
  const documentosFiltrados = useMemo(
    () => (filtroTipo ? documentos.filter((d) => d.tipo === filtroTipo) : documentos),
    [documentos, filtroTipo],
  )

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold tracking-widest text-primary-600 uppercase">
          Documentos
        </p>
        <h1 className="mt-2 text-3xl font-title font-bold tracking-normal text-primary-900 uppercase sm:text-4xl">
          Documentos públicos
        </h1>
        <p className="mx-auto mt-4 text-primary-800">
          Esta sección es elaborada por ASADA Pueblo Nuevo para que cualquier
          persona usuaria del servicio pueda consultar y descargar nuestros
          documentos más recientes: actas, informes, mediciones del
          acueducto y comunicados oficiales.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-primary-500">
          {documentosFiltrados.length}{' '}
          {documentosFiltrados.length === 1 ? 'documento disponible' : 'documentos disponibles'}
        </p>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as TipoDocumento | '')}
          className="rounded-full border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">Todos los tipos</option>
          {TIPOS_DOCUMENTO.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            type="button"
            onClick={cargar}
            className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <p className="mt-10 py-10 text-center text-sm text-primary-400">
          Cargando documentos...
        </p>
      ) : documentosFiltrados.length === 0 ? (
        <p className="mt-10 py-10 text-center text-sm text-primary-400">
          {filtroTipo
            ? 'No hay documentos de ese tipo por ahora.'
            : 'Todavía no hay documentos públicos disponibles.'}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documentosFiltrados.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col rounded-2xl border border-primary-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary-50 p-2 text-primary-700">
                  <DocumentoIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700 uppercase">
                    {doc.tipo}
                  </span>
                  <h3
                    className="mt-1.5 truncate text-sm font-semibold text-primary-900"
                    title={doc.nombre}
                  >
                    {doc.nombre}
                  </h3>
                </div>
              </div>

              <p className="mt-3 text-xs text-primary-400">
                Actualizado el {formatearFecha(doc.fecha_carga)}
                {doc.version > 1 ? ` · versión ${doc.version}` : ''}
              </p>

              <button
                type="button"
                onClick={() =>
                  descargarArchivo(
                    obtenerUrlArchivo(doc.ubicacion),
                    `${doc.nombre}${extensionDesdeUrl(doc.ubicacion)}`,
                  )
                }
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
              >
                <DownloadIcon />
                Descargar
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default DocumentosPublicos
