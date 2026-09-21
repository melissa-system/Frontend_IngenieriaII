import { useState, useEffect, useMemo, useCallback } from 'react'
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

const UBICACIONES_SUGERIDAS = [
  'Bodega A (Materiales)',
  'Bodega B (Tuberías y Válvulas)',
  'Taller Central',
  'Tanque Principal',
  'Oficina ASADA',
]

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatearFechaHora(fechaIso: string): string {
  if (!fechaIso) return '—'
  const d = new Date(fechaIso)
  return d.toLocaleString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Inventario() {
  // Datos
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensajeExito, setMensajeExito] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroClasificacion, setFiltroClasificacion] = useState('Todas')
  const [filtroEstado, setFiltroEstado] = useState('Todos')

  // Modales
  const [modalNuevoArticulo, setModalNuevoArticulo] = useState(false)
  const [articuloAEditar, setArticuloAEditar] = useState<Articulo | null>(null)
  const [articuloMovimiento, setArticuloMovimiento] = useState<Articulo | null>(null)
  const [articuloHistorial, setArticuloHistorial] = useState<Articulo | null>(null)
  const [historialMovimientos, setHistorialMovimientos] = useState<MovimientoInventario[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [articuloACambiarEstado, setArticuloACambiarEstado] = useState<Articulo | null>(null)

  // ------------------------------------------------------------------
  // Formularios
  // ------------------------------------------------------------------
  const [formArticulo, setFormArticulo] = useState<CrearArticuloPayload>({
    nombre: '',
    descripcion: '',
    clasificacion: 'articulo',
    cantidad: 0,
    fechaIngreso: hoyIso(),
    ubicacion: '',
    proveedorId: 0,
    personaRecibe: '',
  })
  const [errorFormArticulo, setErrorFormArticulo] = useState('')

  const [formMovimiento, setFormMovimiento] = useState<RegistrarMovimientoPayload>({
    tipoMovimiento: 'entrada',
    cantidad: 1,
    motivo: '',
    responsableDestino: '',
  })
  const [errorFormMovimiento, setErrorFormMovimiento] = useState('')

  // ------------------------------------------------------------------
  // Carga de Datos
  // ------------------------------------------------------------------
  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setErrorGeneral('')
    try {
      const [articulosRes, proveedoresRes] = await Promise.all([
        obtenerArticulos({
          busqueda,
          clasificacion: filtroClasificacion,
          estado: filtroEstado,
        }),
        obtenerProveedores(),
      ])
      setArticulos(articulosRes)
      setProveedores(proveedoresRes)
      if (proveedoresRes.length > 0 && formArticulo.proveedorId === 0) {
        setFormArticulo((prev) => ({ ...prev, proveedorId: proveedoresRes[0].id }))
      }
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : 'Error al cargar los datos de inventario')
    } finally {
      setCargando(false)
    }
  }, [busqueda, filtroClasificacion, filtroEstado, formArticulo.proveedorId])

  useEffect(() => {
    void cargarDatos()
  }, [cargarDatos])

  function notificarExito(mensaje: string) {
    setMensajeExito(mensaje)
    setTimeout(() => setMensajeExito(''), 4000)
  }

  // ------------------------------------------------------------------
  // Handlers Artículos
  // ------------------------------------------------------------------
  function resetFormArticulo() {
    setFormArticulo({
      nombre: '',
      descripcion: '',
      clasificacion: 'articulo',
      cantidad: 0,
      fechaIngreso: hoyIso(),
      ubicacion: '',
      proveedorId: proveedores[0]?.id ?? 0,
      personaRecibe: '',
    })
    setErrorFormArticulo('')
  }

  async function handleCrearArticulo(e: React.FormEvent) {
    e.preventDefault()
    setErrorFormArticulo('')

    if (!formArticulo.nombre.trim()) {
      setErrorFormArticulo('El nombre del artículo es obligatorio')
      return
    }
    if (!formArticulo.descripcion.trim()) {
      setErrorFormArticulo('La descripción es obligatoria')
      return
    }
    if (formArticulo.cantidad < 0) {
      setErrorFormArticulo('La cantidad no puede ser negativa')
      return
    }
    if (formArticulo.fechaIngreso && formArticulo.fechaIngreso > hoyIso()) {
      setErrorFormArticulo('La fecha de ingreso no puede ser una fecha futura')
      return
    }
    if (!formArticulo.ubicacion.trim()) {
      setErrorFormArticulo('La ubicación es obligatoria')
      return
    }
    if (!formArticulo.personaRecibe.trim()) {
      setErrorFormArticulo('La persona que recibe es obligatoria')
      return
    }
    if (!formArticulo.proveedorId || formArticulo.proveedorId <= 0) {
      setErrorFormArticulo('Debe seleccionar un proveedor válido')
      return
    }

    try {
      await crearArticulo(formArticulo)
      setModalNuevoArticulo(false)
      resetFormArticulo()
      notificarExito('Artículo registrado en inventario exitosamente.')
      void cargarDatos()
    } catch (err) {
      setErrorFormArticulo(err instanceof Error ? err.message : 'Error al registrar el artículo')
    }
  }

  async function handleEditarArticulo(e: React.FormEvent) {
    e.preventDefault()
    if (!articuloAEditar) return
    setErrorFormArticulo('')

    try {
      await actualizarArticulo(articuloAEditar.id, {
        nombre: formArticulo.nombre,
        descripcion: formArticulo.descripcion,
        clasificacion: formArticulo.clasificacion,
        ubicacion: formArticulo.ubicacion,
        personaRecibe: formArticulo.personaRecibe,
        proveedorId: formArticulo.proveedorId,
      })
      setArticuloAEditar(null)
      notificarExito('Artículo actualizado exitosamente.')
      void cargarDatos()
    } catch (err) {
      setErrorFormArticulo(err instanceof Error ? err.message : 'Error al actualizar el artículo')
    }
  }

  function abrirEdicionArticulo(art: Articulo) {
    setArticuloAEditar(art)
    setFormArticulo({
      nombre: art.nombre,
      descripcion: art.descripcion,
      clasificacion: art.clasificacion,
      cantidad: art.cantidad_disponible,
      fechaIngreso: art.fecha_ingreso,
      ubicacion: art.ubicacion,
      proveedorId: art.proveedor?.id ?? 0,
      personaRecibe: art.persona_recibe,
    })
    setErrorFormArticulo('')
  }

  // ------------------------------------------------------------------
  // Handlers Movimiento Rápido (Entrada / Salida - Task 212)
  // ------------------------------------------------------------------
  function abrirModalMovimiento(art: Articulo) {
    setArticuloMovimiento(art)
    setFormMovimiento({
      tipoMovimiento: 'entrada',
      cantidad: 1,
      motivo: '',
      responsableDestino: '',
    })
    setErrorFormMovimiento('')
  }

  const stockProyectado = useMemo(() => {
    if (!articuloMovimiento) return 0
    const cant = Number(formMovimiento.cantidad) || 0
    return formMovimiento.tipoMovimiento === 'entrada'
      ? articuloMovimiento.cantidad_disponible + cant
      : articuloMovimiento.cantidad_disponible - cant
  }, [articuloMovimiento, formMovimiento.tipoMovimiento, formMovimiento.cantidad])

  const esSalidaInvalida = useMemo(() => {
    if (!articuloMovimiento) return false
    if (formMovimiento.tipoMovimiento === 'salida') {
      return formMovimiento.cantidad > articuloMovimiento.cantidad_disponible
    }
    return false
  }, [articuloMovimiento, formMovimiento.tipoMovimiento, formMovimiento.cantidad])

  async function handleRegistrarMovimiento(e: React.FormEvent) {
    e.preventDefault()
    if (!articuloMovimiento) return
    setErrorFormMovimiento('')

    if (formMovimiento.cantidad <= 0) {
      setErrorFormMovimiento('La cantidad debe ser mayor a 0')
      return
    }

    if (formMovimiento.tipoMovimiento === 'salida') {
      if (esSalidaInvalida) {
        setErrorFormMovimiento('Stock insuficiente para realizar esta salida')
        return
      }
      if (!formMovimiento.responsableDestino?.trim()) {
        setErrorFormMovimiento('El responsable o ubicación de destino es obligatorio en salidas')
        return
      }
    }

    if (!formMovimiento.motivo.trim()) {
      setErrorFormMovimiento('El motivo del movimiento es obligatorio')
      return
    }

    try {
      await registrarMovimientoArticulo(articuloMovimiento.id, formMovimiento)
      setArticuloMovimiento(null)
      notificarExito(
        `Movimiento de ${formMovimiento.tipoMovimiento} registrado exitosamente. Stock actualizado.`,
      )
      void cargarDatos()
    } catch (err) {
      setErrorFormMovimiento(err instanceof Error ? err.message : 'Error al registrar el movimiento')
    }
  }

  // ------------------------------------------------------------------
  // Handlers Historial Cronológico (Task 214)
  // ------------------------------------------------------------------
  async function abrirHistorial(art: Articulo) {
    setArticuloHistorial(art)
    setCargandoHistorial(true)
    try {
      const movimientos = await obtenerHistorialArticulo(art.id)
      setHistorialMovimientos(movimientos)
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : 'Error al cargar el historial')
    } finally {
      setCargandoHistorial(false)
    }
  }

  // ------------------------------------------------------------------
  // Handlers Estado (Inhabilitar / Reactivar - Task 451)
  // ------------------------------------------------------------------
  async function confirmarCambioEstado() {
    if (!articuloACambiarEstado) return
    try {
      const nuevo = articuloACambiarEstado.estado === 'activo' ? 'inactivo' : 'activo'
      await cambiarEstadoArticulo(articuloACambiarEstado.id, nuevo)
      notificarExito(
        `Artículo "${articuloACambiarEstado.nombre}" ${nuevo === 'activo' ? 'reactivado' : 'inhabilitado'} exitosamente.`,
      )
      setArticuloACambiarEstado(null)
      void cargarDatos()
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  // Clases compartidas
  const inputCls =
    'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none'
  const selectCls =
    'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none bg-white'
  const labelCls = 'block text-sm font-medium text-primary-700'
  const modalBgCls = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
  const modalCls = 'max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl'

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">
            Inventario de Materiales y Herramientas
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            Gestión y control de inventario de la ASADA, entradas, salidas y trazabilidad
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetFormArticulo()
            setModalNuevoArticulo(true)
          }}
          className="self-start rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-primary-800"
        >
          + Registrar Artículo
        </button>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          ✓ {mensajeExito}
        </div>
      )}
      {errorGeneral && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          ✕ {errorGeneral}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* VISTA ARTÍCULOS */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        {/* Barra de Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, descripción o proveedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-lg border border-primary-200 py-2 pl-9 pr-4 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <select
            value={filtroClasificacion}
            onChange={(e) => setFiltroClasificacion(e.target.value)}
            className="rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="Todas">Todas las clasificaciones</option>
            <option value="articulo">Artículo</option>
            <option value="inmueble">Inmueble</option>
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="Todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>

        {/* Tabla de Artículos */}
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-primary-100 text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Artículo</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Clasificación</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Stock Disp.</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Ubicación Actual</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-primary-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-primary-400">
                    Cargando inventario...
                  </td>
                </tr>
              ) : articulos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-primary-400">
                    No se encontraron artículos registrados.
                  </td>
                </tr>
              ) : (
                articulos.map((item) => {
                  const inactivo = item.estado === 'inactivo'
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-primary-50/50 transition-colors ${
                        inactivo ? 'bg-gray-50/70 opacity-75' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-primary-900">{item.nombre}</div>
                        <div className="text-xs text-primary-400 line-clamp-1">{item.descripcion}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            item.clasificacion === 'inmueble'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.clasificacion}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        <span
                          className={`rounded px-2 py-0.5 ${
                            item.cantidad_disponible === 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.cantidad_disponible} uds
                        </span>
                      </td>
                      <td className="px-4 py-3 text-primary-600">{item.ubicacion}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.estado === 'activo'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.estado === 'activo' ? 'bg-green-500' : 'bg-gray-500'
                            }`}
                          />
                          {item.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón Movimiento Rápido (Task 212) */}
                          <button
                            type="button"
                            onClick={() => abrirModalMovimiento(item)}
                            disabled={inactivo}
                            title={
                              inactivo
                                ? 'No disponible para artículos inactivos'
                                : 'Registrar Entrada / Salida'
                            }
                            className="rounded bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            ± Movimiento
                          </button>

                          {/* Botón Historial Cronológico (Task 214) */}
                          <button
                            type="button"
                            onClick={() => abrirHistorial(item)}
                            className="rounded border border-primary-200 px-2.5 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                          >
                            Historial
                          </button>

                          {/* Botón Editar */}
                          <button
                            type="button"
                            onClick={() => abrirEdicionArticulo(item)}
                            className="rounded border border-primary-200 px-2.5 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                          >
                            Editar
                          </button>

                          {/* Botón Inhabilitar / Reactivar (Task 451) */}
                          <button
                            type="button"
                            onClick={() => setArticuloACambiarEstado(item)}
                            className={`rounded px-2.5 py-1 text-xs font-semibold ${
                              item.estado === 'activo'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {item.estado === 'activo' ? 'Inhabilitar' : 'Reactivar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: REGISTRAR O EDITAR ARTÍCULO (Task 205) */}
      {/* ------------------------------------------------------------------ */}
      {(modalNuevoArticulo || articuloAEditar) && (
        <div className={modalBgCls}>
          <div className={modalCls}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-900">
                {articuloAEditar ? `Editar Artículo: ${articuloAEditar.nombre}` : 'Registrar Nuevo Artículo'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setModalNuevoArticulo(false)
                  setArticuloAEditar(null)
                  resetFormArticulo()
                }}
                className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
              >
                ✕
              </button>
            </div>

            {errorFormArticulo && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
                {errorFormArticulo}
              </div>
            )}

            <form onSubmit={articuloAEditar ? handleEditarArticulo : handleCrearArticulo} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nombre del artículo *</label>
                  <input
                    type="text"
                    required
                    value={formArticulo.nombre}
                    onChange={(e) => setFormArticulo((p) => ({ ...p, nombre: e.target.value }))}
                    className={inputCls}
                    placeholder="Ej. Tubería PVC 1/2 pulgada"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Descripción detallada *</label>
                  <textarea
                    rows={2}
                    required
                    value={formArticulo.descripcion}
                    onChange={(e) => setFormArticulo((p) => ({ ...p, descripcion: e.target.value }))}
                    className={inputCls}
                    placeholder="Especificaciones técnicas, marca, uso..."
                  />
                </div>

                <div>
                  <label className={labelCls}>Clasificación *</label>
                  <select
                    value={formArticulo.clasificacion}
                    onChange={(e) =>
                      setFormArticulo((p) => ({
                        ...p,
                        clasificacion: e.target.value as 'inmueble' | 'articulo',
                      }))
                    }
                    className={selectCls}
                  >
                    {CLASIFICACIONES.map((c) => (
                      <option key={c.valor} value={c.valor}>
                        {c.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Proveedor *</label>
                  <select
                    value={formArticulo.proveedorId}
                    onChange={(e) =>
                      setFormArticulo((p) => ({ ...p, proveedorId: Number(e.target.value) }))
                    }
                    className={selectCls}
                  >
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                {!articuloAEditar && (
                  <>
                    <div>
                      <label className={labelCls}>Cantidad inicial en stock *</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formArticulo.cantidad}
                        onChange={(e) =>
                          setFormArticulo((p) => ({ ...p, cantidad: Number(e.target.value) }))
                        }
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Fecha de ingreso *</label>
                      <input
                        type="date"
                        max={hoyIso()}
                        required
                        value={formArticulo.fechaIngreso}
                        onChange={(e) =>
                          setFormArticulo((p) => ({ ...p, fechaIngreso: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className={labelCls}>Ubicación inicial (bodega o responsable) *</label>
                  <input
                    type="text"
                    required
                    value={formArticulo.ubicacion}
                    onChange={(e) => setFormArticulo((p) => ({ ...p, ubicacion: e.target.value }))}
                    className={inputCls}
                    placeholder="Ej. Bodega A / Taller"
                    list="ubicaciones-sugeridas"
                  />
                  <datalist id="ubicaciones-sugeridas">
                    {UBICACIONES_SUGERIDAS.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className={labelCls}>Persona que recibe *</label>
                  <input
                    type="text"
                    required
                    value={formArticulo.personaRecibe}
                    onChange={(e) =>
                      setFormArticulo((p) => ({ ...p, personaRecibe: e.target.value }))
                    }
                    className={inputCls}
                    placeholder="Nombre del encargado"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-primary-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalNuevoArticulo(false)
                    setArticuloAEditar(null)
                    resetFormArticulo()
                  }}
                  className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-primary-800"
                >
                  {articuloAEditar ? 'Guardar Cambios' : 'Registrar Artículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: REGISTRAR ENTRADA / SALIDA (Task 212) */}
      {/* ------------------------------------------------------------------ */}
      {articuloMovimiento && (
        <div className={modalBgCls}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary-900">Registrar Movimiento</h2>
                <p className="text-sm font-medium text-primary-500">{articuloMovimiento.nombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setArticuloMovimiento(null)}
                className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
              >
                ✕
              </button>
            </div>

            {errorFormMovimiento && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
                {errorFormMovimiento}
              </div>
            )}

            <form onSubmit={handleRegistrarMovimiento} className="space-y-4">
              {/* Selector Entrada / Salida */}
              <div>
                <label className={labelCls}>Tipo de Movimiento</label>
                <div className="mt-1 grid grid-cols-2 gap-2 rounded-lg bg-primary-100 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setFormMovimiento((p) => ({ ...p, tipoMovimiento: 'entrada' }))
                    }
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
                    onClick={() =>
                      setFormMovimiento((p) => ({ ...p, tipoMovimiento: 'salida' }))
                    }
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

              {/* Panel de Cálculo de Stock en Vivo */}
              <div className="rounded-xl border border-primary-100 bg-primary-50/70 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-600">Stock Actual:</span>
                  <span className="font-mono font-bold text-primary-900">
                    {articuloMovimiento.cantidad_disponible} unidades
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-primary-600">
                    {formMovimiento.tipoMovimiento === 'entrada' ? 'Ingreso (+):' : 'Salida (-):'}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      formMovimiento.tipoMovimiento === 'entrada'
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}
                  >
                    {formMovimiento.tipoMovimiento === 'entrada' ? '+' : '-'}
                    {formMovimiento.cantidad || 0} unidades
                  </span>
                </div>
                <div className="mt-2 border-t border-primary-200 pt-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-primary-800">Stock Resultante:</span>
                  <span
                    className={`font-mono font-extrabold text-base ${
                      esSalidaInvalida ? 'text-red-600' : 'text-primary-900'
                    }`}
                  >
                    {stockProyectado} unidades
                  </span>
                </div>

                {esSalidaInvalida && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-red-700">
                    <span>⚠️</span>
                    <span>Stock insuficiente. No se puede egresar más de lo disponible.</span>
                  </div>
                )}
              </div>

              {/* Cantidad */}
              <div>
                <label className={labelCls}>Cantidad *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formMovimiento.cantidad}
                  onChange={(e) =>
                    setFormMovimiento((p) => ({ ...p, cantidad: Number(e.target.value) }))
                  }
                  className={inputCls}
                />
              </div>

              {/* Responsable Destino (Obligatorio en Salidas - Task 212) */}
              {formMovimiento.tipoMovimiento === 'salida' && (
                <div>
                  <label className={labelCls}>
                    Responsable / Ubicación Destino *
                    <span className="ml-1 text-xs text-red-600">(Obligatorio en salidas)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formMovimiento.responsableDestino}
                    onChange={(e) =>
                      setFormMovimiento((p) => ({ ...p, responsableDestino: e.target.value }))
                    }
                    className={inputCls}
                    placeholder="Ej. Fontanero Mario Solano / Reparación Pozo 2"
                  />
                </div>
              )}

              {/* Motivo */}
              <div>
                <label className={labelCls}>Motivo del movimiento *</label>
                <textarea
                  rows={2}
                  required
                  value={formMovimiento.motivo}
                  onChange={(e) => setFormMovimiento((p) => ({ ...p, motivo: e.target.value }))}
                  className={inputCls}
                  placeholder="Ej. Compra mensual de insumos / Atención de avería en tubería"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-primary-100 pt-4">
                <button
                  type="button"
                  onClick={() => setArticuloMovimiento(null)}
                  className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={esSalidaInvalida}
                  className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirmar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: HISTORIAL CRONOLÓGICO (Task 214) */}
      {/* ------------------------------------------------------------------ */}
      {articuloHistorial && (
        <div className={modalBgCls}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary-900">Historial Cronológico</h2>
                <p className="text-sm font-medium text-primary-500">
                  {articuloHistorial.nombre} &mdash; Stock actual: {articuloHistorial.cantidad_disponible} uds
                </p>
              </div>
              <button
                type="button"
                onClick={() => setArticuloHistorial(null)}
                className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
              >
                ✕
              </button>
            </div>

            {cargandoHistorial ? (
              <div className="py-12 text-center text-sm text-primary-400">
                Cargando historial de movimientos...
              </div>
            ) : historialMovimientos.length === 0 ? (
              <div className="rounded-xl border border-primary-100 bg-primary-50/50 py-12 text-center text-sm text-primary-400">
                Este artículo no tiene movimientos registrados aún.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-primary-100">
                <table className="min-w-full divide-y divide-primary-100 text-sm">
                  <thead className="bg-primary-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-primary-700">Fecha y Hora</th>
                      <th className="px-3 py-2 text-left font-medium text-primary-700">Tipo</th>
                      <th className="px-3 py-2 text-left font-medium text-primary-700">Cantidad</th>
                      <th className="px-3 py-2 text-left font-medium text-primary-700">Destino / Responsable</th>
                      <th className="px-3 py-2 text-left font-medium text-primary-700">Registrado por</th>
                      <th className="px-3 py-2 text-left font-medium text-primary-700">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-50">
                    {historialMovimientos.map((m) => (
                      <tr key={m.id} className="hover:bg-primary-50/30">
                        <td className="px-3 py-2.5 font-mono text-xs text-primary-500">
                          {formatearFechaHora(m.fecha_movimiento)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                              m.tipo_movimiento === 'entrada'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {m.tipo_movimiento === 'entrada' ? '+ Entrada' : '- Salida'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-primary-900">
                          {m.cantidad} uds
                        </td>
                        <td className="px-3 py-2.5 text-primary-600">
                          {m.responsable_destino || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-primary-600">
                          {m.nombre_persona_registro || 'Sistema'}
                        </td>
                        <td className="px-3 py-2.5 text-primary-700">{m.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setArticuloHistorial(null)}
                className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL CONFIRMACIÓN INHABILITAR / REACTIVAR (Task 451) */}
      {/* ------------------------------------------------------------------ */}
      {articuloACambiarEstado && (
        <div className={modalBgCls}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-primary-900">
              ¿Desea {articuloACambiarEstado.estado === 'activo' ? 'inhabilitar' : 'reactivar'} este artículo?
            </h3>
            <p className="mt-2 text-sm text-primary-600">
              Artículo:{' '}
              <strong className="text-primary-800">{articuloACambiarEstado.nombre}</strong>.
              {articuloACambiarEstado.estado === 'activo'
                ? ' Al inhabilitar el artículo, no se podrán registrar nuevas entradas ni salidas hasta que vuelva a activarse.'
                : ' Al reactivarlo, volverá a estar disponible para movimientos en inventario.'}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setArticuloACambiarEstado(null)}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarCambioEstado}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow ${
                  articuloACambiarEstado.estado === 'activo'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirmar {articuloACambiarEstado.estado === 'activo' ? 'Inhabilitación' : 'Reactivación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventario