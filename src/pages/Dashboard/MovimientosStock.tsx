import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react'
import {
  obtenerArticulos,
  obtenerTodosLosMovimientos,
  registrarMovimientoArticulo,
  type Articulo,
  type MovimientoInventario,
} from '../../components/Services/inventario.service'

const MOVIMIENTOS_POR_PAGINA = 10

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

function MovimientosStock() {
  // Datos
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmacion, setConfirmacion] = useState<string | null>(null)

  // Filtros de Historial
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'salida'>('todos')
  const [pagina, setPagina] = useState(1)

  // ------------------------------------------------------------------
  // Estado del Formulario de Registro Rápido
  // ------------------------------------------------------------------
  const [articuloSeleccionadoId, setArticuloSeleccionadoId] = useState<number | ''>('')
  const [busquedaArticulo, setBusquedaArticulo] = useState('')
  const [tipoMovimiento, setTipoMovimiento] = useState<'entrada' | 'salida'>('entrada')
  const [cantidad, setCantidad] = useState<number | ''>(1)
  const [responsableRetira, setResponsableRetira] = useState('')
  const [ubicacionDestino, setUbicacionDestino] = useState('')
  const [motivo, setMotivo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // ------------------------------------------------------------------
  // Carga de Datos
  // ------------------------------------------------------------------
  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [articulosRes, movimientosRes] = await Promise.all([
        obtenerArticulos({ estado: 'activo' }),
        obtenerTodosLosMovimientos(),
      ])
      setArticulos(articulosRes)
      setMovimientos(movimientosRes)
      if (articulosRes.length > 0 && articuloSeleccionadoId === '') {
        setArticuloSeleccionadoId(articulosRes[0].id)
      }
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los datos de movimientos e inventario.',
      )
    } finally {
      setLoading(false)
    }
  }, [articuloSeleccionadoId])

  useEffect(() => {
    void cargarDatos()
  }, [cargarDatos])

  function notificarExito(msg: string) {
    setConfirmacion(msg)
    setTimeout(() => setConfirmacion(null), 4000)
  }

  // ------------------------------------------------------------------
  // Búsqueda Predictiva de Artículos para el Selector
  // ------------------------------------------------------------------
  const articulosFiltradosSelector = useMemo(() => {
    if (!busquedaArticulo.trim()) return articulos
    const qArt = normalizarBusqueda(busquedaArticulo)
    return articulos.filter((a) => normalizarBusqueda(a.nombre).includes(qArt))
  }, [articulos, busquedaArticulo])

  const articuloActual = useMemo(() => {
    if (!articuloSeleccionadoId) return null
    return articulos.find((a) => a.id === Number(articuloSeleccionadoId)) ?? null
  }, [articulos, articuloSeleccionadoId])

  const stockActual = articuloActual?.cantidad_disponible ?? 0
  const cantNum = Number(cantidad) || 0
  const stockResultante =
    tipoMovimiento === 'entrada' ? stockActual + cantNum : stockActual - cantNum

  const esSalidaInvalida = tipoMovimiento === 'salida' && cantNum > stockActual

  // ------------------------------------------------------------------
  // Envío del Formulario de Movimiento Rápido
  // ------------------------------------------------------------------
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!articuloActual) {
      setFormError('Debe seleccionar un artículo de la lista.')
      return
    }
    if (cantNum <= 0) {
      setFormError('La cantidad debe ser un número entero mayor a 0.')
      return
    }
    if (tipoMovimiento === 'salida') {
      if (!responsableRetira.trim()) {
        setFormError('El campo "Responsable que retira" es obligatorio para salidas.')
        return
      }
      if (!ubicacionDestino.trim()) {
        setFormError('El campo "Ubicación / Destino" es obligatorio para salidas.')
        return
      }
      if (esSalidaInvalida) {
        setFormError(
          `Stock insuficiente en bodega. Cantidad disponible: ${stockActual} unidades, solicitada: ${cantNum}.`,
        )
        return
      }
    }
    if (!motivo.trim()) {
      setFormError('El motivo del movimiento es obligatorio.')
      return
    }

    const responsableDestinoCombined =
      tipoMovimiento === 'salida'
        ? `${responsableRetira.trim()} — ${ubicacionDestino.trim()}`
        : undefined

    setSubmitting(true)
    try {
      const res = await registrarMovimientoArticulo(articuloActual.id, {
        tipoMovimiento,
        cantidad: cantNum,
        motivo: motivo.trim(),
        responsableDestino: responsableDestinoCombined,
      })

      // Actualizar reactivamente el stock del artículo en la lista de artículos
      setArticulos((prev) =>
        prev.map((a) => (a.id === res.articulo.id ? res.articulo : a)),
      )

      // Insertar el nuevo movimiento al inicio del historial de movimientos
      const nuevoMovConArticulo: MovimientoInventario = {
        ...res.movimiento,
        articulo: res.articulo,
      }
      setMovimientos((prev) => [nuevoMovConArticulo, ...prev])

      // Limpiar campos secundarios del formulario
      setCantidad(1)
      setResponsableRetira('')
      setUbicacionDestino('')
      setMotivo('')

      notificarExito(
        `Movimiento registrado exitosamente: ${res.articulo.nombre} tiene ahora ${res.articulo.cantidad_disponible} unidades disponibles.`,
      )
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Error al registrar el movimiento de inventario.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ------------------------------------------------------------------
  // Filtrado y Paginación de la Tabla de Historial
  // ------------------------------------------------------------------
  const q = normalizarBusqueda(search)
  const filteredMovimientos = useMemo(() => {
    return movimientos.filter((m) => {
      if (filtroTipo !== 'todos' && m.tipo_movimiento !== filtroTipo) {
        return false
      }
      if (q === '') return true
      const artNombre = m.articulo?.nombre ?? ''
      const resp = m.responsable_destino ?? ''
      const mot = m.motivo ?? ''
      const user = m.nombre_persona_registro ?? ''
      return (
        normalizarBusqueda(artNombre).includes(q) ||
        normalizarBusqueda(resp).includes(q) ||
        normalizarBusqueda(mot).includes(q) ||
        normalizarBusqueda(user).includes(q)
      )
    })
  }, [movimientos, filtroTipo, q])

  const totalPaginas = Math.max(1, Math.ceil(filteredMovimientos.length / MOVIMIENTOS_POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const primeraFila = (paginaActual - 1) * MOVIMIENTOS_POR_PAGINA
  const filasVisibles = filteredMovimientos.slice(
    primeraFila,
    primeraFila + MOVIMIENTOS_POR_PAGINA,
  )
  const numerosPagina = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  function manejarBusqueda(val: string) {
    setSearch(val)
    setPagina(1)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-primary-900">Movimientos de Stock</h1>
        <p className="text-sm text-primary-500">
          Control de entradas y salidas de bodega, cálculo reactivo de stock y kardex cronológico
        </p>
      </div>

      {/* Alerta de confirmación */}
      {confirmacion && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {confirmacion}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECCIÓN 1: FORMULARIO DE REGISTRO RÁPIDO (Entrada / Salida) */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-900">
            Registrar Movimiento de Inventario
          </h2>
          <p className="text-xs text-primary-500">
            Ingresa los datos para sumar o descontar materiales de la bodega en tiempo real
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de artículo con búsqueda predictiva */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <label className="block text-sm font-medium text-primary-700">
                Artículo / Material *
              </label>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Filtrar artículo por nombre..."
                  value={busquedaArticulo}
                  onChange={(e) => setBusquedaArticulo(e.target.value)}
                  className="w-full sm:w-1/3 rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
                />
                <select
                  value={articuloSeleccionadoId}
                  onChange={(e) => setArticuloSeleccionadoId(Number(e.target.value))}
                  className="w-full sm:w-2/3 rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
                >
                  {articulosFiltradosSelector.length === 0 ? (
                    <option value="">No hay artículos coincidentes</option>
                  ) : (
                    articulosFiltradosSelector.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre} (Stock actual: {a.cantidad_disponible} uds) &mdash; {a.ubicacion}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Toggle Entrada / Salida */}
            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-primary-700">
                Tipo de Operación *
              </label>
              <div className="mt-1 grid grid-cols-2 gap-1 rounded-lg border border-primary-200 bg-primary-50 p-1">
                <button
                  type="button"
                  onClick={() => setTipoMovimiento('entrada')}
                  className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
                    tipoMovimiento === 'entrada'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-primary-700 hover:text-primary-900'
                  }`}
                >
                  + Entrada (Ingreso)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoMovimiento('salida')}
                  className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
                    tipoMovimiento === 'salida'
                      ? 'bg-red-600 text-white shadow'
                      : 'text-primary-700 hover:text-primary-900'
                  }`}
                >
                  - Salida (Egreso)
                </button>
              </div>
            </div>
          </div>

          {/* Panel de Cálculo de Stock en Vivo */}
          {articuloActual && (
            <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                <div>
                  <span className="text-xs text-primary-500">Stock Actual en Bodega:</span>
                  <p className="font-mono font-bold text-base text-primary-900">
                    {stockActual} unidades
                  </p>
                </div>
                <div>
                  <span className="text-xs text-primary-500">
                    {tipoMovimiento === 'entrada' ? 'Ingreso a sumar (+):' : 'Egreso a descontar (-):'}
                  </span>
                  <p
                    className={`font-mono font-bold text-base ${
                      tipoMovimiento === 'entrada' ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {tipoMovimiento === 'entrada' ? '+' : '-'}
                    {cantNum} unidades
                  </p>
                </div>
                <div>
                  <span className="text-xs text-primary-500">Stock Proyectado Resultante:</span>
                  <p
                    className={`font-mono font-bold text-base ${
                      esSalidaInvalida ? 'text-red-600' : 'text-primary-900'
                    }`}
                  >
                    {stockResultante} unidades
                  </p>
                </div>
              </div>
              {esSalidaInvalida && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  ⚠️ No se puede registrar la salida: la cantidad ({cantNum} uds) supera el stock
                  disponible ({stockActual} uds).
                </p>
              )}
            </div>
          )}

          {/* Campos de Cantidad, Responsable y Destino */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-primary-700">Cantidad *</label>
              <input
                type="number"
                min={1}
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
              />
            </div>

            {tipoMovimiento === 'salida' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-primary-700">
                    Responsable que retira *
                  </label>
                  <input
                    type="text"
                    required
                    value={responsableRetira}
                    onChange={(e) => setResponsableRetira(e.target.value)}
                    placeholder="Ej. Fontanero Mario Solano"
                    className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700">
                    Ubicación / Destino del material *
                  </label>
                  <input
                    type="text"
                    required
                    value={ubicacionDestino}
                    onChange={(e) => setUbicacionDestino(e.target.value)}
                    placeholder="Ej. Reparación tubería Sector 3"
                    className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Motivo del movimiento *
            </label>
            <textarea
              rows={2}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Compra programada mensual / Reparación de fuga reportada en avería #14"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
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
              onClick={() => {
                setCantidad(1)
                setResponsableRetira('')
                setUbicacionDestino('')
                setMotivo('')
                setFormError(null)
              }}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={submitting || esSalidaInvalida || !articuloActual}
              className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Registrando...' : 'Confirmar Movimiento'}
            </button>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECCIÓN 2: TABLA DE HISTORIAL GENERAL DE MOVIMIENTOS */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-900">
              Historial General de Movimientos
            </h2>
            <p className="text-xs text-primary-500">
              {loading
                ? 'Cargando...'
                : `${filteredMovimientos.length} movimientos registrados en total`}
            </p>
          </div>

          {/* Filtros de Historial */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Buscador */}
            <div className="relative w-full sm:w-72">
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
                placeholder="Buscar por artículo o motivo..."
                value={search}
                onChange={(e) => manejarBusqueda(e.target.value)}
                className="w-full rounded-full border border-primary-200 py-2 pl-9 pr-8 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => manejarBusqueda('')}
                  title="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-primary-300 hover:bg-primary-100 hover:text-primary-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filtro por Tipo */}
            <select
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value as 'todos' | 'entrada' | 'salida')
                setPagina(1)
              }}
              className="rounded-full border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            >
              <option value="todos">Todos los tipos</option>
              <option value="entrada">Solo Entradas (+)</option>
              <option value="salida">Solo Salidas (-)</option>
            </select>
          </div>
        </div>

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
          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-primary-100 text-sm">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha y Hora</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Artículo</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Cantidad</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">
                    Destino / Responsable
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">
                    Registrado por
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, fila) => (
                    <tr key={`skeleton-${fila}`}>
                      {Array.from({ length: 7 }).map((__, col) => (
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
                ) : filteredMovimientos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
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
                            No encontramos movimientos para "{search}"
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
                          Aún no hay movimientos registrados en el inventario.
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filasVisibles.map((m) => (
                    <tr key={m.id} className="hover:bg-primary-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-primary-500 whitespace-nowrap">
                        {formatearFechaHora(m.fecha_movimiento)}
                      </td>
                      <td className="px-4 py-3 font-medium text-primary-900">
                        {m.articulo?.nombre || `Artículo #${m.articulo_id ?? ''}`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            m.tipo_movimiento === 'entrada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.tipo_movimiento === 'entrada' ? '+ Entrada' : '- Salida'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-primary-900 whitespace-nowrap">
                        {m.cantidad} uds
                      </td>
                      <td className="px-4 py-3 text-primary-600">
                        {m.responsable_destino || '—'}
                      </td>
                      <td className="px-4 py-3 text-primary-500 text-xs">
                        {m.nombre_persona_registro || 'Sistema'}
                      </td>
                      <td className="px-4 py-3 text-primary-700">{m.motivo}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Paginación */}
            {!loading && movimientos.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-primary-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-primary-500">
                  Mostrando{' '}
                  {filteredMovimientos.length === 0
                    ? 0
                    : `${primeraFila + 1}–${Math.min(
                        primeraFila + MOVIMIENTOS_POR_PAGINA,
                        filteredMovimientos.length,
                      )}`}{' '}
                  de {filteredMovimientos.length} movimientos
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
      </div>
    </div>
  )
}

export default MovimientosStock

