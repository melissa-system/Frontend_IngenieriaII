import { useEffect, useState, type FormEvent } from 'react'
import { MOCK_DOCUMENTOS } from '../../lib/mockData'
import {
  crearPublicacion,
  obtenerTodasLasPublicaciones,
  actualizarPublicacion,
  LIMITES_PUBLICACION,
  type Publicacion,
} from '../../components/Services/publicaciones.service'

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
              className="rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
            >
              + Subir documento
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-primary-100 text-sm">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Título</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Archivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50">
                {MOCK_DOCUMENTOS.map((doc) => (
                  <tr key={doc.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-900">{doc.titulo}</td>
                    <td className="px-4 py-3 text-primary-600">{doc.tipo}</td>
                    <td className="px-4 py-3 text-primary-500">{doc.fecha}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        📄 {doc.archivo}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                >
                  Cancelar
                </button>
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Administrativo
