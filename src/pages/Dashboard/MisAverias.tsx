import { useEffect, useState } from 'react'
import { obtenerMisAverias, type AveriaBackend } from '../../components/Services/averias.service'
import Modal from '../../components/ui/Modal'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  'En proceso': 'bg-indigo-100 text-indigo-700',
  Finalizado: 'bg-green-100 text-green-700',
}

function nombreFontanero(a: AveriaBackend) {
  if (!a.empleado) return null
  return `${a.empleado.nombre} ${a.empleado.apellido1 || ''} ${a.empleado.apellido2 || ''}`.trim()
}

function MisAverias() {
  const [averias, setAverias] = useState<AveriaBackend[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<AveriaBackend | null>(null)

  useEffect(() => {
    obtenerMisAverias()
      .then(setAverias)
      .catch((err) => setErrorCarga(err instanceof Error ? err.message : 'Error al cargar las averías'))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-primary-500">Cargando tus averías…</p>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">{errorCarga}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">Mis reportes de averías</h1>
        <p className="mt-1 text-sm text-primary-500">
          Consultá el estado de los reportes de averías que realizaste.
        </p>
      </div>

      {averias.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 bg-white py-16 text-center shadow-sm">
          <p className="text-lg font-medium text-primary-700">Aún no tenés reportes de averías</p>
          <p className="mt-1 text-sm text-primary-400">
            Tus reportes aparecerán aquí junto con su estado.
          </p>
        </div>
      ) : (
        <Table cabecera={['Código', 'Tipo', 'Descripción', 'Estado', 'Fontanero', 'Fecha', 'Acciones']}>
              {averias.map((a) => (
                <tr key={a.id} className="hover:bg-primary-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-primary-500">{a.codigo_averia}</td>
                  <td className="px-4 py-3 font-medium text-primary-900">{a.tipo_averia}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-primary-600" title={a.descripcion}>{a.descripcion}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLORS[a.estado]}`}>
                      {a.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-primary-600">{nombreFontanero(a) || <span className="text-primary-400">Sin asignar</span>}</td>
                  <td className="px-4 py-3 text-primary-500">
                    {new Date(a.fecha_reporte).toLocaleDateString('es-CR', { timeZone: 'America/Costa_Rica' })}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="secondary" size="sm" type="button" onClick={() => setDetalle(a)}>
                      Ver detalle
                    </Button>
                  </td>
                </tr>
              ))}
            </Table>
      )}

      {detalle && <DetalleModal averia={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}

function DetalleModal({ averia, onClose }: { averia: AveriaBackend; onClose: () => void }) {
  const a = averia
  const fontanero = nombreFontanero(a)

  return (
    <Modal size="2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary-900">{a.tipo_averia}</h2>
          <button type="button" onClick={onClose}
            className="rounded-full p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700">
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
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_COLORS[h.estado_anterior] || 'bg-primary-100 text-primary-600'}`}>
                            {h.estado_anterior}
                          </span>
                        )}
                        {h.estado_anterior && <span className="text-xs text-primary-400">→</span>}
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
          <Button variant="primary" type="button" onClick={onClose}>
            Cerrar
          </Button>
        </div>
</Modal>
  )
}

export default MisAverias
