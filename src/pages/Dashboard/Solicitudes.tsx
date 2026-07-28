import { useState } from 'react'
import { MOCK_SOLICITUDES, type Solicitud } from '../../lib/mockData'

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Aprobada: 'bg-green-100 text-green-700',
  Rechazada: 'bg-red-100 text-red-700',
  Completada: 'bg-blue-100 text-blue-700',
}

function Solicitudes() {
  const [filter, setFilter] = useState('Todas')

  const filtered =
    filter === 'Todas'
      ? MOCK_SOLICITUDES
      : MOCK_SOLICITUDES.filter((s) => s.estado === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-primary-900">
            Solicitudes
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            {MOCK_SOLICITUDES.length} solicitudes registradas
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
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
                  <td className="px-4 py-3 font-mono text-sm font-medium text-primary-700">{sol.codigo}</td>
                  <td className="px-4 py-3 text-primary-900">{sol.tipo}</td>
                  <td className="px-4 py-3 text-primary-700">{sol.solicitante}</td>
                  <td className="px-4 py-3 font-mono text-primary-500">{sol.cedula}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLORS[sol.estado]}`}>
                      {sol.estado}
                    </span>
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
    </div>
  )
}

export default Solicitudes
