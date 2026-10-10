import type { ReactNode } from 'react'

// Iconos de acción para tablas (editar / ver / eliminar). El proyecto no usa
// una librería de iconos: SVGs inline estilo Heroicons outline, con el mismo
// trato táctil (pointer-coarse) y foco visible que el resto de los controles.

interface AccionTablaProps {
  /** Texto del tooltip y etiqueta accesible (botón sin texto visible). */
  titulo: string
  onClick: () => void
  disabled?: boolean
}

function IconoAccion({
  titulo,
  onClick,
  disabled,
  className,
  children,
}: AccionTablaProps & { className: string; children: ReactNode }) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors pointer-coarse:before:absolute pointer-coarse:before:-inset-2 pointer-coarse:before:content-[''] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        className="h-5 w-5"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  )
}

export function IconoEditar({ titulo, onClick, disabled }: AccionTablaProps) {
  return (
    <IconoAccion
      titulo={titulo}
      onClick={onClick}
      disabled={disabled}
      className="text-primary-500 hover:bg-primary-100 hover:text-primary-700"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.863 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.377 7.377" />
    </IconoAccion>
  )
}

export function IconoVer({ titulo, onClick, disabled }: AccionTablaProps) {
  return (
    <IconoAccion
      titulo={titulo}
      onClick={onClick}
      disabled={disabled}
      className="text-primary-500 hover:bg-primary-100 hover:text-primary-700"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </IconoAccion>
  )
}

export function IconoEliminar({ titulo, onClick, disabled }: AccionTablaProps) {
  return (
    <IconoAccion
      titulo={titulo}
      onClick={onClick}
      disabled={disabled}
      className="text-error-600 hover:bg-error-50 hover:text-error-700"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </IconoAccion>
  )
}
