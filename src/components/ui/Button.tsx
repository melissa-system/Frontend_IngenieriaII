import type { ButtonHTMLAttributes } from 'react'

// Botón estándar del sistema. SIEMPRE rounded-full (decisión de diseño: ver
// diseños/botones.md). Variantes:
//  - primary:   acción principal (guardar, enviar, crear)
//  - secondary: acción secundaria con borde (cancelar, volver)
//  - danger / success / info: acciones semánticas de gestión (rechazar,
//    aprobar, marcar en proceso)
//  - ghost:     acción terciaria con fondo suave (ver detalle, descargar)
export type VarianteBoton = 'primary' | 'secondary' | 'danger' | 'success' | 'info' | 'ghost'
export type TamanoBoton = 'sm' | 'md'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTES: Record<VarianteBoton, string> = {
  primary: 'bg-primary-700 text-white hover:bg-primary-800',
  secondary: 'border border-primary-200 bg-white font-medium text-primary-700 hover:bg-primary-50',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  success: 'bg-green-500 text-white hover:bg-green-600',
  info: 'bg-blue-500 text-white hover:bg-blue-600',
  ghost: 'bg-primary-50 font-medium text-primary-700 hover:bg-primary-100',
}

const TAMANOS: Record<TamanoBoton, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2 text-sm',
}

/** Clases del botón, por si hay que aplicarlas a un <Link> o <a>. */
export function claseBoton(variante: VarianteBoton = 'primary', tamano: TamanoBoton = 'md'): string {
  return `${BASE} ${VARIANTES[variante]} ${TAMANOS[tamano]}`
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VarianteBoton
  size?: TamanoBoton
}

function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  return <button type={type} className={`${claseBoton(variant, size)} ${className}`.trim()} {...props} />
}

export default Button
