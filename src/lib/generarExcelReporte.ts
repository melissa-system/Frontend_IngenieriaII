// Exportación a Excel (.xlsx) de los reportes estadísticos (PBI 341).
//
// Reemplaza al CSV plano: el libro sale con el encabezado institucional, los
// mismos datos de la pantalla y un formato listo para leer o imprimir
// (cabeceras con color, bordes, filas alternas, anchos de columna, fechas y
// cantidades con su formato). Se arma con exceljs, que se carga solo al
// exportar para no engordar el bundle inicial de la página.
//
// Los imports llevan extensión .ts para que las pruebas (node --test) usen
// este mismo archivo sin pasar por Vite.
import type { Workbook, Worksheet, Row, Cell, Borders } from 'exceljs'
import { ASADA_NOMBRE_LEGAL, ASADA_CEDULA_JURIDICA } from './asadaInfo.ts'
import type { MetadatosExportacion, ReporteExportable } from './exportacionReportes.ts'

// Misma paleta que el PDF del reporte (generarPdfReporteEstadistico.ts).
const COLOR = {
  primario: 'FF073763',
  secundario: 'FF13416B',
  texto: 'FF1E2A39',
  textoSuave: 'FF5A6F83',
  borde: 'FFC9D6E0',
  fondoSuave: 'FFF2F6FA',
  filaAlterna: 'FFEEF3F8',
  blanco: 'FFFFFFFF',
}

const FUENTE = 'Calibri'
// exceljs escribe por defecto x14ac:dyDescent="55" (Excel usa 0.25); con ese
// valor Excel 365 dibuja mal las filas al desplazarse hacia arriba.
const PROPIEDADES_HOJA = { dyDescent: 0.25 }
const FORMATO_CANTIDAD = '#,##0'
const FORMATO_PORCENTAJE = '0.0%'
const FORMATO_FECHA = 'dd/mm/yyyy'
const FECHA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/

const PIE_DE_PAGINA = { oddFooter: `&L${ASADA_NOMBRE_LEGAL}&RPágina &P de &N` }

const BORDE_FINO: Partial<Borders> = {
  top: { style: 'thin', color: { argb: COLOR.borde } },
  bottom: { style: 'thin', color: { argb: COLOR.borde } },
  left: { style: 'thin', color: { argb: COLOR.borde } },
  right: { style: 'thin', color: { argb: COLOR.borde } },
}

function rellenar(celda: Cell, argb: string) {
  celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

// Las fechas llegan como texto YYYY-MM-DD; se guardan como fecha real de
// Excel (en UTC para que no se corran un día por la zona horaria) para que se
// puedan ordenar y filtrar.
function aFecha(valor: string): Date | null {
  const m = FECHA_ISO.exec(valor)
  if (!m) return null
  const fecha = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

// Franja de título común a las dos hojas: nombre de la ASADA, título del
// reporte y una línea con la cédula jurídica y la fecha de generación.
function escribirEncabezado(
  hoja: Worksheet,
  columnas: number,
  titulo: string,
  meta: MetadatosExportacion,
) {
  const lineas: { texto: string; alto: number; fondo: string; fuente: Partial<Cell['font']> }[] = [
    {
      texto: ASADA_NOMBRE_LEGAL,
      alto: 30,
      fondo: COLOR.primario,
      fuente: { name: FUENTE, size: 16, bold: true, color: { argb: COLOR.blanco } },
    },
    {
      texto: titulo,
      alto: 22,
      fondo: COLOR.secundario,
      fuente: { name: FUENTE, size: 12, bold: true, color: { argb: COLOR.blanco } },
    },
    {
      texto: `Cédula jurídica ${ASADA_CEDULA_JURIDICA} · Generado el ${meta.fechaGeneracion}`,
      alto: 18,
      fondo: COLOR.fondoSuave,
      fuente: { name: FUENTE, size: 9, italic: true, color: { argb: COLOR.textoSuave } },
    },
  ]
  lineas.forEach((linea, i) => {
    const fila = hoja.getRow(i + 1)
    hoja.mergeCells(i + 1, 1, i + 1, columnas)
    const celda = fila.getCell(1)
    celda.value = linea.texto
    celda.font = linea.fuente
    celda.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    rellenar(celda, linea.fondo)
    fila.height = linea.alto
  })
}

function estilizarCabecera(fila: Row, columnas: number) {
  fila.height = 20
  for (let c = 1; c <= columnas; c++) {
    const celda = fila.getCell(c)
    celda.font = { name: FUENTE, size: 11, bold: true, color: { argb: COLOR.blanco } }
    celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    celda.border = BORDE_FINO
    rellenar(celda, COLOR.primario)
  }
}

function estilizarDato(fila: Row, columnas: number, indice: number) {
  for (let c = 1; c <= columnas; c++) {
    const celda = fila.getCell(c)
    celda.font = { name: FUENTE, size: 10, color: { argb: COLOR.texto } }
    celda.border = BORDE_FINO
    // El texto alineado a la izquierda lleva sangría para no pegarse al borde.
    const izquierda = !celda.alignment?.horizontal || celda.alignment.horizontal === 'left'
    celda.alignment = { vertical: 'middle', ...celda.alignment, ...(izquierda && { horizontal: 'left', indent: 1 }) }
    if (indice % 2 === 1) rellenar(celda, COLOR.filaAlterna)
  }
}

function estilizarTotal(fila: Row, columnas: number) {
  for (let c = 1; c <= columnas; c++) {
    const celda = fila.getCell(c)
    celda.font = { name: FUENTE, size: 10, bold: true, color: { argb: COLOR.primario } }
    celda.border = { ...BORDE_FINO, top: { style: 'medium', color: { argb: COLOR.primario } } }
    rellenar(celda, COLOR.fondoSuave)
  }
}

// Tabla de agrupación (por tipo, por estado o por mes) con su total y, si se
// pide, el porcentaje de cada fila sobre ese total.
function escribirAgrupacion(
  hoja: Worksheet,
  filaInicio: number,
  titulo: string,
  etiqueta: string,
  datos: { name: string; cantidad: number }[],
  conPorcentaje: boolean,
): number {
  const columnas = conPorcentaje ? 3 : 2
  const tituloCelda = hoja.getRow(filaInicio).getCell(1)
  tituloCelda.value = titulo
  tituloCelda.font = { name: FUENTE, size: 12, bold: true, color: { argb: COLOR.primario } }
  hoja.getRow(filaInicio).height = 20

  const cabecera = hoja.getRow(filaInicio + 1)
  cabecera.values = conPorcentaje ? [etiqueta, 'Cantidad', 'Porcentaje'] : [etiqueta, 'Cantidad']
  estilizarCabecera(cabecera, columnas)

  const total = datos.reduce((suma, d) => suma + d.cantidad, 0)
  datos.forEach((d, i) => {
    const fila = hoja.getRow(filaInicio + 2 + i)
    fila.getCell(1).value = d.name
    fila.getCell(2).value = d.cantidad
    fila.getCell(2).numFmt = FORMATO_CANTIDAD
    fila.getCell(2).alignment = { horizontal: 'right' }
    if (conPorcentaje) {
      fila.getCell(3).value = total > 0 ? d.cantidad / total : 0
      fila.getCell(3).numFmt = FORMATO_PORCENTAJE
      fila.getCell(3).alignment = { horizontal: 'right' }
    }
    estilizarDato(fila, columnas, i)
  })

  const filaTotal = hoja.getRow(filaInicio + 2 + datos.length)
  filaTotal.getCell(1).value = 'Total'
  filaTotal.getCell(2).value = total
  filaTotal.getCell(2).numFmt = FORMATO_CANTIDAD
  filaTotal.getCell(2).alignment = { horizontal: 'right' }
  if (conPorcentaje) {
    filaTotal.getCell(3).value = total > 0 ? 1 : 0
    filaTotal.getCell(3).numFmt = FORMATO_PORCENTAJE
    filaTotal.getCell(3).alignment = { horizontal: 'right' }
  }
  estilizarTotal(filaTotal, columnas)
  filaTotal.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  // Fila siguiente libre, dejando una en blanco de separación.
  return filaInicio + 2 + datos.length + 2
}

function hojaResumen(libro: Workbook, reporte: ReporteExportable, meta: MetadatosExportacion) {
  const hoja = libro.addWorksheet('Resumen', {
    properties: PROPIEDADES_HOJA,
    views: [{ activeCell: 'A1', showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    headerFooter: PIE_DE_PAGINA,
  })
  hoja.columns = [{ width: 38 }, { width: 16 }, { width: 16 }]
  escribirEncabezado(hoja, 3, `Reporte estadístico de ${meta.modulo}`, meta)

  // Bloque de datos del reporte: lo mismo que se eligió en pantalla.
  const datos: [string, string | number][] = [
    ['Módulo', meta.modulo],
    ['Rango', meta.rangoLabel],
    ['Filtros', meta.filtrosResumen],
    ['Total de registros', reporte.total],
  ]
  datos.forEach(([etiqueta, valor], i) => {
    const fila = hoja.getRow(5 + i)
    hoja.mergeCells(5 + i, 2, 5 + i, 3)
    const celdaEtiqueta = fila.getCell(1)
    celdaEtiqueta.value = etiqueta
    celdaEtiqueta.font = { name: FUENTE, size: 10, bold: true, color: { argb: COLOR.textoSuave } }
    celdaEtiqueta.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    celdaEtiqueta.border = BORDE_FINO
    rellenar(celdaEtiqueta, COLOR.fondoSuave)
    const celdaValor = fila.getCell(2)
    celdaValor.value = valor
    celdaValor.font = { name: FUENTE, size: 10, bold: typeof valor === 'number', color: { argb: COLOR.texto } }
    celdaValor.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    if (typeof valor === 'number') celdaValor.numFmt = FORMATO_CANTIDAD
    for (let c = 2; c <= 3; c++) fila.getCell(c).border = BORDE_FINO
  })

  let siguiente = 5 + datos.length + 1
  siguiente = escribirAgrupacion(hoja, siguiente, reporte.barLabel, 'Categoría', reporte.barData, true)
  siguiente = escribirAgrupacion(hoja, siguiente, reporte.pieLabel, 'Estado', reporte.pieData, true)
  escribirAgrupacion(
    hoja,
    siguiente,
    'Evolución mensual',
    'Mes',
    reporte.evolucionMensual.map((e) => ({ name: e.mes, cantidad: e.cantidad })),
    false,
  )
}

function hojaDetalle(libro: Workbook, reporte: ReporteExportable, meta: MetadatosExportacion) {
  const columnas = reporte.columns.length
  const hoja = libro.addWorksheet('Detalle de registros', {
    properties: PROPIEDADES_HOJA,
    // Sin panel fijo: con el título combinado arriba, Excel 365 repinta mal
    // las filas fijas al subir y el encabezado se ve repetido. Al imprimir, la
    // cabecera de la tabla se repite igual en cada página (printTitlesRow).
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: '5:5',
    },
    headerFooter: PIE_DE_PAGINA,
  })
  escribirEncabezado(hoja, columnas, `Detalle de registros · ${meta.modulo}`, meta)

  const filaCabecera = 5
  const cabecera = hoja.getRow(filaCabecera)
  cabecera.values = reporte.columns.map((c) => c.label)
  estilizarCabecera(cabecera, columnas)

  // Ancho de cada columna según su contenido más largo (con tope).
  const anchos = reporte.columns.map((c) => c.label.length)

  reporte.rows.forEach((registro, i) => {
    const fila = hoja.getRow(filaCabecera + 1 + i)
    reporte.columns.forEach((col, c) => {
      const texto = registro[col.key] ?? ''
      const celda = fila.getCell(c + 1)
      const fecha = aFecha(texto)
      if (fecha) {
        celda.value = fecha
        celda.numFmt = FORMATO_FECHA
        celda.alignment = { horizontal: 'center' }
        anchos[c] = Math.max(anchos[c], 10)
      } else {
        celda.value = texto
        celda.alignment = { horizontal: texto === '—' ? 'center' : 'left' }
        anchos[c] = Math.max(anchos[c], texto.length)
      }
    })
    estilizarDato(fila, columnas, i)
  })

  hoja.columns.forEach((col, c) => {
    col.width = Math.min(Math.max(anchos[c] + 4, 12), 50)
  })

  if (reporte.rows.length > 0) {
    hoja.autoFilter = {
      from: { row: filaCabecera, column: 1 },
      to: { row: filaCabecera + reporte.rows.length, column: columnas },
    }
  }

  const filaTotal = hoja.getRow(filaCabecera + 1 + reporte.rows.length)
  filaTotal.getCell(1).value = 'Total de registros'
  filaTotal.getCell(columnas).value = reporte.rows.length
  filaTotal.getCell(columnas).numFmt = FORMATO_CANTIDAD
  filaTotal.getCell(columnas).alignment = { horizontal: 'right' }
  estilizarTotal(filaTotal, columnas)
  filaTotal.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
}

// Arma el libro completo y lo devuelve como bytes del .xlsx.
export async function construirExcelReporte(
  reporte: ReporteExportable,
  meta: MetadatosExportacion,
): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import('exceljs')
  const libro = new ExcelJS.Workbook()
  libro.creator = ASADA_NOMBRE_LEGAL
  libro.title = `Reporte estadístico de ${meta.modulo}`
  libro.created = new Date()
  // Abre en la hoja Resumen, arriba a la izquierda.
  libro.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: 0, visibility: 'visible' }]
  hojaResumen(libro, reporte, meta)
  hojaDetalle(libro, reporte, meta)
  return (await libro.xlsx.writeBuffer()) as ArrayBuffer
}

export async function generarExcelReporte(
  reporte: ReporteExportable,
  meta: MetadatosExportacion,
): Promise<Blob> {
  const contenido = await construirExcelReporte(reporte, meta)
  return new Blob([contenido], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
