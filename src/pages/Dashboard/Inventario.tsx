import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react'
import {
  obtenerArticulos,
  crearArticulo,
  actualizarArticulo,
  registrarMovimientoArticulo,
  obtenerHistorialArticulo,
  cambiarEstadoArticulo,
  obtenerProveedores,
  type Articulo,
  type MovimientoInventario,
  type Proveedor,
  type CrearArticuloPayload,
  type RegistrarMovimientoPayload,
} from '../../components/Services/inventario.service'

const CLASIFICACIONES = [
  { valor: 'articulo', etiqueta: 'Artículo' },
  { valor: 'inmueble', etiqueta: 'Inmueble' },
] as const

const ARTICULOS_POR_PAGINA = 10

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function getEstadoColor(estado: string) {
  if (estado === 'activo') return 'bg-green-100 text-green-700'
  return 'bg-red-100 text-red-700'
}

function getClasificacionBadge(clasificacion: string) {
  if (clasificacion === 'articulo') return 'bg-blue-100 text-blue-700'
  return 'bg-purple-100 text-purple-700'
}

function formatearFechaHora(fechaIso: string): string {
  if (!fechaIso) return '—'
  const d = new Date(fechaIso)
  if (Number.isNaN(d.getTime())) return fechaIso
  return d.toLocaleString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizarBusqueda(t: string) {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// Interruptor interactivo idéntico al de Abonados
function EstadoSwitch({
  estado,
  disabled,
  onChange,
}: {
  estado: string
  disabled?: boolean
  onChange: () => void
}) {
  const activo = estado === 'activo'
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

function Inventario() {
  // Datos
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmacion, setConfirmacion] = useState<string | null>(null)

  // Filtros & Búsqueda
  const [search, setSearch] = useState('')
  const [filtroClasificacion, setFiltroClasificacion] = useState('Todas')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [pagina, setPagina] = useState(1)

  // Modales
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Articulo | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Modal Detalle
  const [viewDetail, setViewDetail] = useState<Articulo | null>(null)
  const [historialDetalle, setHistorialDetalle] = useState<MovimientoInventario[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const [historialError, setHistorialError] = useState<string | null>(null)

  // Modal Cambio de Estado (Task 451)
  const [cambioEstado, setCambioEstado] = useState<{
    articulo: Articulo
    nuevo: 'activo' | 'inactivo'
  } | null>(null)
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState<number | null>(null)
  const [errorCambioEstado, setErrorCambioEstado] = useState<string | null>(null)

  // Modal Movimiento Rápido
  const [articuloMovimiento, setArticuloMovimiento] = useState<Articulo | null>(null)
  const [formMovimiento, setFormMovimiento] = useState<RegistrarMovimientoPayload>({
    tipoMovimiento: 'entrada',
    cantidad: 1,
    motivo: '',
    responsableDestino: '',
  })
  const [errorFormMovimiento, setErrorFormMovimiento] = useState<string | null>(null)
  const [submittingMovimiento, setSubmittingMovimiento] = useState(false)

  // Estado del Formulario Artículo
  const [form, setForm] = useState<CrearArticuloPayload>({
    nombre: '',
    descripcion: '',
    clasificacion: 'articulo',
    cantidad: 0,
    fechaIngreso: hoyIso(),
    ubicacion: '',
    proveedorId: 0,
    personaRecibe: '',
  })

  // ------------------------------------------------------------------
  // Carga de Datos
  // ------------------------------------------------------------------
  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [articulosRes, proveedoresRes] = await Promise.all([
        obtenerArticulos({
          clasificacion: filtroClasificacion,
          estado: filtroEstado,
        }),
        obtenerProveedores(),
      ])
      setArticulos(articulosRes)
      setProveedores(proveedoresRes)
      if (proveedoresRes.length > 0 && form.proveedorId === 0) {
        setForm((p) => ({ ...p, proveedorId: proveedoresRes[0].id }))
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'No se pudo cargar la lista de artículos.',
      )
    } finally {
      setLoading(false)
    }
  }, [filtroClasificacion, filtroEstado, form.proveedorId])

  useEffect(() => {
    void cargarDatos()
  }, [cargarDatos])

  function notificarExito(msg: string) {
    setConfirmacion(msg)
    setTimeout(() => setConfirmacion(null), 4000)
  }

  // ------------------------------------------------------------------
  // Filtrado & Paginación
  // ------------------------------------------------------------------
  const q = normalizarBusqueda(search)
  const filtered = useMemo(() => {
    return articulos.filter((a) => {
      if (filtroClasificacion !== 'Todas' && a.clasificacion !== filtroClasificacion) {
        return false
      }
      if (filtroEstado !== 'Todos' && a.estado !== filtroEstado) {
        return false
      }
      if (q === '') return true
      return (
        normalizarBusqueda(a.nombre).includes(q) ||
        normalizarBusqueda(a.descripcion || '').includes(q) ||
        normalizarBusqueda(a.ubicacion || '').includes(q) ||
        normalizarBusqueda(a.proveedor?.nombre || '').includes(q)
      )
    })
  }, [articulos, filtroClasificacion, filtroEstado, q])

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / ARTICULOS_POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const primeraFila = (paginaActual - 1) * ARTICULOS_POR_PAGINA
  const filasVisibles = filtered.slice(primeraFila, primeraFila + ARTICULOS_POR_PAGINA)
  const numerosPagina = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  function manejarBusqueda(val: string) {
    setSearch(val)
    setPagina(1)
  }

  // ------------------------------------------------------------------
  // Apertura y Cierre de Modales
  // ------------------------------------------------------------------
  function cerrarModal() {
    setModalOpen(false)
    setEditando(null)
    setFormError(null)
  }

  function openCreate() {
    setEditando(null)
    setForm({
      nombre: '',
      descripcion: '',
      clasificacion: 'articulo',
      cantidad: 0,
      fechaIngreso: hoyIso(),
      ubicacion: '',
      proveedorId: proveedores[0]?.id ?? 0,
      personaRecibe: '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  function openEditar(articulo: Articulo) {
    setEditando(articulo)
    setForm({
      nombre: articulo.nombre,
      descripcion: articulo.descripcion,
      clasificacion: articulo.clasificacion,
      cantidad: articulo.cantidad_disponible,
      fechaIngreso: articulo.fecha_ingreso ? articulo.fecha_ingreso.slice(0, 10) : hoyIso(),
      ubicacion: articulo.ubicacion,
      proveedorId: articulo.proveedor?.id ?? proveedores[0]?.id ?? 0,
      personaRecibe: articulo.persona_recibe || '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function openDetalle(articulo: Articulo) {
    setViewDetail(articulo)
    setHistorialDetalle([])
    setHistorialError(null)
    setHistorialLoading(true)
    try {
      const hist = await obtenerHistorialArticulo(articulo.id)
      setHistorialDetalle(hist)
    } catch {
      setHistorialError('No se pudo cargar el historial del artículo.')
    } finally {
      setHistorialLoading(false)
    }
  }

  function openMovimiento(articulo: Articulo) {
    setArticuloMovimiento(articulo)
    setFormMovimiento({
      tipoMovimiento: 'entrada',
      cantidad: 1,
      motivo: '',
      responsableDestino: '',
    })
    setErrorFormMovimiento(null)
  }

  // ------------------------------------------------------------------
  // Formulario: Crear / Editar
  // ------------------------------------------------------------------
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!form.nombre.trim()) {
      setFormError('El nombre del artículo es obligatorio.')
      return
    }
    if (!form.descripcion.trim()) {
      setFormError('La descripción es obligatoria.')
      return
    }
    if (!form.ubicacion.trim()) {
      setFormError('La ubicación es obligatoria.')
      return
    }
    if (!form.personaRecibe.trim()) {
      setFormError('La persona que recibe es obligatoria.')
      return
    }
    if (!form.proveedorId) {
      setFormError('Debe seleccionar un proveedor válido.')
      return
    }

    setSubmitting(true)
    try {
      if (editando) {
        const actualizado = await actualizarArticulo(editando.id, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          clasificacion: form.clasificacion,
          ubicacion: form.ubicacion.trim(),
          proveedorId: Number(form.proveedorId),
          personaRecibe: form.personaRecibe.trim(),
        })
        setArticulos((prev) => prev.map((a) => (a.id === actualizado.id ? actualizado : a)))
        if (viewDetail && viewDetail.id === actualizado.id) {
          setViewDetail(actualizado)
        }
        notificarExito(`Artículo "${actualizado.nombre}" actualizado correctamente.`)
      } else {
        const creado = await crearArticulo({
          ...form,
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          ubicacion: form.ubicacion.trim(),
          personaRecibe: form.personaRecibe.trim(),
          cantidad: Number(form.cantidad),
          proveedorId: Number(form.proveedorId),
        })
        setArticulos((prev) => [creado, ...prev])
        notificarExito(`Artículo "${creado.nombre}" registrado exitosamente.`)
      }
      cerrarModal()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Ocurrió un error al guardar el artículo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ------------------------------------------------------------------
  // Cambio de Estado (Task 451)
  // ------------------------------------------------------------------
  async function confirmarCambioEstado() {
    if (!cambioEstado) return
    const { articulo, nuevo } = cambioEstado
    setCambiandoEstadoId(articulo.id)
    setErrorCambioEstado(null)
    try {
      const actualizado = await cambiarEstadoArticulo(articulo.id, nuevo)
      setArticulos((prev) => prev.map((a) => (a.id === actualizado.id ? actualizado : a)))
      if (viewDetail && viewDetail.id === actualizado.id) {
        setViewDetail(actualizado)
      }
      setCambioEstado(null)
      notificarExito(
        `El artículo "${articulo.nombre}" ahora está ${nuevo === 'activo' ? 'Activo' : 'Inactivo'}.`,
      )
    } catch (err) {
      setErrorCambioEstado(
        err instanceof Error ? err.message : 'No se pudo cambiar el estado del artículo.',
      )
    } finally {
      setCambiandoEstadoId(null)
    }
  }

  // ------------------------------------------------------------------
  // Movimiento Rápido
  // ------------------------------------------------------------------
  const stockActual = articuloMovimiento?.cantidad_disponible ?? 0
  const stockProyectado =
    formMovimiento.tipoMovimiento === 'entrada'
      ? stockActual + (Number(formMovimiento.cantidad) || 0)
      : stockActual - (Number(formMovimiento.cantidad) || 0)

  const esSalidaInvalida =
    formMovimiento.tipoMovimiento === 'salida' &&
    Number(formMovimiento.cantidad) > stockActual

  async function handleConfirmarMovimiento(e: FormEvent) {
    e.preventDefault()
    if (!articuloMovimiento) return
    setErrorFormMovimiento(null)

    if (Number(formMovimiento.cantidad) <= 0) {
      setErrorFormMovimiento('La cantidad debe ser mayor a cero.')
      return
    }
    if (formMovimiento.tipoMovimiento === 'salida' && !formMovimiento.responsableDestino?.trim()) {
      setErrorFormMovimiento('El destino o responsable es obligatorio en salidas.')
      return
    }
    if (esSalidaInvalida) {
      setErrorFormMovimiento(
        `Stock insuficiente. No se puede egresar más de lo disponible (${stockActual} uds).`,
      )
      return
    }
    if (!formMovimiento.motivo.trim()) {
      setErrorFormMovimiento('El motivo del movimiento es obligatorio.')
      return
    }

    setSubmittingMovimiento(true)
    try {
      const res = await registrarMovimientoArticulo(articuloMovimiento.id, {
        tipoMovimiento: formMovimiento.tipoMovimiento,
        cantidad: Number(formMovimiento.cantidad),
        motivo: formMovimiento.motivo.trim(),
        responsableDestino: formMovimiento.responsableDestino?.trim() || undefined,
      })

      // Actualizar artículo de forma reactiva sin recargar
      setArticulos((prev) =>
        prev.map((a) => (a.id === res.articulo.id ? res.articulo : a)),
      )
      if (viewDetail && viewDetail.id === res.articulo.id) {
        setViewDetail(res.articulo)
        setHistorialDetalle((prev) => [res.movimiento, ...prev])
      }
      setArticuloMovimiento(null)
      notificarExito(
        `Movimiento registrado: ${res.articulo.nombre} tiene ahora ${res.articulo.cantidad_disponible} unidades disponibles.`,
      )
    } catch (err) {
      setErrorFormMovimiento(
        err instanceof Error ? err.message : 'Error al registrar el movimiento.',
      )
    } finally {
      setSubmittingMovimiento(false)
    }
  }

  // ------------------------------------------------------------------
  // Modales JSX
  // ------------------------------------------------------------------

  // 1. Modal Formulario (Crear / Editar)
  const modalFormEl = !modalOpen ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary-900">
              {editando ? 'Editar Artículo' : 'Nuevo Artículo'}
            </h2>
            {editando && (
              <p className="mt-0.5 text-xs text-primary-500">
                ID #{editando.id} · {editando.clasificacion === 'articulo' ? 'Artículo' : 'Inmueble'} · Stock: {editando.cantidad_disponible} uds
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={cerrarModal}
            className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Nombre del artículo *
            </label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Tubería PVC 1/2 pulgada"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700">
              Descripción detallada *
            </label>
            <textarea
              rows={2}
              required
              value={form.descripcion}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              placeholder="Especificaciones técnicas, marca, uso..."
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Clasificación *
              </label>
              <select
                value={form.clasificacion}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    clasificacion: e.target.value as 'inmueble' | 'articulo',
                  }))
                }
                className="mt-1 w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
              >
                {CLASIFICACIONES.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700">
                Proveedor *
              </label>
              <select
                value={form.proveedorId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, proveedorId: Number(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
              >
                {proveedores.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.nombre} ({pr.tipo})
                  </option>
                ))}
              </select>
            </div>

            {!editando && (
              <>
                <div>
                  <label className="block text-sm font-medium text-primary-700">
                    Cantidad inicial en stock *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.cantidad}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, cantidad: Number(e.target.value) }))
                    }
                    className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700">
                    Fecha de ingreso *
                  </label>
                  <input
                    type="date"
                    max={hoyIso()}
                    required
                    value={form.fechaIngreso}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, fechaIngreso: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-primary-700">
                Ubicación actual *
              </label>
              <input
                type="text"
                required
                value={form.ubicacion}
                onChange={(e) => setForm((p) => ({ ...p, ubicacion: e.target.value }))}
                placeholder="Ej. Bodega A / Taller Central"
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700">
                Persona que recibe *
              </label>
              <input
                type="text"
                required
                value={form.personaRecibe}
                onChange={(e) => setForm((p) => ({ ...p, personaRecibe: e.target.value }))}
                placeholder="Nombre del encargado"
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          {formError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-primary-100">
            <button
              type="button"
              onClick={cerrarModal}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
            >
              {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear artículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // 2. Modal Detalle con Línea de Tiempo de Movimientos
  const detailModalEl = !viewDetail ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary-900">Detalle del Artículo</h2>
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
            <span className="text-primary-900 font-medium">{viewDetail.nombre}</span>

            <span className="font-medium text-primary-700">Descripción:</span>
            <span className="text-primary-900">{viewDetail.descripcion || '—'}</span>

            <span className="font-medium text-primary-700">Clasificación:</span>
            <span
              className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${getClasificacionBadge(
                viewDetail.clasificacion,
              )}`}
            >
              {viewDetail.clasificacion === 'articulo' ? 'Artículo' : 'Inmueble'}
            </span>

            <span className="font-medium text-primary-700">Stock disponible:</span>
            <span className="font-mono font-bold text-primary-900">
              {viewDetail.cantidad_disponible} unidades
            </span>

            <span className="font-medium text-primary-700">Ubicación actual:</span>
            <span className="text-primary-900">{viewDetail.ubicacion || '—'}</span>

            <span className="font-medium text-primary-700">Proveedor:</span>
            <span className="text-primary-900">{viewDetail.proveedor?.nombre || '—'}</span>

            <span className="font-medium text-primary-700">Persona que recibe:</span>
            <span className="text-primary-900">{viewDetail.persona_recibe || '—'}</span>

            <span className="font-medium text-primary-700">Fecha de ingreso:</span>
            <span className="text-primary-900">
              {formatearFechaHora(viewDetail.fecha_ingreso || viewDetail.fecha_creacion)}
            </span>

            <span className="font-medium text-primary-700">Estado:</span>
            <span
              className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(
                viewDetail.estado,
              )}`}
            >
              {viewDetail.estado === 'activo' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="mt-5 border-t border-primary-100 pt-4">
          <h3 className="mb-3 text-sm font-medium text-primary-700">Historial de movimientos</h3>
          {historialLoading ? (
            <p className="text-xs text-primary-400">Cargando historial...</p>
          ) : historialError ? (
            <p className="text-xs font-medium text-red-500">{historialError}</p>
          ) : historialDetalle.length === 0 ? (
            <p className="text-xs text-primary-400">Sin movimientos registrados aún.</p>
          ) : (
            <ul className="space-y-3">
              {historialDetalle.map((m, i) => (
                <li key={m.id} className="relative flex gap-3 pb-3 last:pb-0">
                  {i < historialDetalle.length - 1 && (
                    <span className="absolute left-[5px] top-4 h-full w-px bg-primary-200" />
                  )}
                  <span
                    className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${
                      m.tipo_movimiento === 'entrada' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <div className="min-w-0 text-xs">
                    <p className="font-medium text-primary-900">
                      <span
                        className={`inline-block rounded-full px-2 py-0.2 text-[11px] font-semibold ${
                          m.tipo_movimiento === 'entrada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {m.tipo_movimiento === 'entrada' ? '+ Entrada' : '- Salida'}
                      </span>{' '}
                      <span className="font-mono font-bold">{m.cantidad} uds</span> &mdash; Motivo:{' '}
                      {m.motivo}
                    </p>
                    <p className="mt-0.5 text-primary-500">
                      {formatearFechaHora(m.fecha_movimiento)} · {m.nombre_persona_registro || 'Sistema'}
                      {m.responsable_destino ? ` · Destino: ${m.responsable_destino}` : ''}
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

  // 3. Modal Cambio de Estado (Task 451)
  const cambioEstadoModalEl =
    cambioEstado === null ? null : (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-primary-900">Cambiar estado del artículo</h2>
          <p className="mt-3 text-sm text-primary-600">
            ¿Seguro que deseas cambiar el estado de{' '}
            <span className="font-semibold text-primary-800">{cambioEstado.articulo.nombre}</span>?
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(
                cambioEstado.articulo.estado,
              )}`}
            >
              {cambioEstado.articulo.estado === 'activo' ? 'Activo' : 'Inactivo'}
            </span>
            <span aria-hidden="true" className="text-primary-400">
              →
            </span>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(
                cambioEstado.nuevo,
              )}`}
            >
              {cambioEstado.nuevo === 'activo' ? 'Activo' : 'Inactivo'}
            </span>
          </p>
          <p className="mt-3 text-xs text-primary-400">
            {cambioEstado.nuevo === 'inactivo'
              ? 'Al inhabilitar el artículo, no se podrán registrar nuevas entradas ni salidas hasta que vuelva a activarse.'
              : 'Al reactivar el artículo, volverá a estar disponible para movimientos en bodega.'}
          </p>
          {errorCambioEstado && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {errorCambioEstado}
            </p>
          )}
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
    )

  // 4. Modal Movimiento Rápido desde la Fila
  const movimientoModalEl = !articuloMovimiento ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary-900">Registrar Movimiento</h2>
            <p className="text-sm text-primary-500">{articuloMovimiento.nombre}</p>
          </div>
          <button
            type="button"
            onClick={() => setArticuloMovimiento(null)}
            className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleConfirmarMovimiento} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700">Tipo de Movimiento</label>
            <div className="mt-1 grid grid-cols-2 gap-2 rounded-lg bg-primary-50 p-1 border border-primary-200">
              <button
                type="button"
                onClick={() => setFormMovimiento((p) => ({ ...p, tipoMovimiento: 'entrada' }))}
                className={`rounded-md py-2 text-sm font-semibold transition-colors ${
                  formMovimiento.tipoMovimiento === 'entrada'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-primary-700 hover:text-primary-900'
                }`}
              >
                + Entrada (Ingreso)
              </button>
              <button
                type="button"
                onClick={() => setFormMovimiento((p) => ({ ...p, tipoMovimiento: 'salida' }))}
                className={`rounded-md py-2 text-sm font-semibold transition-colors ${
                  formMovimiento.tipoMovimiento === 'salida'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-primary-700 hover:text-primary-900'
                }`}
              >
                - Salida (Egreso)
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-primary-600">Stock Actual:</span>
              <span className="font-mono font-bold text-primary-900">{stockActual} unidades</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-primary-600">
                {formMovimiento.tipoMovimiento === 'entrada' ? 'Ingreso (+):' : 'Salida (-):'}
              </span>
              <span
                className={`font-mono font-bold ${
                  formMovimiento.tipoMovimiento === 'entrada' ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {formMovimiento.tipoMovimiento === 'entrada' ? '+' : '-'}
                {formMovimiento.cantidad || 0} unidades
              </span>
            </div>
            <div className="mt-2 border-t border-primary-200 pt-2 flex items-center justify-between">
              <span className="font-semibold text-primary-800">Stock Resultante:</span>
              <span
                className={`font-mono font-bold text-base ${
                  esSalidaInvalida ? 'text-red-600' : 'text-primary-900'
                }`}
              >
                {stockProyectado} unidades
              </span>
            </div>
            {esSalidaInvalida && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                ⚠️ Stock insuficiente. No se puede egresar más de lo disponible en bodega.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700">Cantidad *</label>
            <input
              type="number"
              min={1}
              required
              value={formMovimiento.cantidad}
              onChange={(e) =>
                setFormMovimiento((p) => ({ ...p, cantidad: Number(e.target.value) }))
              }
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>

          {formMovimiento.tipoMovimiento === 'salida' && (
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Responsable / Destino *
              </label>
              <input
                type="text"
                required
                value={formMovimiento.responsableDestino}
                onChange={(e) =>
                  setFormMovimiento((p) => ({ ...p, responsableDestino: e.target.value }))
                }
                placeholder="Ej. Fontanero Mario Solano / Reparación Pozo 2"
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-primary-700">Motivo *</label>
            <textarea
              rows={2}
              required
              value={formMovimiento.motivo}
              onChange={(e) => setFormMovimiento((p) => ({ ...p, motivo: e.target.value }))}
              placeholder="Ej. Compra de insumos / Atención de fuga"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>

          {errorFormMovimiento && (
            <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
              {errorFormMovimiento}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-primary-100">
            <button
              type="button"
              onClick={() => setArticuloMovimiento(null)}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submittingMovimiento || esSalidaInvalida}
              className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
            >
              {submittingMovimiento ? 'Registrando...' : 'Confirmar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // ------------------------------------------------------------------
  // RENDER PRINCIPAL (Homologado con Abonados.tsx)
  // ------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">Catálogo de Artículos</h1>
          <p className="mt-1 text-sm text-primary-500">
            {loading ? 'Cargando...' : `${articulos.length} artículos registrados`}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="self-start rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
        >
          + Nuevo artículo
        </button>
      </div>

      {/* Alerta de confirmación */}
      {confirmacion && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {confirmacion}
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            placeholder="Buscar por nombre, descripción o ubicación..."
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

        <select
          value={filtroClasificacion}
          onChange={(e) => {
            setFiltroClasificacion(e.target.value)
            setPagina(1)
          }}
          className="rounded-lg border border-primary-200 bg-white px-3 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
        >
          <option value="Todas">Todas las clasificaciones</option>
          <option value="articulo">Artículo</option>
          <option value="inmueble">Inmueble</option>
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => {
            setFiltroEstado(e.target.value)
            setPagina(1)
          }}
          className="rounded-lg border border-primary-200 bg-white px-3 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
        >
          <option value="Todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {/* Error de carga */}
      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-sm font-medium text-red-600">{loadError}</p>
          <button
            type="button"
            onClick={cargarDatos}
            className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      ) : (
        /* Tabla de Artículos */
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-primary-100 text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Artículo</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Clasificación</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Stock Disp.</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Ubicación</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, fila) => (
                  <tr key={`skeleton-${fila}`}>
                    {Array.from({ length: 6 }).map((__, col) => (
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
                  <td colSpan={6} className="px-4 py-12 text-center">
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
                          No encontramos artículos para "{search}"
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
                        Aún no hay artículos registrados. Usa el botón "+ Nuevo artículo" para crear
                        el primero.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filasVisibles.map((item) => (
                  <tr key={item.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-primary-900">{item.nombre}</div>
                      <div className="text-xs text-primary-400 line-clamp-1">{item.descripcion}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getClasificacionBadge(
                          item.clasificacion,
                        )}`}
                      >
                        {item.clasificacion === 'articulo' ? 'Artículo' : 'Inmueble'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.cantidad_disponible === 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.cantidad_disponible} uds
                      </span>
                    </td>
                    <td className="px-4 py-3 text-primary-600">{item.ubicacion || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <EstadoSwitch
                          estado={item.estado}
                          disabled={cambiandoEstadoId === item.id}
                          onChange={() => {
                            setErrorCambioEstado(null)
                            setCambioEstado({
                              articulo: item,
                              nuevo: item.estado === 'activo' ? 'inactivo' : 'activo',
                            })
                          }}
                        />
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(
                            item.estado,
                          )}`}
                        >
                          {item.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditar(item)}
                          className="text-sm font-medium text-primary-500 hover:text-primary-700 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => openDetalle(item)}
                          className="text-sm font-medium text-primary-500 hover:text-primary-700 hover:underline"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => openMovimiento(item)}
                          disabled={item.estado === 'inactivo'}
                          className="text-sm font-medium text-primary-500 hover:text-primary-700 hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
                          title={
                            item.estado === 'inactivo'
                              ? 'No disponible para artículos inactivos'
                              : 'Registrar Entrada / Salida'
                          }
                        >
                          Movimiento
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Barra de Paginación */}
          {!loading && articulos.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-primary-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-primary-500">
                Mostrando{' '}
                {filtered.length === 0
                  ? 0
                  : `${primeraFila + 1}–${Math.min(
                      primeraFila + ARTICULOS_POR_PAGINA,
                      filtered.length,
                    )}`}{' '}
                de {filtered.length} artículos
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

      {/* Modales */}
      {modalFormEl}
      {detailModalEl}
      {cambioEstadoModalEl}
      {movimientoModalEl}
    </div>
  )
}

export default Inventario