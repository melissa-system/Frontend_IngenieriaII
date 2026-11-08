import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import Toast, { type TipoToast } from './Toast'

// Confirmación uniforme: cualquier pantalla llama notificar('Guardado', 'exito')
// y aparece el mismo toast (esquina inferior derecha, se cierra solo a los 5 s;
// los errores se quedan hasta cerrarlos).
interface ToastCtx {
  notificar: (mensaje: string, tipo?: TipoToast) => void
}

const Contexto = createContext<ToastCtx>({ notificar: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; mensaje: string; tipo: TipoToast } | null>(null)
  const notificar = useCallback((mensaje: string, tipo: TipoToast = 'exito') => {
    setToast({ id: Date.now(), mensaje, tipo })
  }, [])
  const valor = useMemo(() => ({ notificar }), [notificar])
  return (
    <Contexto.Provider value={valor}>
      {children}
      {toast && <Toast key={toast.id} mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
    </Contexto.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastCtx {
  return useContext(Contexto)
}

/** Dispara el toast cuando `mensaje` tiene texto. Sustituye a los banners verdes
 *  y rojos de cada pantalla: se coloca donde estaba el banner. */
export function Notificar({ mensaje, tipo = 'exito' }: { mensaje?: string | null; tipo?: TipoToast }) {
  const { notificar } = useToast()
  useEffect(() => {
    if (mensaje) notificar(mensaje, tipo)
  }, [mensaje, tipo, notificar])
  return null
}
