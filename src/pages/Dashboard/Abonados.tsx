import { useEffect, useState, type FormEvent } from 'react'
import {
  crearAbonado,
  obtenerAbonados,
  type Abonado,
  type AbonadoPayload,
  type TipoAbonado,
} from '../../components/Services/abonados.service'

interface FormState {
  tipo_abonado: TipoAbonado
  nombre_completo: string
  nombre_representante_legal: string
  cedula: string
  telefono: string
  correo: string
  direccion: string
  numero_plano_catastrado: string
}

const EMPTY_FORM: FormState = {
  tipo_abonado: 'Física',
  nombre_completo: '',
  nombre_representante_legal: '',
  cedula: '',
  telefono: '',
  correo: '',
  direccion: '',
  numero_plano_catastrado: '',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getEstadoColor(estado: string) {
  if (estado === 'Activo') return 'bg-green-100 text-green-700'
  return 'bg-red-100 text-red-700'
}

function getTipoBadge(tipo: string) {
  if (tipo === 'Física') return 'bg-blue-100 text-blue-700'
  return 'bg-purple-100 text-purple-700'
}

function validarForm(form: FormState): string | null {
  if (!form.nombre_completo.trim()) {
    return form.tipo_abonado === 'Jurídica'
      ? 'La razón social es obligatoria.'
      : 'El nombre completo es obligatorio.'
  }
  if (!form.cedula.trim()) return 'La cédula es obligatoria.'
  if (!form.telefono.trim()) return 'El teléfono es obligatorio.'
  if (!form.correo.trim()) return 'El correo es obligatorio.'
  if (!EMAIL_REGEX.test(form.correo.trim())) {
    return 'El correo electrónico no tiene un formato válido.'
  }
  if (!form.direccion.trim()) return 'La dirección es obligatoria.'
  if (
    form.tipo_abonado === 'Jurídica' &&
    !form.nombre_representante_legal.trim()
  ) {
    return 'El nombre del representante legal es obligatorio para persona jurídica.'
  }
  return null
}

function Abonados() {
  const [abonados, setAbonados] = useState<Abonado[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [viewDetail, setViewDetail] = useState<Abonado | null>(null)
  const [confirmacion, setConfirmacion] = useState<Abonado | null>(null)

  async function cargarAbonados() {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await obtenerAbonados()
      setAbonados(data)
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el servidor.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarAbonados()
  }, [])

  const filtered = abonados.filter(
    (a) =>
      a.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
      a.cedula.includes(search) ||
      a.telefono.includes(search) ||
      a.direccion.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function changeTipo(tipo: TipoAbonado) {
    // Al cambiar de tipo, limpiamos los campos que no aplican al nuevo tipo
    setForm((prev) => ({
      ...prev,
      tipo_abonado: tipo,
      nombre_representante_legal: tipo === 'Jurídica' ? prev.nombre_representante_legal : '',
      numero_plano_catastrado: tipo === 'Física' ? prev.numero_plano_catastrado : '',
    }))
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

    const payload: AbonadoPayload = {
      tipo_abonado: form.tipo_abonado,
      nombre_completo: form.nombre_completo.trim(),
      cedula: form.cedula.trim(),
      telefono: form.telefono.trim(),
      correo: form.correo.trim(),
      direccion: form.direccion.trim(),
      ...(form.tipo_abonado === 'Jurídica'
        ? { nombre_representante_legal: form.nombre_representante_legal.trim() }
        : {}),
      ...(form.tipo_abonado === 'Física' && form.numero_plano_catastrado.trim()
        ? { numero_plano_catastrado: form.numero_plano_catastrado.trim() }
        : {}),
    }

    try {
      const creado = await crearAbonado(payload)
      setAbonados((prev) => [creado, ...prev])
      setModalOpen(false)
      setConfirmacion(creado)
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'No se pudo registrar el abonado. Intenta de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function ModalForm() {
    if (!modalOpen) return null
    const esJuridica = form.tipo_abonado === 'Jurídica'

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">
              Nuevo Abonado
            </h2>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
                Tipo de abonado
              </label>
              <select
                value={form.tipo_abonado}
                onChange={(e) => changeTipo(e.target.value as TipoAbonado)}
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="Física">Física</option>
                <option value="Jurídica">Jurídica</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  {esJuridica ? 'Razón social' : 'Nombre completo'}
                </label>
                <input
                  type="text"
                  value={form.nombre_completo}
                  onChange={(e) => updateField('nombre_completo', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder={esJuridica ? 'Nombre de la empresa' : 'Nombre del abonado'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  {esJuridica ? 'Cédula jurídica' : 'Cédula'}
                </label>
                <input
                  type="text"
                  value={form.cedula}
                  onChange={(e) => updateField('cedula', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder={esJuridica ? '3-101-123456' : '1-2345-6789'}
                />
              </div>
            </div>

            {esJuridica && (
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Nombre del representante legal
                </label>
                <input
                  type="text"
                  value={form.nombre_representante_legal}
                  onChange={(e) =>
                    updateField('nombre_representante_legal', e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="Nombre completo del representante"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-primary-700">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="8888-8888"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) => updateField('correo', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="correo@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700">Dirección</label>
              <textarea
                value={form.direccion}
                onChange={(e) => updateField('direccion', e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                placeholder="Dirección completa"
              />
            </div>

            {!esJuridica && (
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Número de plano catastrado (opcional)
                </label>
                <input
                  type="text"
                  value={form.numero_plano_catastrado}
                  onChange={(e) =>
                    updateField('numero_plano_catastrado', e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="Ej. G-1234567-2024"
                />
              </div>
            )}

            {formError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
              >
                {submitting ? 'Registrando...' : 'Crear abonado'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  function ConfirmacionModal() {
    if (!confirmacion) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-md rounded-2xl bg-primary-50 p-8 text-center shadow-xl">
          <h2 className="text-xl font-semibold text-primary-900">
            ¡Abonado registrado!
          </h2>
          <p className="mt-3 text-primary-700">
            Se generó el número de abonado:
          </p>
          <p className="mt-1 text-2xl font-semibold text-primary-900">
            {confirmacion.numero_abonado}
          </p>
          <button
            type="button"
            onClick={() => setConfirmacion(null)}
            className="mt-6 rounded-full bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  function DetailModal() {
    if (!viewDetail) return null
    const a = viewDetail
    const esJuridica = a.tipo_abonado === 'Jurídica'
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">Detalle del Abonado</h2>
            <button
              type="button"
              onClick={() => setViewDetail(null)}
              className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium text-primary-700">N° Abonado:</span>
              <span className="font-mono text-primary-900">{a.numero_abonado}</span>
              <span className="font-medium text-primary-700">
                {esJuridica ? 'Razón social:' : 'Nombre:'}
              </span>
              <span className="text-primary-900">{a.nombre_completo}</span>
              <span className="font-medium text-primary-700">Tipo:</span>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getTipoBadge(a.tipo_abonado)}`}>
                {a.tipo_abonado}
              </span>
              {esJuridica && (
                <>
                  <span className="font-medium text-primary-700">Representante legal:</span>
                  <span className="text-primary-900">{a.nombre_representante_legal}</span>
                </>
              )}
              <span className="font-medium text-primary-700">Cédula:</span>
              <span className="font-mono text-primary-900">{a.cedula}</span>
              <span className="font-medium text-primary-700">Teléfono:</span>
              <span className="text-primary-900">{a.telefono}</span>
              <span className="font-medium text-primary-700">Correo:</span>
              <span className="text-primary-900">{a.correo}</span>
              <span className="font-medium text-primary-700">Dirección:</span>
              <span className="text-primary-900">{a.direccion}</span>
              {!esJuridica && a.numero_plano_catastrado && (
                <>
                  <span className="font-medium text-primary-700">N° de plano:</span>
                  <span className="text-primary-900">{a.numero_plano_catastrado}</span>
                </>
              )}
              <span className="font-medium text-primary-700">Estado:</span>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(a.estado)}`}>
                {a.estado}
              </span>
              <span className="font-medium text-primary-700">Registro:</span>
              <span className="text-primary-900">{a.fecha_registro}</span>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setViewDetail(null)}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">
            Gestión de Abonados
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            {loading ? 'Cargando...' : `${abonados.length} abonados registrados`}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="self-start rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
        >
          + Nuevo abonado
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre, cédula, teléfono o dirección..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none sm:w-96"
      />

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-sm font-medium text-red-600">{loadError}</p>
          <button
            type="button"
            onClick={cargarAbonados}
            className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-primary-100 text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-primary-700">N° Abonado</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Cédula</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Registro</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-primary-400">
                    Cargando abonados...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-primary-400">
                    No se encontraron abonados.
                  </td>
                </tr>
              ) : (
                filtered.map((abonado) => (
                  <tr key={abonado.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-mono text-primary-700">{abonado.numero_abonado}</td>
                    <td className="px-4 py-3 font-mono text-primary-700">{abonado.cedula}</td>
                    <td className="px-4 py-3 font-medium text-primary-900">{abonado.nombre_completo}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getTipoBadge(abonado.tipo_abonado)}`}>
                        {abonado.tipo_abonado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-primary-600">{abonado.telefono}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getEstadoColor(abonado.estado)}`}>
                        {abonado.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-primary-500">{abonado.fecha_registro}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled
                          title="Edición disponible próximamente"
                          className="text-sm font-medium text-primary-300 cursor-not-allowed"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewDetail(abonado)}
                          className="text-sm font-medium text-primary-500 hover:text-primary-700 hover:underline"
                        >
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ModalForm />
      <DetailModal />
      <ConfirmacionModal />
    </div>
  )
}

export default Abonados
