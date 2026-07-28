import { useState } from 'react'
import { MOCK_ABONADOS, type Abonado } from '../../lib/mockData'

function Abonados() {
  const [search, setSearch] = useState('')

  const filtered = MOCK_ABONADOS.filter(
    (a) =>
      a.nombre.toLowerCase().includes(search.toLowerCase()) ||
      a.cedula.includes(search),
  )

  const getEstadoBadge = (estado: string) => {
    const base = 'inline-block rounded-full px-3 py-1 text-xs font-semibold'
    if (estado === 'Activo') return `${base} bg-green-100 text-green-700`
    return `${base} bg-red-100 text-red-700`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-primary-900">
            Gestión de Abonados
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            {MOCK_ABONADOS.length} abonados registrados
          </p>
        </div>
        <button
          type="button"
          className="self-start rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
        >
          + Nuevo abonado
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre o cédula..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none sm:w-80"
      />

      <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-primary-100 text-sm">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Cédula</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Teléfono</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Correo</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Registro</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-primary-400">
                  No se encontraron abonados.
                </td>
              </tr>
            ) : (
              filtered.map((abonado: Abonado) => (
                <tr key={abonado.id} className="hover:bg-primary-50/50">
                  <td className="px-4 py-3 font-mono text-primary-700">{abonado.cedula}</td>
                  <td className="px-4 py-3 font-medium text-primary-900">{abonado.nombre}</td>
                  <td className="px-4 py-3 text-primary-600">{abonado.telefono}</td>
                  <td className="px-4 py-3 text-primary-600">{abonado.correo}</td>
                  <td className="px-4 py-3">
                    <span className={getEstadoBadge(abonado.estado)}>{abonado.estado}</span>
                  </td>
                  <td className="px-4 py-3 text-primary-500">{abonado.fechaRegistro}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      Editar
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

export default Abonados
