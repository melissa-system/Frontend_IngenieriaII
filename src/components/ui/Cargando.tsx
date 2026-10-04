// Estado de carga estándar. Dos formas:
//  - <Cargando />            indicador (spinner + texto) para páginas, tarjetas y modales
//  - <FilasEsqueleto />      esqueleto de filas para dentro de un <Table>
// Así nunca queda una pantalla en blanco mientras llegan los datos.
export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin text-primary-600 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
    </svg>
  )
}

function Cargando({ texto = 'Cargando...', compacto = false }: { texto?: string; compacto?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-3 text-sm text-primary-500 ${compacto ? 'py-4' : 'py-16'}`}
    >
      <Spinner />
      <span>{texto}</span>
    </div>
  )
}

export function FilasEsqueleto({ columnas, filas = 5 }: { columnas: number; filas?: number }) {
  return (
    <>
      {Array.from({ length: filas }).map((_, i) => (
        <tr key={i} aria-hidden="true">
          {Array.from({ length: columnas }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded-full bg-primary-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default Cargando
