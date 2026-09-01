import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import {
  crearEmpleado,
  obtenerEmpleados,
  actualizarEmpleado,
  cambiarEstadoEmpleado,
  buscarUsuarioPorEmail,
  nombreVisible,
  type Empleado,
  type EmpleadoPayload,
  type EmpleadoUpdatePayload,
  type EstadoEmpleado,
} from '../../components/Services/empleados.service'
import { formatearCedula } from '../../components/Services/solicitudes.service'

const PUESTOS = [
  'Junta Directiva',
  'Administrador',
  'Abonado',
  'Fontanero',
]

interface FormState {
  nombre: string
  cedula: string
  puesto: string
  telefono: string
  fecha_ingreso: string
  correo: string
}

const EMPTY_FORM: FormState = {
  nombre: '',
  cedula: '',
  puesto: '',
  telefono: '',
  fecha_ingreso: '',
  correo: '',
}

const EMPLEADOS_POR_PAGINA = 10

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Da formato al teléfono en el patrón costarricense 8888-8888 (8 dígitos).
function formatearTelefono(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 8)
  if (!d) return ''
  if (d.length <= 4) return d
  return `${d.slice(0, 4)}-${d.slice(4)}`
}

function normalizarBusqueda(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function getEstadoColor(estado: string): string {
  return estado === 'Activo'
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800'
}

// Interruptor para activar/desactivar un empleado. No guarda nada por sí
// mismo: solo dispara la confirmación que luego llama al backend.
function EstadoSwitch({
  estado,
  disabled,
  onChange,
}: {
  estado: string
  disabled?: boolean
  onChange: () => void
}) {
  const activo = estado === 'Activo'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={`Cambiar estado a ${activo ? 'Inactivo' : 'Activo'}`}
      title={`Cambiar estado a ${activo ? 'Inactivo' : 'Activo'}`}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-none items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        activo ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          activo ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}

function formDesdeEmpleado(emp: Empleado): FormState {
  return {
    nombre: emp.nombre,
    cedula: emp.cedula,
    puesto: emp.puesto,
    telefono: emp.telefono,
    fecha_ingreso: emp.fecha_ingreso.split('T')[0],
    correo: emp.email ?? '',
  }
}

interface ErroresForm {
  nombre?: string
  cedula?: string
  puesto?: string
  telefono?: string
  fecha_ingreso?: string
  correo?: string
}

function validarForm(form: FormState): ErroresForm {
  const e: ErroresForm = {}
  if (!form.nombre.trim()) e.nombre = 'El nombre completo es obligatorio'
  if (!form.cedula.trim()) e.cedula = 'La cédula es obligatoria'
  if (!form.puesto.trim()) e.puesto = 'El puesto es obligatorio'
  if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio'
  if (!form.fecha_ingreso) e.fecha_ingreso = 'La fecha de ingreso es obligatoria'
  if (!form.correo.trim()) {
    e.correo = 'El correo es obligatorio'
  } else if (!EMAIL_REGEX.test(form.correo.trim())) {
    e.correo = 'El correo no tiene un formato válido'
  }
  return e
}

type CedulaLookupStatus = 'idle' | 'found' | 'not-found' | 'error' | 'dimex'

function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pagina, setPagina] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<ErroresForm>({})
  const [submitting, setSubmitting] = useState(false)
  const [editando, setEditando] = useState(false)
  const edicionIdRef = useRef<number | null>(null)

  const [viewDetail, setViewDetail] = useState<Empleado | null>(null)

  const [confirmacion, setConfirmacion] = useState<string | null>(null)

  const [cambioEstado, setCambioEstado] = useState<Empleado | null>(null)
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState<number | null>(null)

  const [buscandoCedula, setBuscandoCedula] = useState(false)
  const [cedulaLookupStatus, setCedulaLookupStatus] = useState<CedulaLookupStatus>('idle')

  const [correoLookupStatus, setCorreoLookupStatus] = useState<
    'idle' | 'found' | 'not-found' | 'error'
  >('idle')
  const [correoUsuario, setCorreoUsuario] = useState<string | null>(null)

  const cargarEmpleados = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const data = await obtenerEmpleados()
      setEmpleados(data)
    } catch {
      setLoadError('No se pudieron cargar los empleados.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarEmpleados()
  }, [cargarEmpleados])

  const filtered = empleados.filter((emp) => {
    if (!search) return true
    const t = normalizarBusqueda(search)
    return (
      normalizarBusqueda(emp.nombre).includes(t) ||
      normalizarBusqueda(emp.cedula).includes(t) ||
      normalizarBusqueda(emp.puesto).includes(t) ||
      normalizarBusqueda(emp.telefono).includes(t)
    )
  })

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / EMPLEADOS_POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * EMPLEADOS_POR_PAGINA
  const filasVisibles = filtered.slice(inicio, inicio + EMPLEADOS_POR_PAGINA)

  useEffect(() => {
    setPagina(1)
  }, [search])

  // Verifica automáticamente (con un pequeño retraso) si el correo corresponde
  // a un usuario registrado, para poder asociarlo al empleado al guardar.
  useEffect(() => {
    const correo = form.correo.trim()
    // Solo consulta cuando el correo parece completo (formato básico).
    if (!EMAIL_REGEX.test(correo)) {
      setCorreoLookupStatus('idle')
      setCorreoUsuario(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const usuario = await buscarUsuarioPorEmail(correo)
        if (usuario) {
          setCorreoLookupStatus('found')
          setCorreoUsuario(usuario.email)
        } else {
          setCorreoLookupStatus('not-found')
          setCorreoUsuario(null)
        }
      } catch {
        setCorreoLookupStatus('error')
        setCorreoUsuario(null)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [form.correo])

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormError({})
    setEditando(false)
    edicionIdRef.current = null
    setCedulaLookupStatus('idle')
    setCorreoLookupStatus('idle')
    setCorreoUsuario(null)
    setModalOpen(true)
  }

  async function openEditar(emp: Empleado) {
    setForm(formDesdeEmpleado(emp))
    setFormError({})
    setEditando(true)
    edicionIdRef.current = emp.id
    setCedulaLookupStatus('idle')
    setCorreoLookupStatus('idle')
    setCorreoUsuario(null)
    setModalOpen(true)
  }

  function openDetalle(emp: Empleado) {
    setViewDetail(emp)
  }

  async function confirmarCambioEstado() {
    if (!cambioEstado) return
    setCambiandoEstadoId(cambioEstado.id)
    try {
      const nuevoEstado: EstadoEmpleado =
        cambioEstado.estado === 'Activo' ? 'Inactivo' : 'Activo'
      const actualizado = await cambiarEstadoEmpleado(cambioEstado.id, nuevoEstado)
      setEmpleados((prev) =>
        prev.map((e) => (e.id === actualizado.id ? actualizado : e)),
      )
      if (viewDetail?.id === actualizado.id) setViewDetail(actualizado)
    } catch {
      // silenciar
    } finally {
      setCambioEstado(null)
      setCambiandoEstadoId(null)
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'cedula' && cedulaLookupStatus !== 'idle') {
      setCedulaLookupStatus('idle')
    }
    if (field === 'correo' && correoLookupStatus !== 'idle') {
      setCorreoLookupStatus('idle')
      setCorreoUsuario(null)
    }
  }

  async function buscarPorCedula() {
    const digitos = form.cedula.replace(/\D/g, '')
    if (!digitos) return

    if (digitos.length === 12) {
      setCedulaLookupStatus('dimex')
      return
    }

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
        updateField('nombre', data.nombre)
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errores = validarForm(form)
    setFormError(errores)
    if (Object.keys(errores).length > 0) return

    setSubmitting(true)

    if (editando && edicionIdRef.current !== null) {
      const payload: EmpleadoUpdatePayload = {
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim(),
        puesto: form.puesto.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        fecha_ingreso: form.fecha_ingreso,
      }
      actualizarEmpleado(edicionIdRef.current, payload)
        .then((emp: Empleado) => {
          setEmpleados((prev) =>
            prev.map((e) => (e.id === emp.id ? emp : e)),
          )
          setModalOpen(false)
          setConfirmacion('Empleado actualizado correctamente.')
          setTimeout(() => setConfirmacion(null), 3000)
        })
        .catch((err: Error) => {
          setFormError({ nombre: err.message })
        })
        .finally(() => setSubmitting(false))
    } else {
      const payload: EmpleadoPayload = {
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim(),
        puesto: form.puesto.trim(),
        telefono: form.telefono.trim(),
        fecha_ingreso: form.fecha_ingreso,
        email: form.correo.trim(),
      }
      crearEmpleado(payload)
        .then((emp: Empleado) => {
          setEmpleados((prev) => [...prev, emp])
          setModalOpen(false)
          setConfirmacion('Empleado registrado correctamente.')
          setTimeout(() => setConfirmacion(null), 3000)
        })
        .catch((err: Error) => {
          setFormError({ nombre: err.message })
        })
        .finally(() => setSubmitting(false))
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none'
  const inputErrorClass =
    'mt-1 w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm text-primary-900 focus:border-red-500 focus:outline-none'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">Personal</h1>
          <p className="mt-1 text-sm text-primary-500">
            Gestión de empleados de la ASADA
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
        >
          Nuevo empleado
        </button>
      </div>

      {confirmacion && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {confirmacion}
        </div>
      )}

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

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
          placeholder="Buscar por nombre, cédula, puesto o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-primary-200 py-2.5 pl-10 pr-9 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            title="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-primary-300 hover:bg-primary-100 hover:text-primary-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-primary-100 bg-primary-50">
              <th className="px-4 py-3 font-medium text-primary-700">Nombre</th>
              <th className="px-4 py-3 font-medium text-primary-700">Cédula</th>
              <th className="px-4 py-3 font-medium text-primary-700">Puesto</th>
              <th className="px-4 py-3 font-medium text-primary-700">Teléfono</th>
              <th className="px-4 py-3 font-medium text-primary-700">Estado</th>
              <th className="px-4 py-3 font-medium text-primary-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-primary-50">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-primary-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filasVisibles.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-primary-400"
                >
                  {search
                    ? 'No se encontraron empleados con ese criterio.'
                    : 'No hay empleados registrados.'}
                </td>
              </tr>
            ) : (
              filasVisibles.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-primary-50 transition-colors hover:bg-primary-50/50"
                >
                  <td className="px-4 py-3 font-medium text-primary-900">
                    {nombreVisible(emp)}
                  </td>
                  <td className="px-4 py-3 text-primary-700">{emp.cedula}</td>
                  <td className="px-4 py-3 text-primary-700">{emp.puesto}</td>
                  <td className="px-4 py-3 text-primary-700">{emp.telefono}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <EstadoSwitch
                        estado={emp.estado}
                        disabled={cambiandoEstadoId === emp.id}
                        onChange={() => {
                          setCambioEstado(emp)
                        }}
                      />
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(emp.estado)}`}
                      >
                        {emp.estado}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditar(emp)}
                        className="text-sm font-medium text-primary-500 hover:text-primary-700 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => openDetalle(emp)}
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

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between border-t border-primary-100 px-4 py-3">
            <p className="text-xs text-primary-500">
              Página {paginaActual} de {totalPaginas} ({filtered.length}{' '}
              resultado{filtered.length !== 1 ? 's' : ''})
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaActual <= 1}
                className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual >= totalPaginas}
                className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal crear/editar ────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-primary-900">
              {editando ? 'Editar empleado' : 'Nuevo empleado'}
            </h2>
            <p className="mt-1 text-sm text-primary-500">
              Los campos marcados con * son obligatorios.
            </p>

            {formError.nombre && formError.nombre.length > 80 && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError.nombre}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* ── Cédula + Buscar ────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Cédula *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.cedula}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      if (raw.length <= 9) {
                        updateField('cedula', formatearCedula(raw, 'fisica'))
                      } else if (raw.length <= 10) {
                        updateField('cedula', formatearCedula(raw, 'juridica'))
                      } else {
                        updateField('cedula', raw.slice(0, 12))
                      }
                      if (formError.cedula) setFormError({ ...formError, cedula: undefined })
                    }}
                    placeholder="1-2345-6789"
                    readOnly={!!editando}
                    className={`${formError.cedula ? inputErrorClass : inputClass} ${editando ? 'cursor-not-allowed bg-primary-50 text-primary-500' : ''}`}
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
                    No encontramos datos para esa cédula. Completá el nombre a mano.
                  </p>
                )}
                {cedulaLookupStatus === 'error' && (
                  <p className="mt-1.5 text-xs text-primary-500">
                    No pudimos verificar la cédula. Completá el nombre a mano.
                  </p>
                )}
                {cedulaLookupStatus === 'dimex' && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    DIMEX no se puede verificar con Hacienda. Ingrese los datos manualmente.
                  </p>
                )}
                {formError.cedula && (
                  <p className="mt-1 text-xs text-red-600">{formError.cedula}</p>
                )}
              </div>

              {/* ── Nombre completo ───────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => {
                    updateField('nombre', e.target.value)
                    if (formError.nombre) setFormError({ ...formError, nombre: undefined })
                  }}
                  placeholder="Nombre y apellidos"
                  className={formError.nombre ? inputErrorClass : inputClass}
                />
                {formError.nombre && (
                  <p className="mt-1 text-xs text-red-600">{formError.nombre}</p>
                )}
              </div>

              {/* ── Puesto ────────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Puesto *
                </label>
                <select
                  value={PUESTOS.includes(form.puesto) ? form.puesto : ''}
                  onChange={(e) => {
                    updateField('puesto', e.target.value)
                    if (formError.puesto) setFormError({ ...formError, puesto: undefined })
                  }}
                  className={formError.puesto ? inputErrorClass : inputClass}
                >
                  <option value="" disabled>
                    Seleccionar puesto…
                  </option>
                  {PUESTOS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {formError.puesto && (
                  <p className="mt-1 text-xs text-red-600">{formError.puesto}</p>
                )}
              </div>

              {/* ── Teléfono + Fecha ──────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700">
                    Teléfono *
                  </label>
                  <input
                    value={form.telefono}
                    onChange={(e) => {
                      updateField('telefono', formatearTelefono(e.target.value))
                      if (formError.telefono) setFormError({ ...formError, telefono: undefined })
                    }}
                    type="tel"
                    inputMode="numeric"
                    placeholder="8888-8888"
                    className={formError.telefono ? inputErrorClass : inputClass}
                  />
                  {formError.telefono && (
                    <p className="mt-1 text-xs text-red-600">{formError.telefono}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700">
                    Fecha de ingreso *
                  </label>
                  <input
                    type="date"
                    value={form.fecha_ingreso}
                    onChange={(e) => {
                      updateField('fecha_ingreso', e.target.value)
                      if (formError.fecha_ingreso) setFormError({ ...formError, fecha_ingreso: undefined })
                    }}
                    className={formError.fecha_ingreso ? inputErrorClass : inputClass}
                  />
                  {formError.fecha_ingreso && (
                    <p className="mt-1 text-xs text-red-600">{formError.fecha_ingreso}</p>
                  )}
                </div>
              </div>

              {/* ── Correo (asociar usuario) ──────────────── */}
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Correo del usuario *
                </label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) => {
                    updateField('correo', e.target.value)
                    if (formError.correo) setFormError({ ...formError, correo: undefined })
                  }}
                  placeholder="usuario@correo.com"
                  className={formError.correo ? inputErrorClass : inputClass}
                />
                {correoLookupStatus === 'found' && correoUsuario && (
                  <p className="mt-1.5 text-xs font-medium text-green-600">
                    El usuario <strong>{correoUsuario}</strong> existe y se asociará
                    a este empleado como su cuenta.
                  </p>
                )}
                {correoLookupStatus === 'error' && (
                  <p className="mt-1.5 text-xs text-primary-500">
                    No pudimos verificar el correo. Intenta de nuevo.
                  </p>
                )}
                {formError.correo && (
                  <p className="mt-1 text-xs text-red-600">{formError.correo}</p>
                )}
              </div>

              {/* ── Botones ───────────────────────────────── */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? 'Guardando…'
                    : editando
                      ? 'Guardar cambios'
                      : 'Crear empleado'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="rounded-full border border-primary-300 px-5 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal detalle ────────────────────────────────── */}
      {viewDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-900">Detalle del Empleado</h2>
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
                <span className="font-medium text-primary-700">Nombre:</span>
                <span className="text-primary-900">{nombreVisible(viewDetail)}</span>
                <span className="font-medium text-primary-700">Cédula:</span>
                <span className="font-mono text-primary-900">{viewDetail.cedula}</span>
                <span className="font-medium text-primary-700">Puesto:</span>
                <span className="text-primary-900">{viewDetail.puesto}</span>
                <span className="font-medium text-primary-700">Teléfono:</span>
                <span className="text-primary-900">{viewDetail.telefono}</span>
                <span className="font-medium text-primary-700">Fecha de ingreso:</span>
                <span className="text-primary-900">{viewDetail.fecha_ingreso.split('T')[0]}</span>
                <span className="font-medium text-primary-700">Estado:</span>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(viewDetail.estado)}`}>
                  {viewDetail.estado}
                </span>
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
      )}

      {/* ── Modal cambio de estado ───────────────────────── */}
      {cambioEstado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-primary-900">
              Cambiar estado del empleado
            </h2>
            <p className="mt-3 text-sm text-primary-600">
              ¿Seguro que deseas cambiar el estado de{' '}
              <span className="font-semibold text-primary-800">
                {nombreVisible(cambioEstado)}
              </span>
              ?
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(cambioEstado.estado)}`}
              >
                {cambioEstado.estado}
              </span>
              <span aria-hidden="true" className="text-primary-400">→</span>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(cambioEstado.estado === 'Activo' ? 'Inactivo' : 'Activo')}`}
              >
                {cambioEstado.estado === 'Activo' ? 'Inactivo' : 'Activo'}
              </span>
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={confirmarCambioEstado}
                disabled={cambiandoEstadoId !== null}
                className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cambiandoEstadoId !== null ? 'Guardando...' : 'Sí, cambiar'}
              </button>
              <button
                type="button"
                onClick={() => setCambioEstado(null)}
                disabled={cambiandoEstadoId !== null}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmpleadosPage
