import type { ReactNode } from 'react'

// Etiqueta de estado: siempre "color-100 de fondo + color-700 de texto"
// (ver diseños/colores.md).
export type ColorBadge = 'green' | 'yellow' | 'red' | 'blue' | 'indigo' | 'gray'

const COLORES: Record<ColorBadge, string> = {
  green: 'bg-exito-100 text-exito-700',
  yellow: 'bg-advertencia-100 text-advertencia-700',
  red: 'bg-error-100 text-error-700',
  blue: 'bg-info-100 text-info-700',
  indigo: 'bg-acento-100 text-acento-700',
  gray: 'bg-primary-100 text-primary-700',
}

/** Clases de badge por si se necesita aplicarlas a otro elemento. */
export function claseBadge(color: ColorBadge): string {
  return `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORES[color]}`
}

function Badge({ color = 'gray', children }: { color?: ColorBadge; children: ReactNode }) {
  return <span className={claseBadge(color)}>{children}</span>
}

export default Badge
