import { useState, useMemo } from 'react'
import { MOCK_SOLICITUDES, type Solicitud, type HistorialCambio } from '../../lib/mockData'
import { useAuth } from '../../contexts/AuthContext'

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Aprobada: 'bg-green-100 text-green-700',
  Rechazada: 'bg-red-100 text-red-700',
  Completada: 'bg-blue-100 text-blue-700',
}

function Solicitudes() {
  const { user } = useAuth()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(MOCK_SOLICITUDES)
  const [filter, setFilter] = useState('Todas')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewDetail, setViewDetail] = useState<Solicitud | null>(null)

  const filtered = useMemo(() => {
    let result =
      filter === 'Todas'
        ? [...solicitudes]
        : solicitudes.filter((s) => s.estado === filter)
    result.sort((a, b) => {
      if (sortOrder === 'asc') return a.fecha.localeCompare(b.fecha)
      return b.fecha.localeCompare(a.fecha)
    })
    return result
  }, [solicitudes, filter, sortOrder])

  function cambiarEstado(id: string, nuevoEstado: Solicitud['estado']) {
    setSolicitudes((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const cambio: HistorialCambio = {
          fecha: new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }),
          estadoAnterior: s.estado,
          estadoNuevo: nuevoEstado,
          realizadoPor: user?.nombre ?? 'Sistema',
          observacion: `Cambio de estado: ${s.estado} → ${nuevoEstado}`,
        }
        return { ...s, estado: nuevoEstado, historial: [...s.historial, cambio] }
      }),
    )
  }

  function DetailModal() {
    if (!viewDetail) return null
    const s = viewDetail
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">
              {s.codigo} - {s.tipo}
            </h2>
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

          <div className="space-y-5">
            <div>
              <h3 className="mb-3 text-base font-semibold text-primary-900">
                Información del Solicitante
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg bg-primary-50 p-4 text-sm">
                <span className="font-medium text-primary-700">Nombre:</span>
                <span className="text-primary-900">{s.solicitante}</span>
                <span className="font-medium text-primary-700">Cédula:</span>
                <span className="font-mono text-primary-900">{s.cedula}</span>
                <span className="font-medium text-primary-700">Teléfono:</span>
                <span className="text-primary-900">{s.telefono}</span>
                <span className="font-medium text-primary-700">Correo:</span>
                <span className="text-primary-900">{s.correo}</span>
                <span className="font-medium text-primary-700">Dirección:</span>
                <span className="text-primary-900">{s.direccion}</span>
                <span className="font-medium text-primary-700">Tipo de solicitud:</span>
                <span className="text-primary-900">{s.tipo}</span>
                <span className="font-medium text-primary-700">Fecha de solicitud:</span>
                <span className="text-primary-900">{s.fecha}</span>
                <span className="font-medium text-primary-700">Estado actual:</span>
                <span>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLORS[s.estado]}`}>
                    {s.estado}
                  </span>
                </span>
                <span className="font-medium text-primary-700">Notificado:</span>
                <span className={s.notificado ? 'text-green-600' : 'text-primary-400'}>
                  {s.notificado ? 'S\u00ed' : 'No'}
                </span>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-base font-semibold text-primary-900">
                Detalle de la Solicitud
              </h3>
              <p className="rounded-lg bg-primary-50 p-4 text-sm text-primary-700">
                {s.detalle}
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-base font-semibold text-primary-900">
                Historial de Cambios
              </h3>
              {s.historial.length === 0 ? (
                <p className="text-sm text-primary-400">Sin cambios registrados.</p>
              ) : (
                <div className="space-y-3">
                  {[...s.historial].reverse().map((h, i) => (
                    <div key={i} className="flex gap-3 rounded-lg border border-primary-100 bg-white p-3 text-sm">
                      <div className="mt-0.5 flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary-400" />
                        {i < s.historial.length - 1 && (
                          <div className="h-full w-px bg-primary-200" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold
                            ${h.estadoNuevo === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : ''}
                            ${h.estadoNuevo === 'Aprobada' ? 'bg-green-100 text-green-700' : ''}
                            ${h.estadoNuevo === 'Rechazada' ? 'bg-red-100 text-red-700' : ''}
                            ${h.estadoNuevo === 'Completada' ? 'bg-blue-100 text-blue-700' : ''}
                          `}>
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
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Solicitudes
        </h1>
        <p className="mt-1 text-sm text-primary-500">
          {solicitudes.length} solicitudes registradas
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex h-10 items-center gap-1 rounded-lg bg-primary-700 px-4 text-sm font-medium text-white hover:bg-primary-800"
        >
          {sortOrder === 'asc' ? '\u2191 M\u00e1s antiguas' : '\u2193 M\u00e1s recientes'}
        </button>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 rounded-lg border border-primary-200 px-3 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
        >
          <option value="Todas">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Aprobada">Aprobada</option>
          <option value="Rechazada">Rechazada</option>
          <option value="Completada">Completada</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-primary-100 text-sm">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Código</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Solicitante</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Cédula</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Notificado</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-primary-400">
                  No hay solicitudes con ese estado.
                </td>
              </tr>
            ) : (
              filtered.map((sol: Solicitud) => (
                <tr key={sol.id} className="hover:bg-primary-50/50">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-primary-700">
                    {sol.codigo}
                  </td>
                  <td className="px-4 py-3 text-primary-900">{sol.tipo}</td>
                  <td className="px-4 py-3 text-primary-700">{sol.solicitante}</td>
                  <td className="px-4 py-3 font-mono text-primary-500">{sol.cedula}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <select
                        value={sol.estado}
                        onChange={(e) =>
                          cambiarEstado(sol.id, e.target.value as Solicitud['estado'])
                        }
                        className={`cursor-pointer appearance-none rounded-full px-3 py-1 pr-7 text-xs font-semibold outline-none ${ESTADO_COLORS[sol.estado]}`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Aprobada">Aprobada</option>
                        <option value="Rechazada">Rechazada</option>
                        <option value="Completada">Completada</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-primary-500">{sol.fecha}</td>
                  <td className="px-4 py-3">
                    {sol.notificado ? (
                      <span className="text-green-600">Sí</span>
                    ) : (
                      <span className="text-primary-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setViewDetail(sol)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DetailModal />
    </div>
  )
}

export default Solicitudes