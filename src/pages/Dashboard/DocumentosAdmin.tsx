import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  crearDocumento,
  agregarNuevaVersionDocumento,
  obtenerDocumentos,
  actualizarDocumento,
  eliminarDocumento,
  obtenerUrlArchivo,
  TIPOS_DOCUMENTO,
  VISIBILIDADES_DOCUMENTO,
  ACCEPT_DOCUMENTO,
  MAX_DOCUMENTO_MB,
  type Documento,
  type TipoDocumento,
  type VisibilidadDocumento,
} from '../../components/Services/documentos.service'

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

function DocumentosAdmin() {
  const [togglingDocId, setTogglingDocId] = useState<string | number | null>(null)

  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [docLoading, setDocLoading] = useState(true)
  const [docLoadError, setDocLoadError] = useState<string | null>(null)

  // Filtro por tipo (catálogo cerrado, '' = todos) y búsqueda por nombre.
  // El texto de búsqueda se debounce 300ms antes de disparar la consulta al
  // backend, para no mandar una petición por cada tecla.
  const [filtroTipo, setFiltroTipo] = useState<TipoDocumento | ''>('')
  const [filtroNombreInput, setFiltroNombreInput] = useState('')
  const [filtroNombre, setFiltroNombre] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setFiltroNombre(filtroNombreInput), 300)
    return () => clearTimeout(t)
  }, [filtroNombreInput])

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState<{
    nombre: string
    tipo: TipoDocumento | ''
    visibilidad: VisibilidadDocumento
    archivo: File | null
  }>({ nombre: '', tipo: '', visibilidad: 'Interno', archivo: null })
  const [nombreEditadoManualmente, setNombreEditadoManualmente] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Modal de "Actualizar versión": reemplaza el archivo de un documento
  // existente puntual (versionDoc), no crea uno nuevo.
  const [versionDoc, setVersionDoc] = useState<Documento | null>(null)
  const [versionArchivo, setVersionArchivo] = useState<File | null>(null)
  const [versionUploading, setVersionUploading] = useState(false)
  const [versionProgress, setVersionProgress] = useState<number | null>(null)
  const [versionSuccess, setVersionSuccess] = useState(false)
  const [versionError, setVersionError] = useState<string | null>(null)

  async function cargarDocumentos() {
    setDocLoading(true)
    setDocLoadError(null)
    try {
      const data = await obtenerDocumentos({ tipo: filtroTipo, nombre: filtroNombre })
      setDocumentos(data)
    } catch (err) {
      setDocLoadError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los documentos.',
      )
    } finally {
      setDocLoading(false)
    }
  }

  // Se dispara al montar y cada vez que cambia el filtro (tipo, o el nombre
  // ya debounced), para que los resultados se actualicen dinámicamente.
  useEffect(() => {
    cargarDocumentos()
  }, [filtroTipo, filtroNombre])

  function openUploadModal() {
    setUploadForm({ nombre: '', tipo: '', visibilidad: 'Interno', archivo: null })
    setNombreEditadoManualmente(false)
    setUploadProgress(null)
    setUploadSuccess(false)
    setUploadError(null)
    setUploadModalOpen(true)
  }

  function closeUploadModal() {
    if (uploading) return // no cerrar a mitad de una subida
    setUploadModalOpen(false)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0] ?? null
    setUploadForm((prev) => {
      // Autocompleta el nombre a partir del archivo elegido, pero solo si la
      // persona usuaria todavía no escribió uno a mano.
      if (!archivo || nombreEditadoManualmente) {
        return { ...prev, archivo }
      }
      return { ...prev, archivo, nombre: archivo.name.replace(/\.[^/.]+$/, '') }
    })
  }

  function handleNombreDocumentoChange(value: string) {
    setNombreEditadoManualmente(true)
    setUploadForm((prev) => ({ ...prev, nombre: value }))
  }

  const uploadValido =
    uploadForm.archivo !== null &&
    uploadForm.tipo !== '' &&
    Boolean(uploadForm.visibilidad) &&
    uploadForm.nombre.trim() !== ''

  async function handleUploadSubmit(e: FormEvent) {
    e.preventDefault()
    if (!uploadValido || !uploadForm.archivo || !uploadForm.tipo) {
      setUploadError(
        'Selecciona un archivo, un tipo de documento y una visibilidad antes de subirlo.',
      )
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      await crearDocumento(
        {
          nombre: uploadForm.nombre.trim(),
          tipo: uploadForm.tipo,
          visibilidad: uploadForm.visibilidad,
          archivo: uploadForm.archivo,
        },
        (porcentaje) => setUploadProgress(porcentaje),
      )
      setUploadSuccess(true)
      // Si esta carga reemplazó una versión anterior (mismo nombre y tipo),
      // esa versión ahora quedó 'Inhabilitado': recargamos toda la lista
      // para reflejarlo, en vez de solo anteponer el documento nuevo.
      await cargarDocumentos()
      setTimeout(() => setUploadModalOpen(false), 1200)
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'No se pudo subir el documento.',
      )
      setUploadProgress(null)
    } finally {
      setUploading(false)
    }
  }

  // Publicar/hacer interno: cambia la visibilidad de un documento. No toca
  // el archivo ni el estado (Vigente/Inhabilitado) — son dos cosas
  // independientes (ver documentos.entity.ts).
  async function handleToggleVisibilidadDoc(doc: Documento) {
    setTogglingDocId(doc.id)
    try {
      const actualizado = await actualizarDocumento(doc.id, {
        visibilidad: doc.visibilidad === 'Público' ? 'Interno' : 'Público',
      })
      setDocumentos((prev) =>
        prev.map((d) => (d.id === doc.id ? actualizado : d)),
      )
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'No se pudo cambiar la visibilidad del documento.',
      )
    } finally {
      setTogglingDocId(null)
    }
  }

  // Deshabilitar/habilitar: reversible, conserva el archivo en Cloudinary
  // (distinto de eliminarDocumento, que sí borra todo de forma definitiva).
  // Solo se pide confirmación al deshabilitar (deja de estar disponible
  // para consulta) — reactivarlo no tiene ese riesgo, no hace falta.
  async function handleToggleEstadoDoc(doc: Documento) {
    if (
      doc.estado === 'Vigente' &&
      !confirm(
        `¿Deshabilitar "${doc.nombre}"? Dejará de estar disponible para consulta y descarga. Podés volver a habilitarlo cuando quieras.`,
      )
    ) {
      return
    }

    setTogglingDocId(doc.id)
    try {
      const actualizado = await actualizarDocumento(doc.id, {
        estado: doc.estado === 'Vigente' ? 'Inhabilitado' : 'Vigente',
      })
      setDocumentos((prev) =>
        prev.map((d) => (d.id === doc.id ? actualizado : d)),
      )
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'No se pudo cambiar el estado del documento.',
      )
    } finally {
      setTogglingDocId(null)
    }
  }

  // Eliminación DEFINITIVA: borra el archivo de Cloudinary y la fila de
  // MySQL, sin dejar historial. Distinto de handleToggleEstadoDoc
  // (Deshabilitar), que es reversible y conserva todo. Pensado para limpiar
  // pruebas del ambiente de desarrollo, no para uso normal una vez en
  // producción — por eso pide una confirmación más explícita que las demás
  // acciones y no tiene un botón grande/llamativo.
  async function handleDeleteDoc(doc: Documento) {
    if (
      !confirm(
        `¿Eliminar PERMANENTEMENTE "${doc.nombre}" (v${doc.version})?\n\nEsta acción no se puede deshacer: se borra el archivo de Cloudinary y el registro completo, sin conservar historial.\n\nSi lo que querés es que deje de estar disponible pero sí conservar el historial, cancelá esto y usá "Deshabilitar" en su lugar.`,
      )
    ) {
      return
    }

    setTogglingDocId(doc.id)
    try {
      await eliminarDocumento(doc.id)
      setDocumentos((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'No se pudo eliminar el documento.',
      )
    } finally {
      setTogglingDocId(null)
    }
  }

  function openVersionModal(doc: Documento) {
    setVersionDoc(doc)
    setVersionArchivo(null)
    setVersionProgress(null)
    setVersionSuccess(false)
    setVersionError(null)
  }

  function closeVersionModal() {
    if (versionUploading) return // no cerrar a mitad de una subida
    setVersionDoc(null)
  }

  function handleVersionFileChange(e: ChangeEvent<HTMLInputElement>) {
    setVersionArchivo(e.target.files?.[0] ?? null)
  }

  async function handleVersionSubmit(e: FormEvent) {
    e.preventDefault()
    if (!versionArchivo || !versionDoc) return

    setVersionUploading(true)
    setVersionError(null)
    setVersionProgress(0)

    try {
      await agregarNuevaVersionDocumento(
        versionDoc.id,
        versionArchivo,
        (porcentaje) => setVersionProgress(porcentaje),
      )
      setVersionSuccess(true)
      // La versión anterior quedó Inhabilitada y se agregó una fila nueva
      // Vigente: se recarga toda la lista para reflejar ambas.
      await cargarDocumentos()
      setTimeout(() => setVersionDoc(null), 1200)
    } catch (err) {
      setVersionError(
        err instanceof Error ? err.message : 'No se pudo agregar la nueva versión.',
      )
      setVersionProgress(null)
    } finally {
      setVersionUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Documentos
        </h1>
        <p className="mt-1 text-sm text-primary-500">
          Gestión de documentos oficiales de la ASADA
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
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
            <input
              type="search"
              value={filtroNombreInput}
              onChange={(e) => setFiltroNombreInput(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-56 rounded-full border border-primary-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={openUploadModal}
            className="rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
          >
            + Subir documento
          </button>
        </div>

        {docLoadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm font-medium text-red-600">{docLoadError}</p>
            <button
              type="button"
              onClick={cargarDocumentos}
              className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Reintentar
            </button>
          </div>
        ) : docLoading ? (
          <p className="py-8 text-center text-sm text-primary-400">
            Cargando documentos...
          </p>
        ) : documentos.length === 0 ? (
          <p className="py-8 text-center text-sm text-primary-400">
            {filtroTipo || filtroNombre
              ? 'No se encontraron documentos con ese filtro.'
              : 'Todavía no hay documentos cargados.'}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-primary-100 text-sm">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Versión</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Visibilidad</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha de carga</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Archivo</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50">
                {documentos.map((doc) => (
                  <tr key={doc.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-900">{doc.nombre}</td>
                    <td className="px-4 py-3 text-primary-600">{doc.tipo}</td>
                    <td className="px-4 py-3 text-primary-500">v{doc.version}</td>
                    <td className="px-4 py-3 text-primary-600">{doc.visibilidad}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          doc.estado === 'Vigente'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {doc.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-primary-500">{formatearFecha(doc.fecha_carga)}</td>
                    <td className="px-4 py-3">
                      <a
                        href={obtenerUrlArchivo(doc.ubicacion)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        Ver archivo
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        {doc.estado === 'Vigente' && (
                          <button
                            type="button"
                            onClick={() => openVersionModal(doc)}
                            className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
                          >
                            Actualizar versión
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleVisibilidadDoc(doc)}
                          disabled={togglingDocId === doc.id}
                          className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline disabled:opacity-50"
                        >
                          {togglingDocId === doc.id
                            ? 'Guardando...'
                            : doc.visibilidad === 'Público'
                              ? 'Hacer interno'
                              : 'Publicar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleEstadoDoc(doc)}
                          disabled={togglingDocId === doc.id}
                          className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline disabled:opacity-50"
                        >
                          {togglingDocId === doc.id
                            ? 'Guardando...'
                            : doc.estado === 'Vigente'
                              ? 'Deshabilitar'
                              : 'Habilitar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc)}
                          disabled={togglingDocId === doc.id}
                          className="text-sm font-medium text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-900">Subir documento</h2>
              <button
                type="button"
                onClick={closeUploadModal}
                disabled={uploading}
                className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700 disabled:opacity-40"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {uploadSuccess ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <p className="text-base font-semibold text-primary-900">
                  ¡Documento subido correctamente!
                </p>
                <p className="text-sm text-primary-500">{uploadForm.nombre}</p>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-primary-700">
                    Nombre del documento
                  </label>
                  <input
                    type="text"
                    value={uploadForm.nombre}
                    onChange={(e) => handleNombreDocumentoChange(e.target.value)}
                    disabled={uploading}
                    className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none disabled:bg-primary-50"
                    placeholder="Ej. Acta de asamblea ordinaria 2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700">Archivo</label>
                  <input
                    type="file"
                    accept={ACCEPT_DOCUMENTO}
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="mt-1 w-full text-sm text-primary-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200 disabled:opacity-60"
                  />
                  {uploadForm.archivo && (
                    <p className="mt-2 flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700">
                      <svg className="h-4 w-4 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      <span className="truncate">{uploadForm.archivo.name}</span>
                      <span className="flex-none text-primary-400">
                        ({(uploadForm.archivo.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </p>
                  )}
                  <p className="mt-1 text-xs text-primary-400">
                    PDF, Word, Excel o imagen (JPG/PNG). Máximo {MAX_DOCUMENTO_MB} MB.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">
                      Tipo de documento
                    </label>
                    <select
                      value={uploadForm.tipo}
                      disabled={uploading}
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          tipo: e.target.value as TipoDocumento,
                        }))
                      }
                      className="mt-1 w-full rounded-full border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none disabled:bg-primary-50"
                    >
                      <option value="" disabled>
                        Selecciona un tipo
                      </option>
                      {TIPOS_DOCUMENTO.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">
                      Visibilidad
                    </label>
                    <select
                      value={uploadForm.visibilidad}
                      disabled={uploading}
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          visibilidad: e.target.value as VisibilidadDocumento,
                        }))
                      }
                      className="mt-1 w-full rounded-full border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none disabled:bg-primary-50"
                    >
                      {VISIBILIDADES_DOCUMENTO.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {uploadProgress !== null && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-primary-500">
                      <span>Subiendo archivo...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-primary-100">
                      <div
                        className="h-full rounded-full bg-primary-700 transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadError && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                    {uploadError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!uploadValido || uploading}
                    className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
                  >
                    {uploading ? 'Subiendo...' : 'Subir documento'}
                  </button>
                  <button
                    type="button"
                    onClick={closeUploadModal}
                    disabled={uploading}
                    className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {versionDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-900">Actualizar versión</h2>
              <button
                type="button"
                onClick={closeVersionModal}
                disabled={versionUploading}
                className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700 disabled:opacity-40"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-6 text-sm text-primary-500">
              {versionDoc.nombre} · versión actual v{versionDoc.version}
            </p>

            {versionSuccess ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <p className="text-base font-semibold text-primary-900">
                  ¡Nueva versión (v{versionDoc.version + 1}) registrada!
                </p>
                <p className="text-sm text-primary-500">
                  La versión anterior quedó inhabilitada, conservando el historial.
                </p>
              </div>
            ) : (
              <form onSubmit={handleVersionSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-primary-700">
                    Nuevo archivo
                  </label>
                  <input
                    type="file"
                    accept={ACCEPT_DOCUMENTO}
                    onChange={handleVersionFileChange}
                    disabled={versionUploading}
                    className="mt-1 w-full text-sm text-primary-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200 disabled:opacity-60"
                  />
                  {versionArchivo && (
                    <p className="mt-2 flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700">
                      <span className="truncate">{versionArchivo.name}</span>
                      <span className="flex-none text-primary-400">
                        ({(versionArchivo.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </p>
                  )}
                  <p className="mt-1 text-xs text-primary-400">
                    PDF, Word, Excel o imagen (JPG/PNG). Máximo {MAX_DOCUMENTO_MB} MB. El
                    nombre, tipo y visibilidad del documento se mantienen igual.
                  </p>
                </div>

                {versionProgress !== null && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-primary-500">
                      <span>Subiendo archivo...</span>
                      <span>{versionProgress}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-primary-100">
                      <div
                        className="h-full rounded-full bg-primary-700 transition-all duration-150"
                        style={{ width: `${versionProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {versionError && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                    {versionError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!versionArchivo || versionUploading}
                    className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
                  >
                    {versionUploading ? 'Subiendo...' : 'Guardar nueva versión'}
                  </button>
                  <button
                    type="button"
                    onClick={closeVersionModal}
                    disabled={versionUploading}
                    className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentosAdmin
