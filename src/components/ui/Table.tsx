import type { ReactNode } from 'react'
import type { OrdenTabla } from '../../lib/tabla'

// Tabla estándar: contenedor con borde/scroll horizontal, cabecera
// `bg-primary-50` y filas separadas. Las vistas pasan sus <th> y <tr>.
//
//   <Table cabecera={['Código', 'Estado', 'Acciones']}>
//     {filas.map((f) => <tr key={f.id}><Td>…</Td></tr>)}
//   </Table>
//
// Ordenamiento: una columna puede declararse como { etiqueta, clave }; con
// `orden` y `onOrdenar` el encabezado pasa a ser un botón que alterna
// ascendente / descendente / sin orden (ver lib/tabla.ts → siguienteOrden).
//
//   <Table cabecera={[{ etiqueta: 'Nombre', clave: 'nombre' }, 'Acciones']}
//          orden={orden} onOrdenar={(c) => setOrden(siguienteOrden(orden, c))}>
export const CLASE_TH = 'whitespace-nowrap px-4 py-3 text-left font-medium text-primary-700'
export const CLASE_TD = 'px-4 py-3 text-primary-700'

export interface ColumnaTabla {
  etiqueta: ReactNode
  /** Si se define, la columna es ordenable por esa clave. */
  clave?: string
}
type Cabecera = ReactNode | ColumnaTabla

function esColumna(c: Cabecera): c is ColumnaTabla {
  return typeof c === 'object' && c !== null && 'etiqueta' in (c as object)
}

function Flecha({ direccion }: { direccion?: 'asc' | 'desc' }) {
  return (
    <span aria-hidden="true" className={direccion ? 'text-primary-700' : 'text-primary-300'}>
      {direccion === 'asc' ? '↑' : direccion === 'desc' ? '↓' : '↕'}
    </span>
  )
}

function Table({
  cabecera,
  children,
  pie,
  orden,
  onOrdenar,
}: {
  cabecera: Cabecera[]
  children: ReactNode
  /** Contenido pegado debajo de la tabla (ej. el paginador). */
  pie?: ReactNode
  orden?: OrdenTabla | null
  onOrdenar?: (clave: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-tarjeta border border-primary-100 bg-white shadow-tarjeta">
      <table className="min-w-[44rem] w-full divide-y divide-primary-100 text-sm">
        <thead className="bg-primary-50">
          <tr>
            {cabecera.map((c, i) => {
              if (!esColumna(c) || !c.clave || !onOrdenar) {
                return (
                  <th key={i} scope="col" className={CLASE_TH}>
                    {esColumna(c) ? c.etiqueta : c}
                  </th>
                )
              }
              const activa = orden?.clave === c.clave ? orden.direccion : undefined
              return (
                <th
                  key={i}
                  scope="col"
                  className={CLASE_TH}
                  aria-sort={activa === 'asc' ? 'ascending' : activa === 'desc' ? 'descending' : 'none'}
                >
                  <button
                    type="button"
                    onClick={() => onOrdenar(c.clave!)}
                    className="inline-flex items-center gap-1.5 rounded-full font-medium hover:text-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 pointer-coarse:min-h-11"
                  >
                    {c.etiqueta}
                    <Flecha direccion={activa} />
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-primary-50">{children}</tbody>
      </table>
      {pie}
    </div>
  )
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`${CLASE_TD} ${className}`.trim()}>{children}</td>
}

export default Table
