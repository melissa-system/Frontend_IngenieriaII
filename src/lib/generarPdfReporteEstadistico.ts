import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { ASADA_NOMBRE_LEGAL, ASADA_CEDULA_JURIDICA } from './asadaInfo'

// PDF del Reporte Estadístico (A4), mismo enfoque que generarPdfConexion.ts:
// se construye un contenedor oculto con el documento completo en HTML/CSS,
// se capturan sus páginas con html2canvas y se empaquetan con jsPDF.
//
// Los gráficos se dibujan con HTML/CSS puro (barras, dona SVG, línea SVG y
// barra apilada) en lugar de recharts, porque html2canvas no rasteriza de
// forma confiable el SVG de recharts dentro de la página.

export interface DatoCategoria {
  name: string
  cantidad: number
}

export interface ColumnaReporte {
  key: string
  label: string
}

export interface ReporteEstadisticoPdf {
  total: number
  barLabel: string
  pieLabel: string
  barData: DatoCategoria[]
  pieData: DatoCategoria[]
  evolucionMensual: DatoCategoria[]
  columns: ColumnaReporte[]
  rows: Record<string, string>[]
}

export interface ParametrosReportePdf {
  modulo: string
  rango: string
  filtros: string
  fechaGeneracion: string
  reporte: ReporteEstadisticoPdf
}

const PDF_COLORS = ['#073763', '#13416b', '#395f82', '#6a87a1', '#9cafc1']

const ROWS_POR_PAGINA = 34
const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297

function esc(valor: string | null | undefined): string {
  if (!valor) return ''
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pct(cantidad: number, base: number): number {
  return base > 0 ? (cantidad / base) * 100 : 0
}

function emptyBlock(): string {
  return '<div class="empty">No se encontraron registros para los filtros seleccionados.</div>'
}

function color(i: number): string {
  return PDF_COLORS[i % PDF_COLORS.length]
}

function buildBarChart(data: DatoCategoria[]): string {
  if (data.length === 0) return emptyBlock()
  const max = Math.max(...data.map((d) => d.cantidad), 1)
  return data
    .map(
      (d, i) =>
        `<div class="bar-row"><span class="bar-name">${esc(d.name)}</span>` +
        `<div class="bar-track"><div class="bar-fill" style="width:${pct(d.cantidad, max).toFixed(1)}%"></div></div>` +
        `<span class="bar-val" style="color:${color(i)}">${d.cantidad}</span></div>`,
    )
    .join('')
}

function buildDonut(data: DatoCategoria[], total: number): string {
  if (data.length === 0 || total === 0) return emptyBlock()
  let acumulado = 0
  const segmentos = data
    .map((d, i) => {
      const porcion = pct(d.cantidad, total)
      const seg =
        `<circle cx="18" cy="18" r="15.9155" fill="none" stroke="${color(i)}" stroke-width="5" ` +
        `stroke-dasharray="${porcion.toFixed(3)} ${(100 - porcion).toFixed(3)}" ` +
        `stroke-dashoffset="${(-acumulado).toFixed(3)}" transform="rotate(-90 18 18)" />`
      acumulado += porcion
      return seg
    })
    .join('')
  const leyenda = data
    .map(
      (d, i) =>
        `<div class="leyenda-item"><span class="swatch" style="background:${color(i)}"></span>` +
        `<span>${esc(d.name)}</span><span class="leyenda-cant">${d.cantidad} (${pct(d.cantidad, total).toFixed(1)}%)</span></div>`,
    )
    .join('')
  return (
    `<div class="donut-wrap"><svg class="donut" width="96" height="96" viewBox="-1 -1 38 38">` +
    `<circle cx="18" cy="18" r="15.9155" fill="none" stroke="#eef3f8" stroke-width="5" />${segmentos}</svg>` +
    `<div class="leyenda">${leyenda}</div></div>`
  )
}

// Evolución mensual como columnas en HTML/CSS: se lee bien con un solo mes
// (una línea de un punto quedaba vacía) y html2canvas la rasteriza sin
// depender de texto SVG.
function buildColumnChart(data: DatoCategoria[]): string {
  if (data.length === 0) return emptyBlock()
  const max = Math.max(...data.map((d) => d.cantidad), 1)
  const mostrarEtiqueta = (i: number) =>
    data.length <= 12 || i % Math.ceil(data.length / 12) === 0 || i === data.length - 1
  const columnas = data
    .map(
      (d, i) =>
        `<div class="col"><span class="col-val">${d.cantidad}</span>` +
        `<div class="col-bar" style="height:${Math.max(pct(d.cantidad, max), 2).toFixed(1)}%"></div>` +
        `<span class="col-label">${mostrarEtiqueta(i) ? esc(d.name) : ''}</span></div>`,
    )
    .join('')
  return `<div class="cols">${columnas}</div>`
}

function buildStacked(data: DatoCategoria[], total: number): string {
  if (data.length === 0 || total === 0) return emptyBlock()
  const segmentos = data
    .map(
      (d, i) =>
        `<div class="stack-seg" style="width:${pct(d.cantidad, total).toFixed(2)}%;background:${color(i)}"></div>`,
    )
    .join('')
  const leyenda = data
    .map(
      (d, i) =>
        `<div class="leyenda-item"><span class="swatch" style="background:${color(i)}"></span>` +
        `<span>${esc(d.name)}</span><span class="leyenda-cant">${pct(d.cantidad, total).toFixed(1)}%</span></div>`,
    )
    .join('')
  return `<div class="stack"><div class="stack-track">${segmentos}</div><div class="leyenda">${leyenda}</div></div>`
}

function buildHead(titulo: string, datoAdicional?: string): string {
  return (
    `<div class="head">` +
    `<div class="brand"><div class="nombre">${esc(ASADA_NOMBRE_LEGAL)}</div>` +
    `<div class="lema">Cédula jurídica ${esc(ASADA_CEDULA_JURIDICA)}</div></div>` +
    `<div class="titulo"><h1>${esc(titulo)}</h1>${datoAdicional ? `<p>${esc(datoAdicional)}</p>` : ''}</div>` +
    `</div>`
  )
}

function buildBodyContent(m: ParametrosReportePdf): string {
  const r = m.reporte
  const total = r.total
  const comun =
    r.barData.length > 0
      ? [...r.barData].sort((a, b) => b.cantidad - a.cantidad)[0].name
      : 'Sin datos'
  return (
    `<div class="meta">` +
    `<div><label>Módulo</label><strong>${esc(m.modulo)}</strong></div>` +
    `<div><label>Rango</label><strong>${esc(m.rango)}</strong></div>` +
    `<div><label>Filtros</label><strong>${esc(m.filtros)}</strong></div>` +
    `<div><label>Registros</label><strong>${total}</strong></div>` +
    `</div>` +
    `<div class="cards">` +
    `<div class="card"><label>Total de registros</label><strong>${total}</strong><small>${esc(m.modulo)}</small></div>` +
    `<div class="card"><label>Categoría más común</label><strong class="corto">${esc(comun)}</strong><small>${esc(r.barLabel)}</small></div>` +
    `<div class="card"><label>Estados distintos</label><strong>${r.pieData.length}</strong><small>${esc(r.pieLabel)}</small></div>` +
    `</div>` +
    `<div class="charts">` +
    `<div class="chart"><h2>${esc(r.barLabel)}</h2><div class="chart-body">${buildBarChart(r.barData)}</div></div>` +
    `<div class="chart"><h2>${esc(r.pieLabel)}</h2><div class="chart-body">${buildDonut(r.pieData, total)}</div></div>` +
    `<div class="chart"><h2>Evolución mensual</h2><div class="chart-body">${buildColumnChart(r.evolucionMensual)}</div></div>` +
    `<div class="chart"><h2>Distribución de estados</h2><div class="chart-body">${buildStacked(r.pieData, total)}</div></div>` +
    `</div>` +
    (total === 0 ? '<div class="empty aviso">No hay registros que detallar; la tabla se omite.</div>' : '')
  )
}

// La primera página lleva el resumen y, debajo, las primeras filas del
// detalle; así un reporte corto cabe en una sola hoja en vez de dejar media
// página en blanco y otra casi vacía solo para la tabla.
const ROWS_PRIMERA_PAGINA = 13

function buildTabla(m: ParametrosReportePdf, filas: Record<string, string>[]): string {
  const r = m.reporte
  const cabecera = r.columns.map((c) => `<th>${esc(c.label)}</th>`).join('')
  const cuerpo = filas
    .map((fila) => `<tr>${r.columns.map((c) => `<td>${esc(fila[c.key] ?? '')}</td>`).join('')}</tr>`)
    .join('')
  return `<div class="tabla-wrap"><table><thead><tr>${cabecera}</tr></thead><tbody>${cuerpo}</tbody></table></div>`
}

function filasRestantes(m: ParametrosReportePdf): Record<string, string>[][] {
  const resto = m.reporte.rows.slice(ROWS_PRIMERA_PAGINA)
  const paginas: Record<string, string>[][] = []
  for (let i = 0; i < resto.length; i += ROWS_POR_PAGINA) {
    paginas.push(resto.slice(i, i + ROWS_POR_PAGINA))
  }
  return paginas
}

function buildTablePages(m: ParametrosReportePdf, totalPaginas: number): string {
  return filasRestantes(m)
    .map(
      (filas, p) =>
        `<section class="page">` +
        buildHead(`Detalle de registros · ${m.modulo}`, `${m.rango} · ${m.filtros}`) +
        buildTabla(m, filas) +
        buildFooter(2 + p, totalPaginas) +
        `</section>`,
    )
    .join('')
}

function buildFooter(numero: number, total: number): string {
  return (
    `<div class="footer"><span>${esc(ASADA_NOMBRE_LEGAL)} · Reporte estadístico</span>` +
    `<span>Página ${numero} de ${total}</span></div>`
  )
}

function buildHtml(m: ParametrosReportePdf): string {
  const totalPaginas = 1 + filasRestantes(m).length
  const primeras = m.reporte.rows.slice(0, ROWS_PRIMERA_PAGINA)
  const detalle =
    primeras.length > 0
      ? `<h2 class="tabla-titulo">Detalle de registros</h2>${buildTabla(m, primeras)}`
      : ''
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><style>${STYLE}</style></head><body>
<section class="page">
${buildHead('Reporte estadístico', `Generado el ${esc(m.fechaGeneracion)}`)}
${buildBodyContent(m)}
${detalle}
${buildFooter(1, totalPaginas)}
</section>
${buildTablePages(m, totalPaginas)}
</body></html>`
}

const STYLE = `
@page{size:A4;margin:0}
*{box-sizing:border-box}
body{margin:0;padding:18px;background:#e8eef4;font-family:Arial,Helvetica,sans-serif;color:#1e2a39;font-size:10.5px}
.page{width:210mm;min-height:297mm;margin:0 auto 18px;background:#fff;border:1px solid #c9d6e0;border-radius:4mm;overflow:hidden;position:relative;padding:12mm 12mm 16mm;page-break-after:always}
.page:last-child{page-break-after:auto}
.head{display:flex;align-items:center;gap:4mm;border-bottom:2px solid #073763;padding-bottom:4mm}
.brand{display:flex;flex-direction:column}
.brand .nombre{font-weight:bold;font-size:15px;color:#073763;letter-spacing:.3px}
.brand .lema{font-size:8px;color:#6a87a1}
.titulo{margin-left:auto;text-align:right}
.titulo h1{font-size:14px;color:#073763;margin:0}
.titulo p{margin:2px 0 0;font-size:9px;color:#5a6f83}
.meta{display:grid;grid-template-columns:.9fr 1.7fr 2fr .7fr;gap:3mm;background:#f2f6fa;border:1px solid #dbe6ee;border-radius:3mm;padding:3mm 4mm;margin-top:4mm}
.meta label{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#5a6f83;margin-bottom:1mm}
.meta strong{color:#1e2a39;font-size:10px;word-break:break-word}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin-top:3.5mm}
.card{border:1px solid #dbe6ee;border-radius:3mm;padding:2.5mm 3mm}
.card label{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#5a6f83}
.card strong{display:block;color:#073763;font-size:16px;margin-top:1mm}
.card strong.corto{font-size:11px;line-height:1.3}
.card small{font-size:8px;color:#6a87a1}
.charts{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm;margin-top:4mm}
.chart{border:1px solid #dbe6ee;border-radius:3mm;padding:3mm 3.5mm;min-width:0;height:52mm;display:flex;flex-direction:column}
.chart-body{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center}
.chart h2{font-size:10px;line-height:4mm;color:#073763;margin:0 0 2mm}
.bar-row{display:grid;grid-template-columns:30mm 1fr 8mm;align-items:center;gap:2mm;height:4mm;margin:.8mm 0}
.bar-name{font-size:8.5px;color:#1e2a39;line-height:4mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar-track{background:#eef3f8;border-radius:2mm;height:3.6mm;overflow:hidden}
.bar-fill{background:#073763;height:100%;border-radius:2mm}
.bar-val{font-weight:bold;font-size:9px;line-height:4mm;text-align:right}
.donut-wrap{display:flex;gap:5mm;align-items:center}
.donut{width:96px;height:96px;flex:0 0 auto}
.leyenda{display:flex;flex-direction:column;gap:1.4mm;min-width:0;flex:1}
.leyenda-item{display:flex;align-items:center;gap:1.5mm;height:3.6mm;line-height:3.6mm;font-size:8px;color:#1e2a39;white-space:nowrap}
.swatch{width:2.6mm;height:2.6mm;border-radius:.6mm;flex:0 0 auto}
.leyenda-cant{margin-left:auto;color:#5a6f83;white-space:nowrap}
.stack .stack-track{display:flex;height:6mm;border-radius:2mm;overflow:hidden;background:#eef3f8}
.stack-seg{height:100%}
.stack .leyenda{flex-direction:row;flex-wrap:wrap;gap:1mm 4mm;margin-top:3mm}
.cols{display:flex;align-items:flex-end;gap:2mm;height:34mm;padding-top:5mm;margin-bottom:5mm;border-bottom:1px solid #dbe6ee}
.col{flex:1 1 0;min-width:0;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;position:relative}
.col-bar{width:70%;max-width:12mm;background:#073763;border-radius:1.2mm 1.2mm 0 0}
.col-val{font-size:8px;line-height:3.5mm;font-weight:bold;color:#073763;margin-bottom:.6mm}
.col-label{position:absolute;bottom:-4.5mm;font-size:7px;line-height:3.5mm;color:#5a6f83;white-space:nowrap}
.empty{color:#8aa2b6;border:1px dashed #d3e0e9;border-radius:2mm;padding:8mm 4mm;text-align:center;font-size:9.5px}
.empty.aviso{margin-top:4mm;padding:3mm}
.tabla-wrap{margin-top:4mm}
.tabla-titulo{font-size:10px;color:#073763;margin:5mm 0 0}
table{width:100%;border-collapse:collapse;font-size:8.6px}
th{background:#073763;color:#fff;text-align:left;padding:1.8mm 2mm;font-weight:bold;font-size:8.6px}
td{border-bottom:1px solid #e4ecf3;padding:1.7mm 2mm;color:#1e2a39;word-break:break-word}
tr:nth-child(even) td{background:#f7fafc}
.footer{position:absolute;left:12mm;right:12mm;bottom:6mm;display:flex;justify-content:space-between;font-size:8px;color:#6a87a1;border-top:1px solid #e4ecf3;padding-top:1.6mm}
`

export function renderReporteHtml(m: ParametrosReportePdf): string {
  return buildHtml(m)
}

// html2canvas mide la línea base de cada fuente con una imagen de prueba
// (un GIF de 1x1) que inserta en el documento. El preflight de Tailwind deja
// toda <img> en display:block, esa medición sale corrida y todo el texto del
// PDF queda unos píxeles más abajo que barras, leyendas y puntos. Mientras se
// captura se devuelve esa imagen de prueba a su comportamiento en línea.
const IMAGEN_PRUEBA_HTML2CANVAS =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
export const CSS_CORRECCION_LINEA_BASE = `img[src="${IMAGEN_PRUEBA_HTML2CANVAS}"]{display:inline !important}`

export async function generarPdfReporteEstadistico(m: ParametrosReportePdf): Promise<Blob> {
  const correccion = document.createElement('style')
  correccion.textContent = CSS_CORRECCION_LINEA_BASE
  document.head.appendChild(correccion)

  const contenedor = document.createElement('div')
  contenedor.style.position = 'fixed'
  contenedor.style.left = '-99999px'
  contenedor.style.top = '0'
  contenedor.innerHTML = buildHtml(m)
  document.body.appendChild(contenedor)

  try {
    // Esperar un frame para que el layout (grid/flex) termine de calcularse.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    const paginas = Array.from(contenedor.querySelectorAll<HTMLElement>('.page'))
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })

    for (let i = 0; i < paginas.length; i++) {
      const canvas = await html2canvas(paginas[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      // JPEG (no PNG): jsPDF v4 incrusta el PNG como stream RGB crudo y un
      // PDF de 4 páginas A4 supera los 40 MB.
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM)
    }

    return pdf.output('blob')
  } finally {
    document.body.removeChild(contenedor)
    correccion.remove()
  }
}

export function descargarPdfReporte(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}