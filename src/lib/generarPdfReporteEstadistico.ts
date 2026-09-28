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
    `<div class="donut-wrap"><svg width="34mm" height="34mm" viewBox="0 0 36 36">` +
    `<circle cx="18" cy="18" r="15.9155" fill="none" stroke="#eef3f8" stroke-width="5" />${segmentos}</svg>` +
    `<div class="leyenda">${leyenda}</div></div>`
  )
}

function buildLineChart(data: DatoCategoria[]): string {
  if (data.length === 0) return emptyBlock()
  const W = 300
  const H = 104
  const PL = 10
  const PR = 10
  const PT = 12
  const PB = 22
  const iw = W - PL - PR
  const ih = H - PT - PB
  const max = Math.max(...data.map((d) => d.cantidad), 1)
  const n = data.length
  const xs = data.map((_, i) => {
    if (n === 1) return PL + iw / 2
    return PL + (i / (n - 1)) * iw
  })
  const ys = data.map((d) => PT + ih - (d.cantidad / max) * ih)
  const puntos = xs.map((x, i) => `${x.toFixed(2)},${ys[i].toFixed(2)}`)
  const area =
    n === 1
      ? `M${xs[0].toFixed(2)},${PT + ih} L${xs[0].toFixed(2)},${ys[0].toFixed(2)} ${xs[0].toFixed(2)},${PT + ih} Z`
      : `M${PL},${PT + ih} L${puntos.join(' L')} L${xs[n - 1].toFixed(2)},${PT + ih} Z`

  // Las etiquetas de meses y valores se dibujan como HTML posicionado (no
  // como <text> SVG): html2canvas no rasteriza el texto SVG de forma fiable.
  const pasoEtiquetas = Math.max(1, Math.ceil(n / 14))
  const etiquetas = data
    .map((d, i) => {
      const mostrar = n <= 14 || i % pasoEtiquetas === 0 || i === n - 1
      if (!mostrar) return ''
      return (
        `<span class="line-label" style="left:${((xs[i] / W) * 100).toFixed(2)}%;top:${((98 / H) * 100).toFixed(2)}%">${esc(d.name)}</span>`
      )
    })
    .join('')
  const valores = n <= 18
    ? data
        .map(
          (d, i) =>
            `<span class="line-value" style="left:${((xs[i] / W) * 100).toFixed(2)}%;top:${((ys[i] / H) * 100).toFixed(2)}%">${d.cantidad}</span>`,
        )
        .join('')
    : ''
  const circulos = puntos
    .map((_, i) => `<circle cx="${xs[i].toFixed(2)}" cy="${ys[i].toFixed(2)}" r="2.4" fill="${color(i)}" />`)
    .join('')

  return (
    `<div class="line-wrap">` +
    `<svg width="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">` +
    `<polygon points="${area}" fill="#6a87a1" fill-opacity="0.22" />` +
    `<polyline points="${puntos.join(' ')}" fill="none" stroke="#073763" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />` +
    `${circulos}</svg>` +
    `<div class="line-overlay">${etiquetas}${valores}</div>` +
    `</div>`
  )
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
    `<div class="chart"><h2>${esc(r.barLabel)}</h2>${buildBarChart(r.barData)}</div>` +
    `<div class="chart"><h2>${esc(r.pieLabel)}</h2>${buildDonut(r.pieData, total)}</div>` +
    `<div class="chart"><h2>Evolución mensual</h2>${buildLineChart(r.evolucionMensual)}</div>` +
    `<div class="chart"><h2>Distribución de estados</h2>${buildStacked(r.pieData, total)}</div>` +
    `</div>` +
    (total === 0 ? '<div class="empty aviso">No hay registros que detallar; la tabla se omite.</div>' : '')
  )
}

function buildTablePages(m: ParametrosReportePdf, totalPaginas: number): string {
  const r = m.reporte
  const cabecera = r.columns.map((c) => `<th>${esc(c.label)}</th>`).join('')
  const paginas: string[] = []
  const numPaginas = r.rows.length === 0 ? 0 : Math.ceil(r.rows.length / ROWS_POR_PAGINA)
  for (let p = 0; p < numPaginas; p++) {
    const filas = r.rows
      .slice(p * ROWS_POR_PAGINA, (p + 1) * ROWS_POR_PAGINA)
      .map(
        (fila) =>
          `<tr>${r.columns.map((c) => `<td>${esc(fila[c.key] ?? '')}</td>`).join('')}</tr>`,
      )
      .join('')
    paginas.push(
      `<section class="page">` +
        buildHead(`Detalle de registros · ${esc(m.modulo)}`, `${esc(m.rango)} · ${esc(m.filtros)}`) +
        `<div class="tabla-wrap"><table><thead><tr>${cabecera}</tr></thead><tbody>${filas}</tbody></table></div>` +
        buildFooter(2 + p, totalPaginas) +
        `</section>`,
    )
  }
  return paginas.join('')
}

function buildFooter(numero: number, total: number): string {
  return (
    `<div class="footer"><span>${esc(ASADA_NOMBRE_LEGAL)} · Reporte estadístico</span>` +
    `<span>Página ${numero} de ${total}</span></div>`
  )
}

function buildHtml(m: ParametrosReportePdf): string {
  const totalPaginas = 1 + (m.reporte.rows.length === 0 ? 0 : Math.ceil(m.reporte.rows.length / ROWS_POR_PAGINA))
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><style>${STYLE}</style></head><body>
<section class="page">
${buildHead('Reporte estadístico', `Generado el ${esc(m.fechaGeneracion)}`)}
${buildBodyContent(m)}
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
.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;background:#f2f6fa;border:1px solid #dbe6ee;border-radius:3mm;padding:3mm 4mm;margin-top:4mm}
.meta label{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#5a6f83;margin-bottom:1mm}
.meta strong{color:#1e2a39;font-size:10px;word-break:break-word}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin-top:3.5mm}
.card{border:1px solid #dbe6ee;border-radius:3mm;padding:2.5mm 3mm}
.card label{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#5a6f83}
.card strong{display:block;color:#073763;font-size:16px;margin-top:1mm}
.card strong.corto{font-size:11px;line-height:1.3}
.card small{font-size:8px;color:#6a87a1}
.charts{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm;margin-top:4mm}
.chart{border:1px solid #dbe6ee;border-radius:3mm;padding:2.8mm 3mm;min-width:0}
.chart h2{font-size:10px;color:#073763;margin:0 0 2mm}
.bar-row{display:grid;grid-template-columns:76mm 1fr 11mm;align-items:center;gap:2mm;margin-bottom:1.7mm}
.bar-name{font-size:8.5px;color:#1e2a39;line-height:1.15;word-break:break-word}
.bar-track{background:#eef3f8;border-radius:2mm;height:4.5mm;overflow:hidden}
.bar-fill{background:#073763;height:100%;border-radius:2mm}
.bar-val{font-weight:bold;font-size:9px;text-align:right}
.donut-wrap{display:flex;gap:4mm;align-items:center}
.leyenda{display:flex;flex-direction:column;gap:1mm;min-width:0}
.leyenda-item{display:flex;align-items:center;gap:1.5mm;font-size:8px;color:#1e2a39}
.swatch{width:3mm;height:3mm;border-radius:.8mm;flex:0 0 auto}
.leyenda-cant{margin-left:auto;color:#5a6f83;white-space:nowrap}
.stack .stack-track{display:flex;height:6mm;border-radius:2mm;overflow:hidden;background:#eef3f8}
.stack-seg{height:100%}
.stack .leyenda{flex-direction:row;flex-wrap:wrap;gap:1mm 3mm;margin-top:2mm}
.line-wrap{position:relative}
.line-wrap svg{display:block;width:100%;height:auto}
.line-overlay{position:absolute;inset:0;pointer-events:none}
.line-label{position:absolute;font-size:6.5px;color:#5a6f83;transform:translate(-50%,-50%);white-space:nowrap}
.line-value{position:absolute;font-size:6px;font-weight:bold;color:#073763;transform:translate(-50%,-50%);white-space:nowrap}
.empty{color:#8aa2b6;border:1px dashed #d3e0e9;border-radius:2mm;padding:8mm 4mm;text-align:center;font-size:9.5px}
.empty.aviso{margin-top:4mm;padding:3mm}
.tabla-wrap{margin-top:4mm}
table{width:100%;border-collapse:collapse;font-size:8.6px}
th{background:#073763;color:#fff;text-align:left;padding:1.8mm 2mm;font-weight:bold;font-size:8.6px}
td{border-bottom:1px solid #e4ecf3;padding:1.7mm 2mm;color:#1e2a39;word-break:break-word}
tr:nth-child(even) td{background:#f7fafc}
.footer{position:absolute;left:12mm;right:12mm;bottom:6mm;display:flex;justify-content:space-between;font-size:8px;color:#6a87a1;border-top:1px solid #e4ecf3;padding-top:1.6mm}
`

export function renderReporteHtml(m: ParametrosReportePdf): string {
  return buildHtml(m)
}

export async function generarPdfReporteEstadistico(m: ParametrosReportePdf): Promise<Blob> {
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