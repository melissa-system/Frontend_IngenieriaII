import { useState, useEffect, useMemo } from 'react'
import {
  obtenerAverias,
  actualizarAveria,
  type AveriaBackend,
} from '../../components/Services/averias.service'
import { obtenerEmpleados } from '../../components/Services/empleados.service'
import { useAuth } from '../../contexts/AuthContext'

const POR_PAGINA = 10

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  'En proceso': 'bg-indigo-100 text-indigo-700',
  Finalizado: 'bg-green-100 text-green-700',
}

function normalizarBusqueda(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function AveriasAdmin() {
  const { user } = useAuth()

  const [averias, setAverias] = useState<AveriaBackend[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [pagina, setPagina] = useState(1)
  const [filter, setFilter] = useState('Todas')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [viewDetail, setViewDetail] = useState<AveriaBackend | null>(null)
  const [gestionModal, setGestionModal] = useState<AveriaBackend | null>(null)

  const [asignarFontanero, setAsignarFontanero] = useState('')
  const [asignarObs, setAsignarObs] = useState('')
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [empleados, setEmpleados] = useState<Array<{ id: number; nombre: string; cedula: string; puesto: string }>>([])
  const [procesando, setProcesando] = useState(false)

  const cargarAverias = async () => {
    try {
      setCargando(true)
      setErrorCarga(null)
      setAverias(await obtenerAverias())
    } catch (err) {
      setErrorCarga(err instanceof Error ? err.message : 'Error al cargar las averías')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarAverias()
    obtenerEmpleados()
      .then((data) => setEmpleados(data.filter((e) => e.puesto === 'Fontanero' || e.puesto === 'Administrador')))
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    let result = filter === 'Todas' ? [...averias] : averias.filter((a) => a.estado === filter)

    if (search.trim()) {
      const q = normalizarBusqueda(search)
      result = result.filter((a) => {
        const nombre = `${a.nombre_reportante} ${a.apellido1_reportante || ''}`.trim()
        const campos = [a.codigo_averia, a.tipo_averia, nombre, a.cedula_reportante, a.descripcion]
        return campos.some((c) => normalizarBusqueda(c).includes(q))
      })
    }

    result.sort((a, b) => {
      const fa = new Date(a.fecha_reporte).getTime()
      const fb = new Date(b.fecha_reporte).getTime()
      return sortOrder === 'asc' ? fa - fb : fb - fa
    })
    return result
  }, [averias, filter, sortOrder, search])

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const primeraFila = (paginaActual - 1) * POR_PAGINA
  const filasVisibles = filtered.slice(primeraFila, primeraFila + POR_PAGINA)
  const numerosPagina = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  function manejarBusqueda(valor: string) {
    setSearch(valor)
    setPagina(1)
  }

  async function handleGestionar() {
    if (!gestionModal) return
    try {
      setProcesando(true)

      const emp = empleados.find((e) => e.nombre === asignarFontanero)
      const payload: Record<string, unknown> = { realizado_por: user?.nombre ?? 'Sistema' }

      if (emp) {
        payload.empleado_id = emp.id
        if (asignarObs) payload.observacion = asignarObs
      } else if (asignarObs) {
        payload.observacion = asignarObs
      }

      if (nuevoEstado) {
        payload.estado = nuevoEstado
      }

      await actualizarAveria(gestionModal.id, payload)
      await cargarAverias()
    } catch {
      // error manejado en servicio
    } finally {
      setProcesando(false)
      setGestionModal(null)
      setAsignarFontanero('')
      setAsignarObs('')
      setNuevoEstado('')
    }
  }

  const modalBgCls = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
  const modalCls = 'max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl'

  function nombreReportante(a: AveriaBackend) {
    return `${a.nombre_reportante} ${a.apellido1_reportante || ''} ${a.apellido2_reportante || ''}`.trim()
  }

  function nombreFontanero(a: AveriaBackend) {
    if (!a.empleado) return null
    return `${a.empleado.nombre} ${a.empleado.apellido1 || ''} ${a.empleado.apellido2 || ''}`.trim()
  }

  // ─── Modal de Detalle (Ver) ────────────────────────────────────
  function DetailModal() {
    if (!viewDetail) return null
    const a = viewDetail
    const fontanero = nombreFontanero(a)
    return (
      <div className={modalBgCls}>
        <div className={modalCls}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">{a.tipo_averia}</h2>
            <button type="button" onClick={() => setViewDetail(null)}
              className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg bg-primary-50 p-4 text-sm">
              <span className="font-medium text-primary-700">Código:</span>
              <span className="font-mono text-primary-900">{a.codigo_averia}</span>
              <span className="font-medium text-primary-700">Tipo:</span>
              <span className="text-primary-900">{a.tipo_averia}</span>
              <span className="font-medium text-primary-700">Descripción:</span>
              <span className="text-primary-900">{a.descripcion}</span>
              <span className="font-medium text-primary-700">Reportado por:</span>
              <span className="text-primary-900">{nombreReportante(a)}</span>
              <span className="font-medium text-primary-700">Cédula:</span>
              <span className="font-mono text-primary-900">{a.cedula_reportante}</span>
              {a.ubicacion && (
                <>
                  <span className="font-medium text-primary-700">Ubicación:</span>
                  <span className="text-primary-900">{a.ubicacion}</span>
                </>
              )}
              <span className="font-medium text-primary-700">Fecha del reporte:</span>
              <span className="text-primary-900">
                {new Date(a.fecha_reporte).toLocaleDateString('es-CR', { timeZone: 'America/Costa_Rica' })}
              </span>
              <span className="font-medium text-primary-700">Estado actual:</span>
              <span>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLORS[a.estado]}`}>
                  {a.estado}
                </span>
              </span>
              <span className="font-medium text-primary-700">Fontanero:</span>
              <span className="text-primary-900">{fontanero || <span className="text-primary-400">Sin asignar</span>}</span>
            </div>

            {a.imagen_url && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-primary-900">Evidencia Fotográfica</h3>
                <img src={a.imagen_url} alt="Evidencia" className="h-40 w-40 rounded-lg object-cover" />
              </div>
            )}

            <div>
              <h3 className="mb-3 text-sm font-semibold text-primary-900">Historial de Cambios</h3>
              {a.historial.length === 0 ? (
                <p className="text-sm text-primary-400">Sin cambios registrados.</p>
              ) : (
                <div className="space-y-3">
                  {[...a.historial].reverse().map((h, i) => (
                    <div key={i} className="flex gap-3 rounded-lg border border-primary-100 bg-white p-3 text-sm">
                      <div className="mt-0.5 flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary-400" />
                        {i < a.historial.length - 1 && <div className="h-full w-px bg-primary-200" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {h.estado_anterior && (
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_COLORS[h.estado_anterior] || 'bg-gray-100 text-gray-600'}`}>
                              {h.estado_anterior}
                            </span>
                          )}
                          {h.estado_anterior && <span className="text-xs text-primary-400">\</span>}
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_COLORS[h.estado_nuevo]}`}>
                            {h.estado_nuevo}
                          </span>
                          <span className="text-xs text-primary-400">
                            {new Date(h.fecha).toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' })}
                          </span>
                        </div>
                        {h.observacion && <p className="text-primary-700">{h.observacion}</p>}
                        <p className="text-xs text-primary-400">Por: {h.realizado_por}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={() => setViewDetail(null)}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Modal de Gestión (asignar fontanero + cambiar estado) ──────
  function GestionModal() {
    if (!gestionModal) return null
    const a = gestionModal
    const esPendiente = a.estado === 'Pendiente'
    const fontaneroActual = nombreFontanero(a)

    return (
      <div className={modalBgCls}>
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">Gestionar Avería</h2>
            <button type="button" onClick={() => { setGestionModal(null); setAsignarFontanero(''); setAsignarObs(''); setNuevoEstado('') }}
              className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 rounded-lg bg-primary-50 p-3 text-sm">
            <p><span className="font-medium text-primary-700">Avería:</span> {a.tipo_averia}</p>
            <p><span className="font-medium text-primary-700">Reportado por:</span> {nombreReportante(a)}</p>
            <p><span className="font-medium text-primary-700">Estado actual:</span> <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_COLORS[a.estado]}`}>{a.estado}</span></p>
            {fontaneroActual && (
              <p><span className="font-medium text-primary-700">Fontanero actual:</span> {fontaneroActual}</p>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-700">Cambiar estado</label>
              <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}
                className="mt-1 w-full rounded-full border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none">
                <option value="">Mantener: {a.estado}</option>
                {['Pendiente', 'En proceso', 'Finalizado']
                  .filter((e) => e !== a.estado)
                  .map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
              </select>
            </div>

            {esPendiente && (
              <div>
                <label className="block text-sm font-medium text-primary-700">Asignar Fontanero</label>
                <select value={asignarFontanero} onChange={(e) => setAsignarFontanero(e.target.value)}
                  className="mt-1 w-full rounded-full border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none">
                  <option value="">Seleccionar fontanero...</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.nombre}>{emp.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-primary-700">Observaciones</label>
              <textarea value={asignarObs} onChange={(e) => setAsignarObs(e.target.value)}
                rows={3} placeholder="Notas o instrucciones..."
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={handleGestionar} disabled={procesando}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50">
              {procesando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={() => { setGestionModal(null); setAsignarFontanero(''); setAsignarObs(''); setNuevoEstado('') }}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Loading / Error states ────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-primary-500">Cargando averías...</p>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">{errorCarga}</p>
        <button type="button" onClick={cargarAverias}
          className="mt-3 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
          Reintentar
        </button>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Barra de búsqueda + filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-96">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="Buscar por código, tipo, reportante o cédula..."
            value={search} onChange={(e) => manejarBusqueda(e.target.value)}
            className="w-full rounded-lg border border-primary-200 py-2.5 pl-10 pr-9 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" />
          {search && (
            <button type="button" onClick={() => manejarBusqueda('')} title="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-primary-300 hover:bg-primary-100 hover:text-primary-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex h-10 items-center gap-1 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50">
            {sortOrder === 'asc' ? '↑ Más antiguas' : '↓ Más recientes'}
          </button>
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPagina(1) }}
            className="h-10 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none">
            <option value="Todas">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Finalizado">Finalizado</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-primary-100 text-sm">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Código</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Reportado por</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Cédula</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Descripción</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-50">
            {filasVisibles.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-primary-400">
                  No hay averías con ese filtro.
                </td>
              </tr>
            ) : (
              filasVisibles.map((a) => (
                <tr key={a.id} className="hover:bg-primary-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-primary-500">{a.codigo_averia}</td>
                  <td className="px-4 py-3 font-medium text-primary-900">{a.tipo_averia}</td>
                  <td className="px-4 py-3 text-primary-700">{nombreReportante(a)}</td>
                  <td className="px-4 py-3 font-mono text-primary-500">{a.cedula_reportante}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-primary-600" title={a.descripcion}>{a.descripcion}</td>
                  <td className="px-4 py-3 text-primary-500">
                    {new Date(a.fecha_reporte).toLocaleDateString('es-CR', { timeZone: 'America/Costa_Rica' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLORS[a.estado]}`}>
                      {a.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setViewDetail(a)}
                        className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50">
                        Ver
                      </button>
                      {a.estado !== 'Finalizado' && (
                        <button type="button" onClick={() => setGestionModal(a)}
                          className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50">
                          Gestionar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {averias.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-primary-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-primary-500">
              Mostrando{' '}
              {filtered.length === 0
                ? 0
                : `${primeraFila + 1}–${Math.min(primeraFila + POR_PAGINA, filtered.length)}`}{' '}
              de {filtered.length} reportes
              {search ? ` (filtro: "${search}")` : ''}
            </p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPagina(paginaActual - 1)} disabled={paginaActual === 1}
                className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40">
                ‹ Anterior
              </button>
              {numerosPagina.map((n) => (
                <button key={n} type="button" onClick={() => setPagina(n)} disabled={n === paginaActual}
                  aria-current={n === paginaActual ? 'page' : undefined}
                  className={`h-7 min-w-[28px] rounded-lg px-2 text-xs font-medium ${
                    n === paginaActual ? 'bg-primary-700 text-white' : 'text-primary-700 hover:bg-primary-50'
                  }`}>
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => setPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}
                className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40">
                Siguiente ›
              </button>
            </div>
          </div>
        )}
      </div>

      <DetailModal />
      <GestionModal />
    </div>
  )
}

export default AveriasAdmin
