import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  crearPublicacion,
  obtenerTodasLasPublicaciones,
  actualizarPublicacion,
  LIMITES_PUBLICACION,
  type Publicacion,
} from '../../components/Services/publicaciones.service'
import {
  crearDocumento,
  obtenerDocumentos,
  obtenerUrlArchivo,
  TIPOS_DOCUMENTO,
  VISIBILIDADES_DOCUMENTO,
  ACCEPT_DOCUMENTO,
  MAX_DOCUMENTO_MB,
  type Documento,
  type TipoDocumento,
  type VisibilidadDocumento,
} from '../../components/Services/documentos.service'

type Tab = 'publicaciones' | 'documentos'

interface FormState {
  titulo: string
  contenido: string
  categoria: string
}

const EMPTY_FORM: FormState = {
  titulo: '',
  contenido: '',
  categoria: '',
}

const CATEGORIAS_SUGERIDAS = ['Aviso', 'Comunicado', 'Noticia', 'Mantenimiento']

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

function validarForm(form: FormState): string | null {
  if (!form.titulo.trim()) return 'El título es obligatorio.'
  if (form.titulo.length > LIMITES_PUBLICACION.titulo) {
    return `El título no puede superar los ${LIMITES_PUBLICACION.titulo} caracteres.`
  }
  if (!form.contenido.trim()) return 'El contenido es obligatorio.'
  if (form.contenido.length > LIMITES_PUBLICACION.contenido) {
    return `El contenido no puede superar los ${LIMITES_PUBLICACION.contenido} caracteres.`
  }
  if (!form.categoria.trim()) return 'La categoría es obligatoria.'
  if (form.categoria.length > LIMITES_PUBLICACION.categoria) {
    return `La categoría no puede superar los ${LIMITES_PUBLICACION.categoria} caracteres.`
  }
  return null
}

function Administrativo() {
  const [tab, setTab] = useState<Tab>('publicaciones')

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editId, setEditId] = useState<string | number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [togglingId, setTogglingId] = useState<string | number | null>(null)

  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [docLoading, setDocLoading] = useState(true)
  const [docLoadError, setDocLoadError] = useState<string | null>(null)

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

  async function cargarPublicaciones() {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await obtenerTodasLasPublicaciones()
      setPublicaciones(data)
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar las publicaciones.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPublicaciones()
  }, [])

  async function cargarDocumentos() {
    setDocLoading(true)
    setDocLoadError(null)
    try {
      const data = await obtenerDocumentos()
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

  useEffect(() => {
    cargarDocumentos()
  }, [])

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

  function openCreate() {
    setModalMode('create')
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  function openEdit(pub: Publicacion) {
    setModalMode('edit')
    setEditId(pub.id)
    setForm({
      titulo: pub.titulo,
      contenido: pub.contenido,
      categoria: pub.categoria,
    })
    setFormError(null)
  }

  function closeModal() {
    setModalMode(null)
    setEditId(null)
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationError = validarForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      if (modalMode === 'edit' && editId !== null) {
        const actualizada = await actualizarPublicacion(editId, {
          titulo: form.titulo.trim(),
          contenido: form.contenido.trim(),
          categoria: form.categoria.trim(),
        })
        setPublicaciones((prev) =>
          prev.map((p) => (p.id === editId ? actualizada : p)),
        )
      } else {
        const creada = await crearPublicacion({
          titulo: form.titulo.trim(),
          contenido: form.contenido.trim(),
          categoria: form.categoria.trim(),
        })
        setPublicaciones((prev) => [creada, ...prev])
      }
      closeModal()
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar la publicación. Intenta de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTogglePublicado(pub: Publicacion) {
    setTogglingId(pub.id)
    try {
      const actualizada = await actualizarPublicacion(pub.id, {
        publicado: !pub.publicado,
      })
      setPublicaciones((prev) =>
        prev.map((p) => (p.id === pub.id ? actualizada : p)),
      )
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'No se pudo cambiar el estado de la publicación.',
      )
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Administrativo
        </h1>
        <p className="mt-1 text-sm text-primary-500">
          Gestión de publicaciones y documentos
        </p>
      </div>

      <div className="flex gap-2 border-b border-primary-100">
        <button
          type="button"
          onClick={() => setTab('publicaciones')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            tab === 'publicaciones'
              ? 'border-b-2 border-primary-700 text-primary-700'
              : 'text-primary-500 hover:text-primary-700'
          }`}
        >
          Publicaciones
        </button>
        <button
          type="button"
          onClick={() => setTab('documentos')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            tab === 'documentos'
              ? 'border-b-2 border-primary-700 text-primary-700'
              : 'text-primary-500 hover:text-primary-700'
          }`}
        >
          Documentos
        </button>
      </div>

      {tab === 'publicaciones' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openCreate}
              className="rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
            >
              + Nueva publicación
            </button>
          </div>

          {loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
              <p className="text-sm font-medium text-red-600">{loadError}</p>
              <button
                type="button"
                onClick={cargarPublicaciones}
                className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Reintentar
              </button>
            </div>
          ) : loading ? (
            <p className="py-8 text-center text-sm text-primary-400">
              Cargando publicaciones...
            </p>
          ) : publicaciones.length === 0 ? (
            <p className="py-8 text-center text-sm text-primary-400">
              Todavía no hay publicaciones.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {publicaciones.map((pub) => (
                <div
                  key={pub.id}
                  className="flex flex-col rounded-xl border border-primary-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                      {pub.categoria}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        pub.publicado ? 'text-green-600' : 'text-primary-400'
                      }`}
                    >
                      {pub.publicado ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-primary-900">
                    {pub.titulo}
                  </h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-primary-600">
                    {pub.contenido}
                  </p>
                  <p className="mt-3 text-xs text-primary-400">
                    {formatearFecha(pub.fecha_publicacion)}
                  </p>

                  <div className="mt-4 flex items-center gap-4 border-t border-primary-50 pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(pub)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePublicado(pub)}
                      disabled={togglingId === pub.id}
                      className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline disabled:opacity-50"
                    >
                      {togglingId === pub.id
                        ? 'Guardando...'
                        : pub.publicado
                          ? 'Despublicar'
                          : 'Publicar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'documentos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
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
              Todavía no hay documentos cargados.
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-900">
                {modalMode === 'edit' ? 'Editar publicación' : 'Nueva publicación'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Categoría
                </label>
                <input
                  type="text"
                  list="categorias-sugeridas"
                  value={form.categoria}
                  onChange={(e) => updateField('categoria', e.target.value)}
                  maxLength={LIMITES_PUBLICACION.categoria}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="Ej. Aviso, Comunicado..."
                />
                <datalist id="categorias-sugeridas">
                  {CATEGORIAS_SUGERIDAS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-primary-700">
                    Título
                  </label>
                  <span className="text-xs text-primary-400">
                    {form.titulo.length}/{LIMITES_PUBLICACION.titulo}
                  </span>
                </div>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => updateField('titulo', e.target.value)}
                  maxLength={LIMITES_PUBLICACION.titulo}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="Título de la publicación"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-primary-700">
                    Contenido
                  </label>
                  <span className="text-xs text-primary-400">
                    {form.contenido.length}/{LIMITES_PUBLICACION.contenido}
                  </span>
                </div>
                <textarea
                  value={form.contenido}
                  onChange={(e) => updateField('contenido', e.target.value)}
                  maxLength={LIMITES_PUBLICACION.contenido}
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="Contenido de la publicación"
                />
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
                >
                  {submitting
                    ? 'Guardando...'
                    : modalMode === 'edit'
                      ? 'Guardar cambios'
                      : 'Crear publicación'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  )
}

export default Administrativo
