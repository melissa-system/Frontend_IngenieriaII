import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { ASADA_NOMBRE_LEGAL, ASADA_CEDULA_JURIDICA } from './asadaInfo.ts'
import { crearContenedorCaptura } from './aislarEstilosPdf.ts'
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
body{margin:0;padding:16px;background:#eee;font-family:Arial,Helvetica,sans-serif;color:#1e293b;font-size:10pt}
.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;border:1.2px solid #334155;border-radius:3mm;overflow:hidden;position:relative;padding:12mm 15mm;page-break-after:always}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:5mm;margin-bottom:6mm}
.brand-name{font-size:16pt;font-weight:800;color:#0f172a;letter-spacing:-0.5px;margin:0}
.brand-sub{font-size:8.5pt;color:#475569;margin-top:1.5mm}
.doc-badge{text-align:right}
.doc-title{font-size:12pt;font-weight:700;color:#0f172a;text-transform:uppercase;margin:0}
.doc-subtitle{font-size:8pt;font-weight:600;color:#64748b;margin-top:1mm;letter-spacing:0.5px}
.status-box{margin-bottom:5mm;padding:3.5mm 4.5mm;border-radius:2mm}
.status-registrado{background:#f0fdf4;border:1.5px solid #22c55e;color:#166534}
.status-pendiente{background:#fffbeb;border:1.5px solid #f59e0b;color:#92400e}
.status-title{font-size:10.5pt;font-weight:700;margin:0 0 1mm}
.status-desc{font-size:8.5pt;margin:0}
.code-value{font-family:monospace;font-size:11.5pt;font-weight:800;letter-spacing:0.5px}
.meta-strip{display:flex;justify-content:space-between;background:#f8fafc;border:1px solid #e2e8f0;padding:2.5mm 4mm;border-radius:1.5mm;font-size:8.5pt;color:#334155;margin-bottom:5mm}
.section{margin-bottom:5mm}
.section-head{font-size:10pt;font-weight:700;color:#0f172a;text-transform:uppercase;border-bottom:1px solid #cbd5e1;padding-bottom:1.5mm;margin-bottom:3mm;display:flex;align-items:center;gap:2mm}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:2.5mm 5mm}
.field-box{background:#fcfcfd;border:1px solid #e2e8f0;border-radius:1.5mm;padding:2mm 3mm}
.field-label{font-size:7.5pt;font-weight:600;color:#64748b;text-transform:uppercase;display:block;margin-bottom:0.5mm}
.field-val{font-size:9pt;font-weight:500;color:#0f172a;word-break:break-word}
.table-data{width:100%;border-collapse:collapse;margin-top:2mm;font-size:9pt}
.table-data th{background:#f1f5f9;border:1px solid #cbd5e1;padding:2mm 3mm;text-align:left;font-weight:600;color:#334155;font-size:8pt;text-transform:uppercase}
.table-data td{border:1px solid #e2e8f0;padding:2mm 3mm;color:#0f172a}
.table-data tr:nth-child(even){background:#fafafa}
.attachments-list{margin:0;padding-left:5mm;font-size:8.5pt;color:#1e293b}
.attachments-list li{margin-bottom:1.5mm}
.footer{position:absolute;left:15mm;right:15mm;bottom:8mm;border-top:1px solid #cbd5e1;padding-top:2.5mm;text-align:center;font-size:7.5pt;color:#64748b;line-height:1.3}
`

export function buildHtmlCopiaComun(datos: DatosCopiaComun): string {
  const fechaEmision = obtenerFechaHoraCostaRica(datos.fecha)
  const tieneCodigo = Boolean(datos.codigoSolicitud && datos.codigoSolicitud.trim().length > 0)
  const codigoSeguimiento = datos.codigoSolicitud?.trim() ?? ''

  const detallesHtml = datos.detalles
    .map(
      (d) => `
      <tr>
        <td style="width: 38%; font-weight: 600; color: #334155;">${esc(d.etiqueta)}</td>
        <td>${esc(d.valor)}</td>
      </tr>`,
    )
    .join('')

  const adjuntosHtml =
    datos.adjuntos && datos.adjuntos.length > 0
      ? `<ul class="attachments-list">
          ${datos.adjuntos.map((a) => `<li><strong>Documento:</strong> ${esc(a)}</li>`).join('')}
        </ul>`
      : '<p style="font-size: 8.5pt; color: #64748b; margin: 0;">No se adjuntaron archivos adicionales.</p>'

  const obsHtml = datos.observaciones?.trim()
    ? `<div class="section">
        <div class="section-head">Observaciones adicionales</div>
        <div class="field-box">
          <div class="field-val" style="white-space: pre-wrap;">${esc(datos.observaciones)}</div>
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

  try {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const paginas = Array.from(contenedor.querySelectorAll<HTMLElement>('.page'))
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })

    for (let i = 0; i < paginas.length; i++) {
      const canvas = await html2canvas(paginas[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
    }

    return pdf.output('blob')
  } finally {
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
