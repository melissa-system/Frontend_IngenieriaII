import Badge, { type ColorBadge } from './Badge'

// Etiqueta del estado de una solicitud. Acepta los dos formatos que existen
// en el sistema: el común en minúsculas (pendiente / en_proceso / aprobado /
// rechazado) y el de Paja de Agua ('Pendiente' / 'En proceso' / 'Aprobada' /
// 'Rechazada' / 'Completada').
const ESTADOS: Record<string, { etiqueta: string; color: ColorBadge }> = {
  pendiente: { etiqueta: 'Pendiente', color: 'yellow' },
  en_proceso: { etiqueta: 'En proceso', color: 'blue' },
  aprobado: { etiqueta: 'Aprobada', color: 'green' },
  rechazado: { etiqueta: 'Rechazada', color: 'red' },
  completada: { etiqueta: 'Completada', color: 'indigo' },
}

function normalizar(estado: string): string {
  return estado.trim().toLowerCase().replace(/\s+/g, '_').replace(/^aprobada$/, 'aprobado').replace(/^rechazada$/, 'rechazado')
}

/** Texto del estado (para mensajes y toasts). */
export function etiquetaEstado(estado: string): string {
  return ESTADOS[normalizar(estado)]?.etiqueta ?? estado
}

function BadgeEstado({ estado }: { estado: string }) {
  const def = ESTADOS[normalizar(estado)]
  return <Badge color={def?.color ?? 'gray'}>{def?.etiqueta ?? estado}</Badge>
}

export default BadgeEstado
