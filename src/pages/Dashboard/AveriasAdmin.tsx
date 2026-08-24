import { useState, useMemo } from 'react'
import {
  MOCK_AVERIAS_ADMIN, FONTANEROS_DISPONIBLES,
  type AveriaAdmin, type HistorialAveria, type ObservacionAveria,
} from '../../lib/mockData'
import { useAuth } from '../../contexts/AuthContext'

const ESTADO_FLUJO: Record<string, string[]> = {
  Pendiente: ['Asignada'],
  Asignada: ['En progreso'],
  'En progreso': ['Resuelta'],
  Resuelta: [],
}

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Asignada: 'bg-blue-100 text-blue-700',
  'En progreso': 'bg-indigo-100 text-indigo-700',
  Resuelta: 'bg-green-100 text-green-700',
}

function AveriasAdmin() {
  const { user } = useAuth()
  const [averias, setAverias] = useState<AveriaAdmin[]>(MOCK_AVERIAS_ADMIN)
  const [filter, setFilter] = useState('Todas')
  const [viewDetail, setViewDetail] = useState<AveriaAdmin | null>(null)
  const [assignModal, setAssignModal] = useState<AveriaAdmin | null>(null)
  const [confirmEstado, setConfirmEstado] = useState<{ id: string; nuevo: string } | null>(null)
  const [asignarFontanero, setAsignarFontanero] = useState('')
  const [asignarObs, setAsignarObs] = useState('')

  const filtered = useMemo(() => {
    return filter === 'Todas'
      ? averias
      : averias.filter((a) => a.estado === filter)
  }, [averias, filter])

  function cambiarEstado(id: string, nuevoEstado: string) {
    setAverias((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const cambio: HistorialAveria = {
          fecha: new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }),
          estadoAnterior: a.estado,
          estadoNuevo: nuevoEstado,
          realizadoPor: user?.nombre ?? 'Sistema',
          observacion: `Estado cambiado: ${a.estado} \u2192 ${nuevoEstado}`,
        }
        return { ...a, estado: nuevoEstado as AveriaAdmin['estado'], historial: [...a.historial, cambio] }
      }),
    )
    setConfirmEstado(null)
  }

  function handleAssign() {
    if (!assignModal || !asignarFontanero) return
    setAverias((prev) =>
      prev.map((a) => {
        if (a.id !== assignModal.id) return a
        const cambio: HistorialAveria = {
          fecha: new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }),
          estadoAnterior: a.estado,
          estadoNuevo: 'Asignada',
          realizadoPor: user?.nombre ?? 'Sistema',
          observacion: `Asignado a ${asignarFontanero}. ${asignarObs ? 'Obs: ' + asignarObs : ''}`,
        }
        const obs: ObservacionAveria = {
          fecha: new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }),
          texto: `Asignaci\u00f3n: ${asignarFontanero}${asignarObs ? ' - ' + asignarObs : ''}`,
          realizadoPor: user?.nombre ?? 'Sistema',
        }
        return {
          ...a,
          fontaneroAsignado: asignarFontanero,
          estado: 'Asignada',
          historial: [...a.historial, cambio],
          observaciones: [...a.observaciones, obs],
        }
      }),
    )
    setAssignModal(null)
    setAsignarFontanero('')
    setAsignarObs('')
  }

  const modalBgCls = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40'
  const modalCls = 'max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl'

  function DetailModal() {
    if (!viewDetail) return null
    const a = viewDetail
    return (
      <div className={modalBgCls}>
        <div className={modalCls}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">
              {a.tipo}
            </h2>
            <button type="button" onClick={() => setViewDetail(null)}
              className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="mb-3 text-base font-semibold text-primary-900">
                Información del Reporte
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg bg-primary-50 p-4 text-sm">
                <span className="font-medium text-primary-700">Tipo:</span>
                <span className="text-primary-900">{a.tipo}</span>
                <span className="font-medium text-primary-700">Descripción:</span>
                <span className="text-primary-900">{a.descripcion}</span>
                <span className="font-medium text-primary-700">Reportado por:</span>
                <span className="text-primary-900">{a.reportadoPor}</span>
                <span className="font-medium text-primary-700">Cédula:</span>
                <span className="font-mono text-primary-900">{a.cedula}</span>
                <span className="font-medium text-primary-700">Teléfono:</span>
                <span className="text-primary-900">{a.telefono}</span>
                <span className="font-medium text-primary-700">Correo:</span>
                <span className="text-primary-900">{a.correo}</span>
                <span className="font-medium text-primary-700">Dirección:</span>
                <span className="text-primary-900">{a.direccion}</span>
                <span className="font-medium text-primary-700">Fecha del reporte:</span>
                <span className="text-primary-900">{a.fecha}</span>
                <span className="font-medium text-primary-700">Estado actual:</span>
                <span>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLORS[a.estado]}`}>
                    {a.estado}
                  </span>
                </span>
                <span className="font-medium text-primary-700">Fontanero asignado:</span>
                <span className="text-primary-900">{a.fontaneroAsignado || <span className="text-primary-400">Sin asignar</span>}</span>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-base font-semibold text-primary-900">
                Historial de Cambios
              </h3>
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
                          {h.estadoAnterior && (
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_COLORS[h.estadoAnterior] || 'bg-gray-100 text-gray-600'}`}>
                              {h.estadoAnterior}
                            </span>
                          )}
                          {h.estadoAnterior && <span className="text-xs text-primary-400">\</span>}
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_COLORS[h.estadoNuevo]}`}>
                            {h.estadoNuevo}
                          </span>
                          <span className="text-xs text-primary-400">{h.fecha}</span>
                        </div>
                        <p className="text-primary-700">{h.observacion}</p>
                        <p className="text-xs text-primary-400">Por: {h.realizadoPor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-base font-semibold text-primary-900">
                Observaciones Registradas
              </h3>
              {a.observaciones.length === 0 ? (
                <p className="text-sm text-primary-400">Sin observaciones registradas.</p>
              ) : (
                <div className="space-y-2">
                  {[...a.observaciones].reverse().map((o, i) => (
                    <div key={i} className="rounded-lg border border-primary-100 bg-white p-3 text-sm">
                      <p className="text-primary-700">{o.texto}</p>
                      <p className="mt-1 text-xs text-primary-400">{o.fecha} &middot; {o.realizadoPor}</p>
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

  function AssignModal() {
    if (!assignModal) return null
    const a = assignModal
    return (
      <div className={modalBgCls}>
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">
              Asignar Fontanero
            </h2>
            <button type="button" onClick={() => { setAssignModal(null); setAsignarFontanero(''); setAsignarObs('') }}
              className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 rounded-lg bg-primary-50 p-3 text-sm">
            <p><span className="font-medium text-primary-700">Avería:</span> {a.tipo}</p>
            <p><span className="font-medium text-primary-700">Reportado por:</span> {a.reportadoPor}</p>
            <p><span className="font-medium text-primary-700">Descripción:</span> {a.descripcion}</p>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Fontanero
              </label>
              <select value={asignarFontanero} onChange={(e) => setAsignarFontanero(e.target.value)}
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none">
                <option value="">Seleccionar fontanero...</option>
                {FONTANEROS_DISPONIBLES.filter((f) => f !== a.fontaneroAsignado || !a.fontaneroAsignado).map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Observaciones
              </label>
              <textarea value={asignarObs} onChange={(e) => setAsignarObs(e.target.value)}
                rows={3} placeholder="Instrucciones o comentarios para el fontanero..."
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={handleAssign} disabled={!asignarFontanero}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50">
              Asignar y cambiar a &quot;Asignada&quot;
            </button>
            <button type="button" onClick={() => { setAssignModal(null); setAsignarFontanero(''); setAsignarObs('') }}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  function ConfirmDialog() {
    if (!confirmEstado) return null
    const a = averias.find((x) => x.id === confirmEstado.id)
    if (!a) return null
    return (
      <div className={modalBgCls}>
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 shrink-0 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
            <h2 className="text-lg font-semibold text-primary-900">
              Confirmar cambio de estado
            </h2>
          </div>
          <p className="mt-3 text-sm text-primary-600">
            ¿Está seguro de cambiar? <span className="font-semibold">{a.tipo}</span> de <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_COLORS[a.estado]}`}>{a.estado}</span> a <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_COLORS[confirmEstado.nuevo]}`}>{confirmEstado.nuevo}</span>?
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => cambiarEstado(confirmEstado.id, confirmEstado.nuevo)}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
              Confirmar
            </button>
            <button type="button" onClick={() => setConfirmEstado(null)}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Reportes de Averías
        </h1>
        <p className="mt-1 text-sm text-primary-500">
          {averias.length} reportes &middot; Vista administrativa
        </p>
      </div>

      <select value={filter} onChange={(e) => setFilter(e.target.value)}
        className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none">
        <option value="Todas">Todos los estados</option>
        <option value="Pendiente">Pendiente</option>
        <option value="Asignada">Asignada</option>
        <option value="En progreso">En progreso</option>
        <option value="Resuelta">Resuelta</option>
      </select>

      <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-primary-100 text-sm">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Descripción</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Reportado por</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Cédula</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Fontanero</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-primary-400">
                  No hay averías con ese estado.
                </td>
              </tr>
            ) : (
              filtered.map((averia) => {
                const siguientes = ESTADO_FLUJO[averia.estado] ?? []
                return (
                  <tr key={averia.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-900">
                      <button type="button" onClick={() => setViewDetail(averia)}
                        className="text-left hover:text-primary-700 hover:underline">
                        {averia.tipo}
                      </button>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-primary-600" title={averia.descripcion}>
                      {averia.descripcion}
                    </td>
                    <td className="px-4 py-3 text-primary-700">{averia.reportadoPor}</td>
                    <td className="px-4 py-3 font-mono text-primary-500">{averia.cedula}</td>
                    <td className="px-4 py-3 text-primary-500">{averia.fecha}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLORS[averia.estado]}`}>
                          {averia.estado}
                        </span>
                        {siguientes.length > 0 && (
                          <button type="button"
                            onClick={() => setConfirmEstado({ id: averia.id, nuevo: siguientes[0] })}
                            className="rounded-md p-1 text-primary-400 transition-colors hover:bg-primary-100 hover:text-primary-700"
                            title={`Avanzar a ${siguientes[0]}`}>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-primary-600">
                      {averia.fontaneroAsignado || <span className="text-primary-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {averia.estado === 'Pendiente' && (
                          <button type="button" onClick={() => setAssignModal(averia)}
                            className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline">
                            Asignar
                          </button>
                        )}
                        <button type="button" onClick={() => setViewDetail(averia)}
                          className="text-sm font-medium text-primary-500 hover:text-primary-700 hover:underline">
                          Detalle
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

      <DetailModal />
      <AssignModal />
      <ConfirmDialog />
    </div>
  )
}

export default AveriasAdmin
