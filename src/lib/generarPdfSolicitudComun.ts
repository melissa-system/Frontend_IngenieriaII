import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { ASADA_NOMBRE_LEGAL, ASADA_CEDULA_JURIDICA } from './asadaInfo.ts'
import { corregirLineaBaseTexto, crearContenedorCaptura } from './aislarEstilosPdf.ts'
import {
  obtenerFechaHoraCostaRica,
  obtenerNombreArchivoCopia,
} from './formatoFechaCostaRica.ts'

export interface DetalleCampoCopia {
  etiqueta: string
  valor: string | number | null | undefined
}

export interface DatosCopiaComun {
  tipoTramite: string
  tipoSlug: string
  codigoSolicitud?: string | null
  fecha?: string | Date | null
  solicitante: {
    nombre: string
    identificacion: string
    telefono?: string | null
    correo?: string | null
    numeroAbonado?: string | null
    direccion?: string | null
  }
  detalles: DetalleCampoCopia[]
  adjuntos?: string[]
  observaciones?: string | null
}

function esc(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const STYLE_COMUN = `
*{box-sizing:border-box}
@page{size:A4;margin:0}
body{margin:0;padding:12px;background:#eee;font-family:Arial,Helvetica,sans-serif;color:#1e293b;font-size:9pt}
.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;border:1.2px solid #334155;border-radius:3mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;padding:8mm 12mm 6mm;position:relative;page-break-after:always}
.page-content{flex:1 1 auto}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:3mm;margin-bottom:3.5mm}
.brand-name{font-size:13.5pt;font-weight:800;color:#0f172a;letter-spacing:-0.5px;margin:0;line-height:1.15}
.brand-sub{font-size:7.5pt;color:#475569;margin-top:1mm;line-height:1.2}
.doc-badge{text-align:right}
.doc-title{font-size:11pt;font-weight:700;color:#0f172a;text-transform:uppercase;margin:0;line-height:1.15}
.doc-subtitle{font-size:7.5pt;font-weight:600;color:#64748b;margin-top:0.5mm;letter-spacing:0.5px;line-height:1.2}
.status-box{margin-bottom:3mm;padding:2.2mm 3.5mm;border-radius:2mm;text-align:center}
.status-registrado{background:#f0fdf4;border:1.5px solid #22c55e;color:#166534}
.status-pendiente{background:#fffbeb;border:1.5px solid #f59e0b;color:#92400e}
.status-title{font-size:9.5pt;font-weight:700;margin:0 0 0.5mm;line-height:1.15;text-align:center}
.status-desc{font-size:8pt;margin:0;line-height:1.15;text-align:center}
.code-value{font-family:monospace;font-size:10.5pt;font-weight:800;letter-spacing:0.5px}
.meta-strip{display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;padding:1.6mm 3.5mm;border-radius:1.5mm;font-size:8pt;line-height:1.15;color:#334155;margin-bottom:3.5mm}
.section{margin-bottom:3.5mm}
.section-head{font-size:8.5pt;font-weight:700;color:#0f172a;text-transform:uppercase;border-bottom:1px solid #cbd5e1;padding-bottom:1mm;margin-bottom:2mm;display:flex;align-items:center;gap:2mm}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:2mm 3.5mm}
.field-box{background:#fcfcfd;border:1px solid #cbd5e1;border-radius:1.5mm;padding:2mm 3mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;min-height:11.5mm;box-sizing:border-box}
.field-label{font-size:6.8pt;font-weight:600;color:#64748b;text-transform:uppercase;display:block;margin:0 0 0.6mm 0;line-height:1.0;text-align:center;width:100%}
.field-val{font-size:8.8pt;font-weight:600;color:#0f172a;word-break:break-word;line-height:1.15;text-align:center;width:100%}
.table-data{width:100%;border-collapse:collapse;margin-top:1.5mm;font-size:8.5pt}
.table-data th{background:#f1f5f9;border:1px solid #cbd5e1;padding:2.2mm 3mm;text-align:center;font-weight:600;color:#334155;font-size:7.5pt;text-transform:uppercase;vertical-align:middle;line-height:1.15}
.table-data td{border:1px solid #cbd5e1;padding:2.2mm 3mm;color:#0f172a;word-break:break-word;text-align:center;vertical-align:middle;line-height:1.25}
.table-data tr:nth-child(even){background:#fafafa}
.attachments-list{margin:0;padding:0;list-style:none;font-size:8pt;line-height:1.25;color:#1e293b;text-align:center}
.attachments-list li{margin:0.5mm 0;text-align:center}
.footer{flex-shrink:0;margin-top:4mm;border-top:1px solid #cbd5e1;padding-top:2mm;text-align:center;font-size:7pt;color:#64748b;line-height:1.25}
`

export function buildHtmlCopiaComun(datos: DatosCopiaComun): string {
  const fechaEmision = obtenerFechaHoraCostaRica(datos.fecha)
  const tieneCodigo = Boolean(datos.codigoSolicitud && datos.codigoSolicitud.trim().length > 0)
  const codigoSeguimiento = datos.codigoSolicitud?.trim() ?? ''

  const detallesHtml = datos.detalles
    .map(
      (d) => `
      <tr>
        <td style="width: 40%; font-weight: 600; color: #334155; text-align: center; vertical-align: middle;">${esc(d.etiqueta)}</td>
        <td style="text-align: center; vertical-align: middle;">${esc(d.valor)}</td>
      </tr>`,
    )
    .join('')

  const adjuntosHtml =
    datos.adjuntos && datos.adjuntos.length > 0
      ? `<ul class="attachments-list">
          ${datos.adjuntos.map((a) => `<li><strong>Documento:</strong> ${esc(a)}</li>`).join('')}
        </ul>`
      : '<p style="font-size: 8pt; color: #64748b; margin: 0; line-height: 1.25; text-align: center;">No se adjuntaron archivos adicionales.</p>'

  const obsHtml = datos.observaciones?.trim()
    ? `<div class="section">
        <div class="section-head">Observaciones adicionales</div>
        <div class="field-box">
          <div class="field-val" style="white-space: pre-wrap; text-align: center;">${esc(datos.observaciones)}</div>
        </div>
      </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Copia de Respaldo - ${esc(datos.tipoTramite)}</title>
  <style>${STYLE_COMUN}</style>
</head>
<body>
  <div class="page">
    <div class="page-content">
      <div class="header">
        <div>
          <h1 class="brand-name">${esc(ASADA_NOMBRE_LEGAL).toUpperCase()}</h1>
          <div class="brand-sub">
            Cédula Jurídica: <strong>${esc(ASADA_CEDULA_JURIDICA)}</strong> &bull; Nicoya, Guanacaste, Costa Rica
          </div>
        </div>
        <div class="doc-badge">
          <h2 class="doc-title">${esc(datos.tipoTramite)}</h2>
          <div class="doc-subtitle">COMPROBANTE DE COPIA DE RESPALDO</div>
        </div>
      </div>

      ${
        tieneCodigo
          ? `<div class="status-box status-registrado">
              <div class="status-title">Solicitud Registrada en el Sistema</div>
              <p class="status-desc">Código de seguimiento oficial: <span class="code-value">${esc(codigoSeguimiento)}</span></p>
            </div>`
          : `<div class="status-box status-pendiente">
              <div class="status-title">Copia de respaldo: solicitud pendiente de registro en el sistema</div>
              <p class="status-desc">Este documento certifica los datos ingresados en el formulario web antes de su registro oficial o en caso de incidencia de red.</p>
            </div>`
      }

      <div class="meta-strip">
        <div><strong>Tipo de trámite:</strong> ${esc(datos.tipoTramite)}</div>
        <div><strong>Fecha y hora (Costa Rica):</strong> ${fechaEmision}</div>
      </div>

      <div class="section">
        <div class="section-head">1. Información del Solicitante / Abonado</div>
        <div class="grid-2">
          <div class="field-box">
            <span class="field-label">Nombre completo / Razón Social</span>
            <span class="field-val">${esc(datos.solicitante.nombre)}</span>
          </div>
          <div class="field-box">
            <span class="field-label">Cédula / Identificación</span>
            <span class="field-val">${esc(datos.solicitante.identificacion)}</span>
          </div>
          <div class="field-box">
            <span class="field-label">Teléfono de contacto</span>
            <span class="field-val">${esc(datos.solicitante.telefono)}</span>
          </div>
          <div class="field-box">
            <span class="field-label">Correo electrónico</span>
            <span class="field-val">${esc(datos.solicitante.correo)}</span>
          </div>
          ${
            datos.solicitante.numeroAbonado
              ? `<div class="field-box">
                  <span class="field-label">Número de abonado asociado</span>
                  <span class="field-val">${esc(datos.solicitante.numeroAbonado)}</span>
                </div>`
              : ''
          }
          ${
            datos.solicitante.direccion
              ? `<div class="field-box" style="grid-column: 1 / -1;">
                  <span class="field-label">Dirección física registrada</span>
                  <span class="field-val">${esc(datos.solicitante.direccion)}</span>
                </div>`
              : ''
          }
        </div>
      </div>

      <div class="section">
        <div class="section-head">2. Detalles y Declaración del Trámite</div>
        <table class="table-data">
          <tbody>
            ${detallesHtml}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-head">3. Documentos y Evidencias Adjuntas</div>
        <div class="field-box">
          ${adjuntosHtml}
        </div>
      </div>

      ${obsHtml}
    </div>

    <div class="footer">
      <strong>Aviso de Validez:</strong> Este documento ha sido generado automáticamente por la plataforma web de la ${esc(ASADA_NOMBRE_LEGAL)} como copia de respaldo para el solicitante.<br>
      La resolución y trámite formal están sujetos a la verificación de requisitos y aprobación reglamentaria de la ASADA. Conserve este comprobante.
    </div>
  </div>
</body>
</html>`
}

export async function generarPdfSolicitudComun(datos: DatosCopiaComun): Promise<Blob> {
  const html = buildHtmlCopiaComun(datos)
  const contenedor = crearContenedorCaptura(html)
  const quitarCorreccionTexto = corregirLineaBaseTexto()

  try {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const paginas = Array.from(contenedor.querySelectorAll<HTMLElement>('.page'))
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    const PAGE_WIDTH_MM = 210
    const PAGE_HEIGHT_MM = 297

    let esPrimeraPagina = true

    for (let i = 0; i < paginas.length; i++) {
      const canvas = await html2canvas(paginas[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const pageHeightPx = Math.floor(canvas.width * (PAGE_HEIGHT_MM / PAGE_WIDTH_MM))

      if (canvas.height <= pageHeightPx + 5) {
        if (!esPrimeraPagina) pdf.addPage()
        esPrimeraPagina = false
        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM)
      } else {
        // El contenido es más largo que una sola hoja A4: se segmenta limpiamente por página
        let positionPx = 0
        while (positionPx < canvas.height) {
          if (!esPrimeraPagina) pdf.addPage()
          esPrimeraPagina = false

          const sliceHeightPx = Math.min(pageHeightPx, canvas.height - positionPx)
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = pageHeightPx
          const ctx = pageCanvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
            ctx.drawImage(
              canvas,
              0, positionPx, canvas.width, sliceHeightPx,
              0, 0, canvas.width, sliceHeightPx,
            )
          }
          const imgData = pageCanvas.toDataURL('image/jpeg', 0.95)
          pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM)
          positionPx += pageHeightPx
        }
      }
    }

    return pdf.output('blob')
  } finally {
    quitarCorreccionTexto()
    if (contenedor.parentNode) {
      document.body.removeChild(contenedor)
    }
  }
}

export function descargarPdfSolicitudComun(
  blob: Blob,
  tipoSlug: string,
  fecha?: Date | string | null,
): void {
  const nombreArchivo = obtenerNombreArchivoCopia(tipoSlug, fecha)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
