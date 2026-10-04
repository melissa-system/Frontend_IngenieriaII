import type { ReactNode } from 'react'

// Modal estándar: overlay oscuro + panel blanco centrado con scroll interno.
// Reemplaza los `fixed inset-0 ...` hechos a mano en cada vista. No se cierra
// al hacer clic afuera (igual que antes): se cierra solo con sus botones.
//
// Orden de botones del pie (ver diseños/formularios.md): primero la acción
// principal y de último "Cancelar", alineados a la derecha → <ModalAcciones>.
export type TamanoModal = 'md' | 'lg' | 'xl' | '2xl'

const ANCHO: Record<TamanoModal, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

// Los modales que se abren encima de otro (confirmaciones) necesitan una capa mayor.
const CAPA = { 50: 'z-50', 60: 'z-[60]', 70: 'z-[70]' } as const

interface ModalProps {
  children: ReactNode
  size?: TamanoModal
  /** Capa: 50 normal, 60/70 para confirmaciones sobre otro modal. */
  layer?: keyof typeof CAPA
  /** false = sin scroll interno ni alto máximo (confirmaciones cortas). */
  scroll?: boolean
  label?: string
}

function Modal({ children, size = '2xl', layer = 50, scroll = true, label }: ModalProps) {
  return (
    <div
      className={`fixed inset-0 ${CAPA[layer]} flex items-center justify-center bg-black/40 p-2 sm:p-4`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className={`w-full ${ANCHO[size]} rounded-tarjeta bg-white p-4 shadow-flotante sm:p-6 ${
          scroll ? 'max-h-[92dvh] overflow-y-auto' : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalTitulo({ children }: { children: ReactNode }) {
  return <h2 className="text-subtitulo font-semibold text-primary-900">{children}</h2>
}

/** Fila de botones del pie del modal: alineados a la derecha. */
export function ModalAcciones({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-end gap-3 pt-2">{children}</div>
}

export default Modal
