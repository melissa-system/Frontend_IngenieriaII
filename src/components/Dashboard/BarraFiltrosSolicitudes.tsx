interface PropiedadesBarra {
  busca: string
  manejarBusqueda: (v: string) => void
  placeholder: string
  orden: 'recientes' | 'antiguas'
  cambiarOrden: (v: 'recientes' | 'antiguas') => void
  filtroEstado: string
  cambiarEstado: (v: string) => void
  estados: { valor: string; etiqueta: string }[]
  etiquetaEstados?: string
}

// Barra idéntica a la de Averias/Abonados: buscador, orden por fecha y filtro
// por estado. La usan todas las páginas de solicitudes para que el layout sea
// el mismo en cada tipo.
function BarraFiltrosSolicitudes({
  busca,
  manejarBusqueda,
  placeholder,
  orden,
  cambiarOrden,
  filtroEstado,
  cambiarEstado,
  estados,
  etiquetaEstados = 'Todos los estados',
}: PropiedadesBarra) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-96">
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
          placeholder={placeholder}
          value={busca}
          onChange={(e) => manejarBusqueda(e.target.value)}
          className="w-full rounded-full border border-primary-200 py-2.5 pl-10 pr-9 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
        />
        {busca && (
          <button
            type="button"
            onClick={() => manejarBusqueda('')}
            title="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-primary-300 hover:bg-primary-100 hover:text-primary-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => cambiarOrden(orden === 'recientes' ? 'antiguas' : 'recientes')}
        title="Cambiar orden por fecha"
        className="flex h-10 items-center gap-1 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
      >
        {orden === 'recientes' ? '↑ Más antiguas' : '↓ Más recientes'}
      </button>
      <select
        value={filtroEstado}
        onChange={(e) => cambiarEstado(e.target.value)}
        className="h-10 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
      >
        <option value="Todas">{etiquetaEstados}</option>
        {estados.map((e) => (
          <option key={e.valor} value={e.valor}>
            {e.etiqueta}
          </option>
        ))}
      </select>
    </div>
  )
}

export default BarraFiltrosSolicitudes