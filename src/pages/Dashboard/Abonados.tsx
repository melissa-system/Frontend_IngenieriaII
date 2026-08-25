import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  crearAbonado,
  obtenerAbonado,
  obtenerAbonados,
  actualizarAbonado,
  obtenerHistorialAbonado,
  type Abonado,
  type AbonadoPayload,
  type AbonadoUpdatePayload,
  type HistorialAbonado,
  type TipoAbonado,
} from '../../components/Services/abonados.service'
import { formatearCedula } from '../../components/Services/solicitudes.service'

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

// Paginación client-side de la tabla de abonados
const ABONADOS_POR_PAGINA = 10

function getEstadoColor(estado: string) {
  if (estado === 'Activo') return 'bg-green-100 text-green-700'
  return 'bg-red-100 text-red-700'
}

function getTipoBadge(tipo: string) {
  if (tipo === 'Física') return 'bg-blue-100 text-blue-700'
  return 'bg-purple-100 text-purple-700'
}

// Arma el estado del formulario a partir de un abonado (precarga del modal).
// Los campos opcionales llegan como null desde la BD y se normalizan a ''.
function formDesdeAbonado(a: Abonado): FormState {
  return {
    tipo_abonado: a.tipo_abonado,
    nombre_completo: a.nombre_completo,
    nombre_representante_legal: a.nombre_representante_legal ?? '',
    cedula: a.cedula,
    telefono: a.telefono,
    correo: a.correo,
    direccion: a.direccion,
    numero_plano_catastrado: a.numero_plano_catastrado ?? '',
  }
}

const CAMPO_LABELS: Record<string, string> = {
  nombre_completo: 'Nombre / Razón social',
  nombre_representante_legal: 'Representante legal',
  telefono: 'Teléfono',
  correo: 'Correo electrónico',
  direccion: 'Dirección',
  numero_plano_catastrado: 'N° de plano',
}

function mostrarValorHistorial(v: string | null) {
  return v === null || v.trim() === '' ? '(vacío)' : v
}

function formatearFechaHistorial(fecha: string) {
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
}

// Normaliza texto para buscar sin depender de mayúsculas, acentos,
// guiones ni espacios (ej: "ab20260001" encuentra "AB-2026-0001").
function normalizarBusqueda(t: string) {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
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
  const [pagina, setPagina] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editando, setEditando] = useState<Abonado | null>(null)
  // Id del abonado en edición: descarta respuestas tardías de la precarga
  // si el modal se cerró o se abrió con otro abonado antes de responder.
  const edicionIdRef = useRef<string | number | null>(null)

  const [viewDetail, setViewDetail] = useState<Abonado | null>(null)
  const [historialDetalle, setHistorialDetalle] = useState<HistorialAbonado[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const [historialError, setHistorialError] = useState<string | null>(null)
  const [confirmacion, setConfirmacion] = useState<Abonado | null>(null)

  // Búsqueda de nombre por cédula (API de Hacienda). Solo el nombre viene de
  // ahí: teléfono, correo y dirección no existen en ninguna fuente pública,
  // así que esos siempre se completan a mano.
  const [buscandoCedula, setBuscandoCedula] = useState(false)
  const [cedulaLookupStatus, setCedulaLookupStatus] = useState<
    'idle' | 'found' | 'not-found' | 'error'
  >('idle')

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

  const q = normalizarBusqueda(search)
  const filtered =
    q === ''
      ? abonados
      : abonados.filter(
          (a) =>
            normalizarBusqueda(a.nombre_completo).includes(q) ||
            normalizarBusqueda(a.cedula).includes(q) ||
            normalizarBusqueda(a.numero_abonado).includes(q) ||
            normalizarBusqueda(a.telefono).includes(q) ||
            normalizarBusqueda(a.direccion).includes(q),
        )

  // Paginación derivada: si la lista encoge, paginaActual se autocorrige
  // y nunca se queda apuntando a una página vacía.
  const totalPaginas = Math.max(
    1,
    Math.ceil(filtered.length / ABONADOS_POR_PAGINA),
  )
  const paginaActual = Math.min(pagina, totalPaginas)
  const primeraFila = (paginaActual - 1) * ABONADOS_POR_PAGINA
  const filasVisibles = filtered.slice(
    primeraFila,
    primeraFila + ABONADOS_POR_PAGINA,
  )
  const numerosPagina = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  // Buscar siempre regresa a la primera página; navegar páginas NO toca el
  // término de búsqueda, así que el filtro se mantiene entre páginas.
  function manejarBusqueda(valor: string) {
    setSearch(valor)
    setPagina(1)
  }

  function cerrarModal() {
    edicionIdRef.current = null
    setModalOpen(false)
    setEditando(null)
  }

  function openCreate() {
    edicionIdRef.current = null
    setForm(EMPTY_FORM)
    setFormError(null)
    setCedulaLookupStatus('idle')
    setModalOpen(true)
  }

  // Precarga en dos pasos: el modal abre al instante con los datos de la
  // fila y, en segundo plano, GET /abonados/:id refresca los campos con lo
  // que hay en la BD por si la lista quedó desactualizada.
  function openEditar(abonado: Abonado) {
    edicionIdRef.current = abonado.id
    setEditando(abonado)
    setForm(formDesdeAbonado(abonado))
    setFormError(null)
    setCedulaLookupStatus('idle')
    setModalOpen(true)

    obtenerAbonado(abonado.id)
      .then((fresco) => {
        if (edicionIdRef.current !== fresco.id) return
        setEditando(fresco)
        setForm(formDesdeAbonado(fresco))
      })
      .catch(() => {})
  }

  // Abre el modal de detalle y carga su historial de cambios.
  function openDetalle(abonado: Abonado) {
    setViewDetail(abonado)
    setHistorialDetalle([])
    setHistorialError(null)
    setHistorialLoading(true)
    obtenerHistorialAbonado(abonado.id)
      .then(setHistorialDetalle)
      .catch(() => setHistorialError('No se pudo cargar el historial de cambios.'))
      .finally(() => setHistorialLoading(false))
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Si cambian la cédula a mano, el resultado de la búsqueda anterior ya no aplica
    if (field === 'cedula' && cedulaLookupStatus !== 'idle') {
      setCedulaLookupStatus('idle')
    }
  }

  // Consulta la API de Hacienda por el número de cédula (física o jurídica)
  // y, si encuentra un nombre, rellena "Nombre completo" automáticamente.
  async function buscarPorCedula() {
    const digitos = form.cedula.replace(/\D/g, '')
    if (!digitos) return

    setBuscandoCedula(true)
    setCedulaLookupStatus('idle')
    try {
      const res = await fetch(
        `https://api.hacienda.go.cr/fe/ae?identificacion=${digitos}`,
      )
      const text = await res.text()
      let data: { nombre?: string } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = {}
      }

      if (data.nombre) {
        updateField('nombre_completo', data.nombre)
        setCedulaLookupStatus('found')
      } else {
        setCedulaLookupStatus('not-found')
      }
    } catch {
      setCedulaLookupStatus('error')
    } finally {
      setBuscandoCedula(false)
    }
  }

  function changeTipo(tipo: TipoAbonado) {
    // Al cambiar de tipo, limpiamos los campos que no aplican al nuevo tipo
    // y re-formateamos la cédula (física y jurídica agrupan los guiones distinto)
    setForm((prev) => ({
      ...prev,
      tipo_abonado: tipo,
      cedula: formatearCedula(prev.cedula, tipo === 'Jurídica' ? 'juridica' : 'fisica'),
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

    if (editando) {
      // El backend solo acepta los campos de contacto: tipo, cédula y estado
      // quedan fijos. El plano catastrado se envía siempre en física para
      // que vaciarlo también persista (el backend lo guarda como NULL).
      const payload: AbonadoUpdatePayload = {
        nombre_completo: form.nombre_completo.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        direccion: form.direccion.trim(),
        ...(form.tipo_abonado === 'Jurídica'
          ? { nombre_representante_legal: form.nombre_representante_legal.trim() }
          : {}),
        ...(form.tipo_abonado === 'Física'
          ? { numero_plano_catastrado: form.numero_plano_catastrado.trim() }
          : {}),
      }

      setSubmitting(true)
      setFormError(null)
      try {
        const actualizado = await actualizarAbonado(editando.id, payload)
        setAbonados((prev) =>
          prev.map((a) => (a.id === actualizado.id ? actualizado : a)),
        )
        cerrarModal()
      } catch (err) {
        setFormError(
          err instanceof Error
            ? err.message
            : 'No se pudieron guardar los cambios. Intenta de nuevo.',
        )
      } finally {
        setSubmitting(false)
      }
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
      cerrarModal()
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

  const esJuridica = form.tipo_abonado === 'Jurídica'

  const modalFormEl = !modalOpen ? null : (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary-900">
                {editando ? 'Editar Abonado' : 'Nuevo Abonado'}
              </h2>
              {editando && (
                <p className="mt-0.5 text-xs text-primary-500">
                  {editando.numero_abonado} · {editando.tipo_abonado} · Cédula{' '}
                  {editando.cedula}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => cerrarModal()}
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
                disabled={!!editando}
                className="mt-1 w-full rounded-full border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-primary-50 disabled:text-primary-500"
              >
                <option value="Física">Física</option>
                <option value="Jurídica">Jurídica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700">
                {esJuridica ? 'Cédula jurídica' : 'Cédula'}
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={form.cedula}
                  onChange={(e) =>
                    updateField(
                      'cedula',
                      formatearCedula(
                        e.target.value,
                        esJuridica ? 'juridica' : 'fisica',
                      ),
                    )
                  }
                  readOnly={!!editando}
                  className={`w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none ${
                    editando
                      ? 'cursor-not-allowed bg-primary-50 text-primary-500'
                      : ''
                  }`}
                  placeholder={esJuridica ? '3-101-123456' : '1-2345-6789'}
                />
                {!editando && (
                  <button
                    type="button"
                    onClick={buscarPorCedula}
                    disabled={buscandoCedula || !form.cedula.trim()}
                    className="flex-none rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
                  >
                    {buscandoCedula ? 'Buscando...' : 'Buscar'}
                  </button>
                )}
              </div>
              {cedulaLookupStatus === 'found' && (
                <p className="mt-1.5 text-xs font-medium text-green-600">
                  Nombre encontrado y completado automáticamente.
                </p>
              )}
              {cedulaLookupStatus === 'not-found' && (
                <p className="mt-1.5 text-xs text-primary-500">
                  No encontramos datos para esa cédula. Completa el nombre a mano.
                </p>
              )}
              {cedulaLookupStatus === 'error' && (
                <p className="mt-1.5 text-xs text-primary-500">
                  No pudimos verificar la cédula automáticamente. Completa el nombre a mano.
                </p>
              )}
            </div>

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
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
              >
                {submitting
                  ? 'Guardando...'
                  : editando
                    ? 'Guardar cambios'
                    : 'Crear abonado'}
              </button>
              <button
                type="button"
                onClick={() => cerrarModal()}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    )

  const confirmacionModalEl = !confirmacion ? null : (
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

  const a = viewDetail
  const esJuridicaDetalle = a?.tipo_abonado === 'Jurídica'
  const detailModalEl = !a ? null : (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
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
                {esJuridicaDetalle ? 'Razón social:' : 'Nombre:'}
              </span>
              <span className="text-primary-900">{a.nombre_completo}</span>
              <span className="font-medium text-primary-700">Tipo:</span>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getTipoBadge(a.tipo_abonado)}`}>
                {a.tipo_abonado}
              </span>
              {esJuridicaDetalle && (
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
              {!esJuridicaDetalle && a.numero_plano_catastrado && (
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

          <div className="mt-5 border-t border-primary-100 pt-4">
            <h3 className="mb-3 text-sm font-medium text-primary-700">
              Historial de cambios
            </h3>
            {historialLoading ? (
              <p className="text-xs text-primary-400">Cargando historial...</p>
            ) : historialError ? (
              <p className="text-xs font-medium text-red-500">{historialError}</p>
            ) : historialDetalle.length === 0 ? (
              <p className="text-xs text-primary-400">Sin cambios registrados.</p>
            ) : (
              <ul>
                {historialDetalle.map((h, i) => (
                  <li key={h.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < historialDetalle.length - 1 && (
                      <span className="absolute left-[5px] top-4 h-full w-px bg-primary-200" />
                    )}
                    <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-blue-500" />
                    <div className="min-w-0 text-xs">
                      <p className="font-medium text-primary-900">
                        {CAMPO_LABELS[h.campo] ?? h.campo}:{' '}
                        <span className="text-red-500 line-through">
                          {mostrarValorHistorial(h.valor_anterior)}
                        </span>
                        {' → '}
                        <span className="text-green-600">
                          {mostrarValorHistorial(h.valor_nuevo)}
                        </span>
                      </p>
                      <p className="mt-0.5 break-all text-primary-400">
                        {formatearFechaHistorial(h.fecha)} · {h.usuario_email}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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

      <div className="relative w-full sm:w-96">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nombre, cédula, N° de abonado, teléfono o dirección..."
          value={search}
          onChange={(e) => manejarBusqueda(e.target.value)}
          className="w-full rounded-lg border border-primary-200 py-2.5 pl-10 pr-9 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => manejarBusqueda('')}
            title="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-primary-300 hover:bg-primary-100 hover:text-primary-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

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
                Array.from({ length: 5 }).map((_, fila) => (
                  <tr key={`skeleton-${fila}`}>
                    {Array.from({ length: 8 }).map((__, col) => (
                      <td key={col} className="px-4 py-3.5">
                        <div
                          className={`animate-pulse rounded bg-primary-100 ${
                            ['w-3/4', 'w-1/2', 'w-5/6', 'w-2/3'][col % 4]
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <svg
                      className="mx-auto h-8 w-8 text-primary-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                    {search ? (
                      <>
                        <p className="mt-3 text-sm font-medium text-primary-600">
                          No encontramos abonados para "{search}"
                        </p>
                        <p className="mt-1 text-xs text-primary-400">
                          Revisa el término escrito o prueba con otro criterio.
                        </p>
                        <button
                          type="button"
                          onClick={() => manejarBusqueda('')}
                          className="mt-4 rounded-lg border border-primary-200 px-4 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                        >
                          Limpiar búsqueda
                        </button>
                      </>
                    ) : (
                      <p className="mt-3 text-sm font-medium text-primary-600">
                        Aún no hay abonados registrados. Usa el botón "+ Nuevo
                        abonado" para crear el primero.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filasVisibles.map((abonado) => (
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
                          onClick={() => openEditar(abonado)}
                          className="text-sm font-medium text-primary-500 hover:text-primary-700 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => openDetalle(abonado)}
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

          {!loading && abonados.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-primary-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-primary-500">
                Mostrando{' '}
                {filtered.length === 0
                  ? 0
                  : `${primeraFila + 1}–${Math.min(primeraFila + ABONADOS_POR_PAGINA, filtered.length)}`}{' '}
                de {filtered.length} abonados
                {search ? ` (filtro: "${search}")` : ''}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹ Anterior
                </button>
                {numerosPagina.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPagina(n)}
                    disabled={n === paginaActual}
                    aria-current={n === paginaActual ? 'page' : undefined}
                    className={`h-7 min-w-[28px] rounded-lg px-2 text-xs font-medium ${
                      n === paginaActual
                        ? 'bg-primary-700 text-white'
                        : 'text-primary-700 hover:bg-primary-50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {modalFormEl}
      {detailModalEl}
      {confirmacionModalEl}
    </div>
  )
}

export default Abonados
