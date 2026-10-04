import { ventanaPaginas } from '../../lib/tabla'
import Button from './Button'

// Pie de tabla estándar: "Mostrando X–Y de Z" + Anterior / números / Siguiente.
// Se pasa como `pie` de <Table>. Navegable con teclado (son botones) y con
// aria-current en la página activa.
function Paginador({
  total,
  pagina,
  porPagina,
  onCambiar,
  etiqueta = 'registros',
  filtro,
  deshabilitado = false,
}: {
  total: number
  pagina: number
  porPagina: number
  onCambiar: (pagina: number) => void
  /** Plural de lo que se lista: "abonados", "artículos"… */
  etiqueta?: string
  /** Texto de búsqueda activo, para mostrarlo en el contador. */
  filtro?: string
  deshabilitado?: boolean
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const actual = Math.min(Math.max(1, pagina), totalPaginas)
  const desde = total === 0 ? 0 : (actual - 1) * porPagina + 1
  const hasta = Math.min(actual * porPagina, total)

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col gap-3 border-t border-primary-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-primary-500" aria-live="polite">
        Mostrando {desde === 0 ? 0 : `${desde}–${hasta}`} de {total} {etiqueta}
        {filtro ? ` (filtro: "${filtro}")` : ''}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onCambiar(actual - 1)}
          disabled={deshabilitado || actual === 1}
        >
          ‹ Anterior
        </Button>
        {ventanaPaginas(actual, totalPaginas).map((n, i) =>
          n === null ? (
            <span key={`p${i}`} aria-hidden="true" className="px-1 text-xs text-primary-400">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onCambiar(n)}
              disabled={deshabilitado || n === actual}
              aria-current={n === actual ? 'page' : undefined}
              aria-label={`Página ${n}`}
              className={`h-8 min-w-8 rounded-full px-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 pointer-coarse:h-11 pointer-coarse:min-w-11 ${
                n === actual ? 'bg-primary-700 text-white' : 'text-primary-700 hover:bg-primary-50'
              }`}
            >
              {n}
            </button>
          ),
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onCambiar(actual + 1)}
          disabled={deshabilitado || actual === totalPaginas}
        >
          Siguiente ›
        </Button>
      </div>
    </nav>
  )
}

export default Paginador
