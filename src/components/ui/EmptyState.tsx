import type { ReactNode } from 'react'

// Estado vacío estándar de listas y tablas: ícono + título + descripción.
function IconoVacio() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-primary-300" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
    </svg>
  )
}

function EmptyState({
  titulo,
  descripcion,
  icono,
}: {
  titulo: string
  descripcion?: string
  icono?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 bg-white py-16 text-center shadow-sm">
      {icono ?? <IconoVacio />}
      <p className="mt-3 text-lg font-medium text-primary-700">{titulo}</p>
      {descripcion && <p className="mt-1 text-sm text-primary-400">{descripcion}</p>}
    </div>
  )
}

export default EmptyState
