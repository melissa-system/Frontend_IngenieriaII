import { MOCK_INVENTARIO } from '../../lib/mockData'

function Inventario() {
  const stockBajo = MOCK_INVENTARIO.filter((i) => i.stock <= i.stockMinimo)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-primary-900">
            Inventario
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            {MOCK_INVENTARIO.length} items registrados · {stockBajo.length} con stock bajo
          </p>
        </div>
        <button
          type="button"
          className="self-start rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
        >
          + Agregar item
        </button>
      </div>

      {stockBajo.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-semibold text-yellow-800">
            ⚠️ Alerta de stock bajo
          </p>
          <ul className="mt-2 space-y-1">
            {stockBajo.map((item) => (
              <li key={item.id} className="text-sm text-yellow-700">
                {item.nombre} — Stock actual: {item.stock} (mínimo: {item.stockMinimo})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-primary-100 text-sm">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Categoría</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Proveedor</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Stock</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Mínimo</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Ubicación</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-50">
            {MOCK_INVENTARIO.map((item) => {
              const bajo = item.stock <= item.stockMinimo
              return (
                <tr key={item.id} className={`hover:bg-primary-50/50 ${bajo ? 'bg-yellow-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-primary-900">{item.nombre}</td>
                  <td className="px-4 py-3 text-primary-600">{item.categoria}</td>
                  <td className="px-4 py-3 text-primary-600">{item.proveedor}</td>
                  <td className={`px-4 py-3 font-mono font-medium ${bajo ? 'text-red-600' : 'text-primary-700'}`}>
                    {item.stock}
                  </td>
                  <td className="px-4 py-3 text-primary-500">{item.stockMinimo}</td>
                  <td className="px-4 py-3 text-primary-500">{item.ubicacion}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Inventario
