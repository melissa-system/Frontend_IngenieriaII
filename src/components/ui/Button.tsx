import type { ButtonHTMLAttributes } from 'react'

// Botón estándar del sistema. SIEMPRE rounded-full (decisión de diseño: ver
// diseños/botones.md). Variantes:
//  - primary:   acción principal (guardar, enviar, crear)
//  - secondary: acción secundaria con borde (cancelar, volver)
//  - danger / success / info: acciones semánticas de gestión (rechazar,
//    aprobar, marcar en proceso, descartar), con borde y texto de color
//  - ghost:     acción terciaria con fondo suave (ver detalle, descargar)
export type VarianteBoton = 'primary' | 'secondary' | 'danger' | 'success' | 'info' | 'ghost'
export type TamanoBoton = 'sm' | 'md'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTES: Record<VarianteBoton, string> = {
  primary: 'bg-primary-700 text-white hover:bg-primary-800',
  secondary: 'border border-primary-200 bg-white font-medium text-primary-700 hover:bg-primary-50',
  // Acciones de gestión (rechazar, aprobar, en proceso, descartar): fondo blanco,
  // borde y texto del color de la acción, sombra suave.
  danger: 'border border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50',
  success: 'border border-green-200 bg-white text-green-600 shadow-sm hover:bg-green-50',
  info: 'border border-blue-200 bg-white text-blue-600 shadow-sm hover:bg-blue-50',
  ghost: 'bg-primary-50 font-medium text-primary-700 hover:bg-primary-100',
}

const TAMANOS: Record<TamanoBoton, string> = {
  sm: 'px-3 py-1.5 text-xs pointer-coarse:min-h-11',
  md: 'px-5 py-2 text-sm pointer-coarse:min-h-11',
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
