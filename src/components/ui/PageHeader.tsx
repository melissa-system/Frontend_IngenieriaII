import type { ReactNode } from 'react'

// Encabezado estándar de cada pantalla del dashboard: título + descripción a la
// izquierda y, opcionalmente, el botón de crear a la derecha (diseños/formularios.md).
function PageHeader({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string
  descripcion?: ReactNode
  accion?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-titulo-pagina font-semibold text-primary-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-primary-500">{descripcion}</p>}
      </div>
      {accion}
    </div>
  )
}

export default PageHeader
