import Paginador from '../ui/Paginador'

interface PropiedadesPaginador {
  total: number
  primeraFila: number
  porPagina: number
  paginaActual: number
  totalPaginas: number
  numerosPagina: number[]
  busca: string
  etiqueta: string
  irPagina: (n: number) => void
}

// Adaptador de las tablas de solicitudes al paginador estándar (ui/Paginador).
// Se conserva su API para no tocar las 6 vistas; la lógica y el diseño viven
// en un solo lugar.
function PaginadorSolicitudes({ total, porPagina, paginaActual, busca, etiqueta, irPagina }: PropiedadesPaginador) {
  return (
    <Paginador
      total={total}
      pagina={paginaActual}
      porPagina={porPagina}
      onCambiar={irPagina}
      etiqueta={etiqueta}
      filtro={busca || undefined}
    />
  )
}

export default PaginadorSolicitudes
