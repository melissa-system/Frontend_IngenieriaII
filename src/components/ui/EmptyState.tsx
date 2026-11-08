import type { ReactNode } from 'react'
import Icono from './Icono'

// Estado vacío estándar de listas y tablas: ícono + título + descripción.
function IconoVacio() {
  return <Icono nombre="bandeja" grosor={1.5} className="h-10 w-10 text-primary-300" />
}

function EmptyState({
  titulo,
  descripcion,
  icono,
  compacto = false,
}: {
  titulo: string
  descripcion?: string
  icono?: ReactNode
  /** Sin borde ni fondo, para usarlo dentro de una tarjeta o gráfico. */
  compacto?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compacto ? 'py-10' : 'rounded-tarjeta border border-dashed border-primary-200 bg-white py-16 shadow-tarjeta'
      }`}
    >
      {icono ?? <IconoVacio />}
      <p className="mt-3 text-subtitulo font-medium text-primary-700">{titulo}</p>
      {descripcion && <p className="mt-1 text-sm text-primary-400">{descripcion}</p>}
    </div>
  )
}

/** Estado vacío para dentro de un <Table>: una fila con ícono y mensaje. */
export function FilaVacia({ columnas, titulo, descripcion }: { columnas: number; titulo: string; descripcion?: string }) {
  return (
    <tr>
      <td colSpan={columnas}>
        <EmptyState compacto titulo={titulo} descripcion={descripcion} />
      </td>
    </tr>
  )
}

export default EmptyState
