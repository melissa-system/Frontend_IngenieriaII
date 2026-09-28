import { useMemo, useRef, useState } from 'react'

// Ignora tildes y mayúsculas para que la búsqueda encuentre "Jose" al
// escribir "josé" y viceversa (mismo criterio que Proveedores/Paja de Agua).
export function normalizarBusqueda(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// Convierte una fecha 'YYYY-MM-DD' o ISO a timestamp; si no se puede
// interpretar, usa 0 para no romper el orden.
export function aTimestamp(fecha: string): number {
  const t = new Date(fecha).getTime()
  return Number.isNaN(t) ? 0 : t
}

export type OrdenFechas = 'recientes' | 'antiguas'

export interface FiltroEstado {
  valor: string
  etiqueta: string
}

// Estados de los 5 tipos de solicitud de abonado (Conexión, Cambio de
// Medidor, Propietario, Representante, Otro): guardados en snake_case con
// etiquetas en español (fem., "Aprobada"/"Rechazada").
export const ESTADOS_ABONADO: FiltroEstado[] = [
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'en_proceso', etiqueta: 'En proceso' },
  { valor: 'aprobado', etiqueta: 'Aprobada' },
  { valor: 'rechazado', etiqueta: 'Rechazada' },
]

export interface OpcionesFiltros<T> {
  // Estados disponibles para el select (>1 opción). El valor 'Todas' se
  // agrega siempre como primera opción.
  estados: FiltroEstado[]
  // Campos de la fila por los que se busca (código, nombre, cédula...).
  camposBusqueda: (item: T) => (string | null | undefined)[]
  // Devuelve el estado crudo de la fila para comparar con filtroEstado.
  estadoDe: (item: T) => string
  // Devuelve la fecha de la fila (string) para ordenar.
  fechaDe: (item: T) => string
  porPagina?: number
}

// Encapsula la búsqueda + filtro por estado + orden por fecha + paginación
// que todas las tablas de solicitudes comparten, para que el layout sea
// idéntico entre tipos (Proveedores / Paja de Agua como referencia).
export function useFiltrosSolicitudes<T>(
  items: T[],
  opciones: OpcionesFiltros<T>,
) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todas')
  const [orden, setOrden] = useState<OrdenFechas>('recientes')
  const [pagina, setPagina] = useState(1)

  // Las funciones de opciones cambian de identidad en cada render, pero su
  // lógica es estable: se leen desde una ref para que el memo no se recalcule
  // innecesariamente.
  const opcionesRef = useRef(opciones)
  opcionesRef.current = opciones

  const porPagina = opcionesRef.current.porPagina ?? 10
  const q = normalizarBusqueda(busqueda)

  const filtradas = useMemo(() => {
    let lista = items
    const { estados: _, camposBusqueda, estadoDe, fechaDe } = opcionesRef.current

    if (filtroEstado !== 'Todas') {
      lista = lista.filter((i) => estadoDe(i) === filtroEstado)
    }
    if (q) {
      lista = lista.filter((i) =>
        camposBusqueda(i).some((c) => normalizarBusqueda(c).includes(q)),
      )
    }

    // 'recientes' = más nuevas primero (desc); 'antiguas' = más viejas (asc).
    const factor = orden === 'recientes' ? -1 : 1
    return [...lista].sort(
      (a, b) => (aTimestamp(fechaDe(a)) - aTimestamp(fechaDe(b))) * factor,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q, filtroEstado, orden])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const primeraFila = (paginaActual - 1) * porPagina
  const filasVisibles = filtradas.slice(primeraFila, primeraFila + porPagina)
  const numerosPagina = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  // Cambiar cualquier criterio reinicia a la primera página.
  function cambiarBusqueda(valor: string) {
    setBusqueda(valor)
    setPagina(1)
  }
  function cambiarEstado(valor: string) {
    setFiltroEstado(valor)
    setPagina(1)
  }
  function cambiarOrden(valor: OrdenFechas) {
    setOrden(valor)
    setPagina(1)
  }
  function irPagina(n: number) {
    setPagina(n)
  }

  return {
    busqueda,
    cambiarBusqueda,
    filtroEstado,
    cambiarEstado,
    orden,
    cambiarOrden,
    pagina,
    irPagina,
    filtradas,
    filasVisibles,
    totalPaginas,
    paginaActual,
    primeraFila,
    porPagina,
    numerosPagina,
  }
}