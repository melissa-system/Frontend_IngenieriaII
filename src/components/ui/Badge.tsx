import type { ReactNode } from 'react'

// Etiqueta de estado: siempre "color-100 de fondo + color-700 de texto"
// (ver diseños/colores.md).
export type ColorBadge = 'green' | 'yellow' | 'red' | 'blue' | 'indigo' | 'gray'

const COLORES: Record<ColorBadge, string> = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  indigo: 'bg-indigo-100 text-indigo-700',
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
