import type { ReactNode } from 'react'

// Tabla estándar: contenedor con borde/scroll horizontal, cabecera
// `bg-primary-50` y filas separadas. Las vistas pasan sus <th> y <tr>.
//
//   <Table cabecera={['Código', 'Estado', 'Acciones']}>
//     {filas.map((f) => <tr key={f.id}><Td>…</Td></tr>)}
//   </Table>
export const CLASE_TH = 'px-4 py-3 text-left font-medium text-primary-700'
export const CLASE_TD = 'px-4 py-3 text-primary-700'

function Table({
  cabecera,
  children,
  pie,
}: {
  cabecera: ReactNode[]
  children: ReactNode
  /** Contenido pegado debajo de la tabla (ej. el paginador). */
  pie?: ReactNode
}) {
  return (
    <div className="overflow-x-auto rounded-tarjeta border border-primary-100 bg-white shadow-tarjeta">
      <table className="min-w-full divide-y divide-primary-100 text-sm">
        <thead className="bg-primary-50">
          <tr>
            {cabecera.map((c, i) => (
              <th key={i} className={CLASE_TH}>
                {c}
              </th>
            ))}
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
