import type { ReactNode } from 'react'
import Icono, { type NombreIcono } from './Icono'

// Alerta en línea (dentro de la página, modal o formulario). Cuatro tipos:
// éxito, error, advertencia e información. Para avisos que flotan sobre la
// pantalla al terminar una acción se usa el toast (ToastProvider/useToast).
export type TipoAlerta = 'exito' | 'error' | 'advertencia' | 'info'

const ESTILOS: Record<TipoAlerta, { caja: string; icono: NombreIcono }> = {
  exito: { caja: 'border-exito-200 bg-exito-50 text-exito-800', icono: 'check' },
  error: { caja: 'border-error-200 bg-error-50 text-error-700', icono: 'errorCirculo' },
  advertencia: { caja: 'border-advertencia-200 bg-advertencia-50 text-advertencia-800', icono: 'alerta' },
  info: { caja: 'border-info-200 bg-info-50 text-info-800', icono: 'info' },
}

export function estiloAlerta(tipo: TipoAlerta): { caja: string; icono: NombreIcono } {
  return ESTILOS[tipo]
}

function Alerta({
  tipo = 'info',
  children,
  className = '',
}: {
  tipo?: TipoAlerta
  children: ReactNode
  className?: string
}) {
  const { caja, icono } = ESTILOS[tipo]
  return (
    // role=alert anuncia al instante errores/avisos; status para los demás.
    <div
      role={tipo === 'error' || tipo === 'advertencia' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-campo border px-3 py-2.5 text-sm font-medium ${caja} ${className}`.trim()}
    >
      <Icono nombre={icono} className="mt-0.5 h-4 w-4 flex-none" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export default Alerta
