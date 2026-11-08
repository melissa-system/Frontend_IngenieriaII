import { createContext, useContext, useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import Alerta from './Alerta'
import Button from './Button'

// Modal estándar: overlay oscuro + panel blanco centrado con scroll interno.
// Reemplaza los `fixed inset-0 ...` hechos a mano en cada vista. No se cierra
// al hacer clic afuera (igual que antes): se cierra con sus botones o, si se
// pasa `onCerrar`, con la tecla Escape.
//
// Accesibilidad: role="dialog" + aria-modal, nombre accesible desde el
// <ModalTitulo> (aria-labelledby), el foco entra al abrirse, queda atrapado
// dentro (Tab / Shift+Tab) y vuelve al elemento que lo abrió al cerrarse.
//
// Orden de botones del pie (ver diseños/formularios.md): primero la acción
// principal y de último "Cancelar", alineados a la derecha → <ModalAcciones>.
//
// Variantes listas: <ModalConfirmar> (sí/no) y <ModalFormulario> (form con
// guardar/cancelar y error integrado).
export type TamanoModal = 'md' | 'lg' | 'xl' | '2xl'

const ANCHO: Record<TamanoModal, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

// Los modales que se abren encima de otro (confirmaciones) necesitan una capa mayor.
const CAPA = { 50: 'z-50', 60: 'z-[60]', 70: 'z-[70]' } as const

const TituloContext = createContext<string | undefined>(undefined)

const FOCUSABLES =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  children: ReactNode
  size?: TamanoModal
  /** Capa: 50 normal, 60/70 para confirmaciones sobre otro modal. */
  layer?: keyof typeof CAPA
  /** false = sin scroll interno ni alto máximo (confirmaciones cortas). */
  scroll?: boolean
  /** Nombre accesible alternativo si el modal no usa <ModalTitulo>. */
  label?: string
  /** Si se pasa, Escape cierra el modal. */
  onCerrar?: () => void
}

function Modal({ children, size = '2xl', layer = 50, scroll = true, label, onCerrar }: ModalProps) {
  const tituloId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const onCerrarRef = useRef(onCerrar)
  onCerrarRef.current = onCerrar

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    const el = panel.current
    // Foco inicial: el primer campo/botón del modal, o el panel mismo.
    const primero = el?.querySelector<HTMLElement>(FOCUSABLES)
    ;(primero ?? el)?.focus({ preventScroll: true })
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape' && onCerrarRef.current) {
        e.stopPropagation()
        onCerrarRef.current()
        return
      }
      if (e.key !== 'Tab' || !el) return
      const lista = [...el.querySelectorAll<HTMLElement>(FOCUSABLES)]
      if (lista.length === 0) {
        e.preventDefault()
        return
      }
      const primera = lista[0]
      const ultima = lista[lista.length - 1]
      if (e.shiftKey && (document.activeElement === primera || document.activeElement === el)) {
        e.preventDefault()
        ultima.focus()
      } else if (!e.shiftKey && document.activeElement === ultima) {
        e.preventDefault()
        primera.focus()
      }
    }
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = overflow
      previo?.focus?.({ preventScroll: true })
    }
  }, [])

  return (
    <div
      className={`fixed inset-0 ${CAPA[layer]} flex items-center justify-center bg-black/40 p-2 sm:p-4`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-labelledby={label ? undefined : tituloId}
    >
      <TituloContext.Provider value={tituloId}>
        <div
          ref={panel}
          tabIndex={-1}
          className={`w-full ${ANCHO[size]} rounded-tarjeta bg-white p-4 shadow-flotante outline-none sm:p-6 ${
            scroll ? 'max-h-[92dvh] overflow-y-auto' : ''
          }`}
        >
          {children}
        </div>
      </TituloContext.Provider>
    </div>
  )
}

export function ModalTitulo({ children }: { children: ReactNode }) {
  const id = useContext(TituloContext)
  return (
    <h2 id={id} className="text-subtitulo font-semibold text-primary-900">
      {children}
    </h2>
  )
}

/** Fila de botones del pie del modal: alineados a la derecha. */
export function ModalAcciones({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-end gap-3 pt-2">{children}</div>
}

/** Modal de confirmación (¿seguro?): mensaje + Confirmar / Cancelar. */
export function ModalConfirmar({
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'primary',
  cargando = false,
  error,
  onConfirmar,
  onCancelar,
  layer = 60,
}: {
  titulo: string
  mensaje: ReactNode
  textoConfirmar?: string
  textoCancelar?: string
  /** 'danger' para acciones destructivas (eliminar, inhabilitar). */
  variante?: 'primary' | 'danger'
  cargando?: boolean
  error?: string | null
  onConfirmar: () => void
  onCancelar: () => void
  layer?: keyof typeof CAPA
}) {
  return (
    <Modal size="md" layer={layer} scroll={false} onCerrar={cargando ? undefined : onCancelar}>
      <div className="space-y-4">
        <ModalTitulo>{titulo}</ModalTitulo>
        <div className="text-sm text-primary-600">{mensaje}</div>
        {error && <Alerta tipo="error">{error}</Alerta>}
        <ModalAcciones>
          <Button variant={variante === 'danger' ? 'danger' : 'primary'} loading={cargando} onClick={onConfirmar}>
            {textoConfirmar}
          </Button>
          <Button variant="secondary" disabled={cargando} onClick={onCancelar}>
            {textoCancelar}
          </Button>
        </ModalAcciones>
      </div>
    </Modal>
  )
}

/** Modal con formulario: título, campos (children), error general y Guardar / Cancelar. */
export function ModalFormulario({
  titulo,
  children,
  onSubmit,
  onCancelar,
  textoGuardar = 'Guardar',
  guardando = false,
  error,
  size = 'xl',
}: {
  titulo: string
  children: ReactNode
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onCancelar: () => void
  textoGuardar?: string
  guardando?: boolean
  error?: string | null
  size?: TamanoModal
}) {
  return (
    <Modal size={size} onCerrar={guardando ? undefined : onCancelar}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <ModalTitulo>{titulo}</ModalTitulo>
        {children}
        {error && <Alerta tipo="error">{error}</Alerta>}
        <ModalAcciones>
          <Button type="submit" loading={guardando}>
            {textoGuardar}
          </Button>
          <Button variant="secondary" disabled={guardando} onClick={onCancelar}>
            Cancelar
          </Button>
        </ModalAcciones>
      </form>
    </Modal>
  )
}

export default Modal
