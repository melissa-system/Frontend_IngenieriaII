// Lógica pura de tablas (ordenamiento y paginación). Está separada de los
// componentes para poder probarla con `npm test` y reutilizarla en cualquier
// módulo sin copiar código.

export type Direccion = 'asc' | 'desc'
export interface OrdenTabla {
  clave: string
  direccion: Direccion
}

/** Siguiente orden al tocar el encabezado: asc → desc → sin orden. */
export function siguienteOrden(actual: OrdenTabla | null, clave: string): OrdenTabla | null {
  if (!actual || actual.clave !== clave) return { clave, direccion: 'asc' }
  if (actual.direccion === 'asc') return { clave, direccion: 'desc' }
  return null
}

function comparar(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return 1 // los vacíos siempre al final
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' })
}

/** Devuelve una copia ordenada; sin orden devuelve los elementos tal cual. */
export function ordenar<T>(
  items: T[],
  orden: OrdenTabla | null,
  valores: Record<string, (item: T) => unknown>,
): T[] {
  const valor = orden ? valores[orden.clave] : undefined
  if (!orden || !valor) return items
  const signo = orden.direccion === 'asc' ? 1 : -1
  return [...items].sort((x, y) => {
    const a = valor(x)
    const b = valor(y)
    // Los vacíos van siempre al final, sea cual sea la dirección.
    if (a == null || b == null) return comparar(a, b)
    return signo * comparar(a, b)
  })
}

export interface Pagina<T> {
  filas: T[]
  pagina: number
  totalPaginas: number
  desde: number // 1-based; 0 si no hay filas
  hasta: number
}

/** Recorta una página y la ajusta si quedó fuera de rango (p. ej. tras filtrar). */
export function paginar<T>(items: T[], pagina: number, porPagina: number): Pagina<T> {
  const totalPaginas = Math.max(1, Math.ceil(items.length / porPagina))
  const actual = Math.min(Math.max(1, pagina), totalPaginas)
  const inicio = (actual - 1) * porPagina
  return {
    filas: items.slice(inicio, inicio + porPagina),
    pagina: actual,
    totalPaginas,
    desde: items.length === 0 ? 0 : inicio + 1,
    hasta: Math.min(inicio + porPagina, items.length),
  }
}

/** Números de página a mostrar: primera, última y vecinas de la actual; null = "…". */
export function ventanaPaginas(actual: number, total: number): (number | null)[] {
  const out: (number | null)[] = []
  let previo = 0
  for (let n = 1; n <= total; n++) {
    if (n === 1 || n === total || Math.abs(n - actual) <= 1) {
      if (n - previo > 1) out.push(null)
      out.push(n)
      previo = n
    }
  }
  return out
}
