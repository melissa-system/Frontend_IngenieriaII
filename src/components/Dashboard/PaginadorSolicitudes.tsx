interface PropiedadesPaginador {
  total: number
  primeraFila: number
  porPagina: number
  paginaActual: number
  totalPaginas: number
  numerosPagina: number[]
  busca: string
  etiqueta: string
  irPagina: (n: number) => void
}

// Pie de tabla idéntico al de Averias/Abonados: contador "Mostrando X–Y de Z"
// + botones Anterior / números / Siguiente.
function PaginadorSolicitudes({
  total,
  primeraFila,
  porPagina,
  paginaActual,
  totalPaginas,
  numerosPagina,
  busca,
  etiqueta,
  irPagina,
}: PropiedadesPaginador) {
  return (
    <div className="flex flex-col gap-3 border-t border-primary-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-primary-500">
        Mostrando{' '}
        {total === 0
          ? 0
          : `${primeraFila + 1}–${Math.min(primeraFila + porPagina, total)}`}{' '}
        de {total} {etiqueta}
        {busca ? ` (filtro: "${busca}")` : ''}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => irPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          className="rounded-full border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹ Anterior
        </button>
        {numerosPagina.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => irPagina(n)}
            disabled={n === paginaActual}
            aria-current={n === paginaActual ? 'page' : undefined}
            className={`h-7 min-w-[28px] rounded-full px-2 text-xs font-medium ${
              n === paginaActual ? 'bg-primary-700 text-white' : 'text-primary-700 hover:bg-primary-50'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => irPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className="rounded-full border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente ›
        </button>
      </div>
    </div>
  )
}

export default PaginadorSolicitudes