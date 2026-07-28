import { useState } from 'react'
import { MOCK_AVERIAS_ADMIN, type AveriaAdmin } from '../../lib/mockData'

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Asignada: 'bg-blue-100 text-blue-700',
  'En progreso': 'bg-indigo-100 text-indigo-700',
  Resuelta: 'bg-green-100 text-green-700',
}

function AveriasAdmin() {
  const [filter, setFilter] = useState('Todas')

  const filtered =
    filter === 'Todas'
      ? MOCK_AVERIAS_ADMIN
      : MOCK_AVERIAS_ADMIN.filter((a) => a.estado === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-primary-900">
            Reportes de Averías
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            {MOCK_AVERIAS_ADMIN.length} reportes · Vista administrativa
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
        >
          <option value="Todas">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Asignada">Asignada</option>
          <option value="En progreso">En progreso</option>
          <option value="Resuelta">Resuelta</option>
        </select>
      </div>

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
              filtered.map((averia: AveriaAdmin) => (
                <tr key={averia.id} className="hover:bg-primary-50/50">
                  <td className="px-4 py-3 font-medium text-primary-900">{averia.tipo}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-primary-600" title={averia.descripcion}>
                    {averia.descripcion}
                  </td>
                  <td className="px-4 py-3 text-primary-700">{averia.reportadoPor}</td>
                  <td className="px-4 py-3 font-mono text-primary-500">{averia.cedula}</td>
                  <td className="px-4 py-3 text-primary-500">{averia.fecha}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLORS[averia.estado]}`}>
                      {averia.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-primary-600">
                    {averia.fontaneroAsignado || <span className="text-primary-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      Asignar
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

export default AveriasAdmin
