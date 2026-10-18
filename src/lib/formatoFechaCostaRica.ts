/**
 * Utilitario de formateo de fecha y hora para Costa Rica (America/Costa_Rica, UTC-6).
 * Garantiza consistencia en reportes, comprobantes y nombres de archivos de respaldo.
 */

export const ZONA_HORARIA_COSTA_RICA = 'America/Costa_Rica'

function normalizarFecha(fecha?: Date | string | number | null): Date {
  if (!fecha) return new Date()
  const d = typeof fecha === 'string' || typeof fecha === 'number' ? new Date(fecha) : fecha
  return Number.isNaN(d.getTime()) ? new Date() : d
}

/**
 * Devuelve la fecha y hora formateada estrictamente como `dd/mm/aaaa hh:mm`
 * en zona horaria de Costa Rica (formato 24h).
 */
export function obtenerFechaHoraCostaRica(fecha?: Date | string | number | null): string {
  const d = normalizarFecha(fecha)
  const dtf = new Intl.DateTimeFormat('es-CR', {
    timeZone: ZONA_HORARIA_COSTA_RICA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const partes = dtf.formatToParts(d)
  const map: Record<string, string> = {}
  for (const p of partes) {
    map[p.type] = p.value
  }

  const dia = map.day ?? '01'
  const mes = map.month ?? '01'
  const anio = map.year ?? '2026'
  const hora = map.hour ?? '00'
  const minuto = map.minute ?? '00'

  return `${dia}/${mes}/${anio} ${hora}:${minuto}`
}

/**
 * Devuelve la fecha formateada como `aaaa-mm-dd` en la zona horaria de Costa Rica.
 */
export function obtenerFechaArchivoCostaRica(fecha?: Date | string | number | null): string {
  const d = normalizarFecha(fecha)
  const dtf = new Intl.DateTimeFormat('es-CR', {
    timeZone: ZONA_HORARIA_COSTA_RICA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const partes = dtf.formatToParts(d)
  const map: Record<string, string> = {}
  for (const p of partes) {
    map[p.type] = p.value
  }

  const dia = map.day ?? '01'
  const mes = map.month ?? '01'
  const anio = map.year ?? '2026'

  return `${anio}-${mes}-${dia}`
}

/**
 * Genera el nombre estandarizado de archivo: `copia-solicitud-<tipo>-<aaaa-mm-dd>.pdf`
 */
export function obtenerNombreArchivoCopia(tipoSlug: string, fecha?: Date | string | number | null): string {
  const fechaStr = obtenerFechaArchivoCostaRica(fecha)
  const slugLimpio = tipoSlug
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `copia-solicitud-${slugLimpio}-${fechaStr}.pdf`
}

