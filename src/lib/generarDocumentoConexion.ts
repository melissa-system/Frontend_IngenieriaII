import {
  AlignmentType,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
} from 'docx'
import { ASADA_CEDULA_JURIDICA, ASADA_NOMBRE_LEGAL } from './generarDocumentoSolicitud'
import {
  etiquetaFormaPago,
  etiquetaMedioNotificacion,
  etiquetaServicioSolicitado,
  etiquetaTipoTramite,
  type SolicitudConexion,
} from '../components/Services/conexionPajaAgua.service'

// Documento Word (.docx) de la Solicitud de conexión de servicio (segunda
// parte del trámite de paja de agua), a partir de la sección IV-VII del
// formulario GNU-42-01-F1 de AyA adaptado para ASADA Pueblo Nuevo. Sigue el
// mismo criterio visual que generarDocumentoSolicitud.ts (el machote de la
// primera parte), con helpers propios para no modificar ese archivo.

const AZUL_OSCURO = '0F3D5C'
const GRIS_ETIQUETA = '667788'
const GRIS_BORDE = 'D7E2EA'
const NEGRO_TEXTO = '1C2B3A'

const BORDE_CELDA = {
  top: { style: BorderStyle.SINGLE, size: 2, color: GRIS_BORDE },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: GRIS_BORDE },
  left: { style: BorderStyle.SINGLE, size: 2, color: GRIS_BORDE },
  right: { style: BorderStyle.SINGLE, size: 2, color: GRIS_BORDE },
}

const ANCHO_PAGINA = 12240
const MARGEN = 1440
const ANCHO_UTIL = ANCHO_PAGINA - MARGEN * 2

function valorOGuion(valor: string | null | undefined): string {
  return valor && valor.trim() !== '' ? valor : '—'
}

function encabezadoSeccion(texto: string): Table {
  return new Table({
    width: { size: ANCHO_UTIL, type: WidthType.DXA },
    columnWidths: [ANCHO_UTIL],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: ANCHO_UTIL, type: WidthType.DXA },
            shading: { fill: AZUL_OSCURO, type: ShadingType.CLEAR, color: 'auto' },
            margins: { top: 80, bottom: 80, left: 150, right: 150 },
            borders: BORDE_CELDA,
            children: [
              new Paragraph({
                children: [new TextRun({ text: texto, bold: true, color: 'FFFFFF', size: 20 })],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function celdaCampo(etiqueta: string, valor: string, ancho: number): TableCell {
  return new TableCell({
    width: { size: ancho, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    borders: BORDE_CELDA,
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: etiqueta.toUpperCase(), bold: true, size: 14, color: GRIS_ETIQUETA }),
        ],
      }),
      new Paragraph({
        spacing: { before: 40 },
        children: [new TextRun({ text: valorOGuion(valor), bold: true, size: 21, color: NEGRO_TEXTO })],
      }),
    ],
  })
}

function filaCampos(campos: Array<[string, string]>): Table {
  const ancho = Math.floor(ANCHO_UTIL / campos.length)
  const anchos = campos.map((_, i) =>
    i === campos.length - 1 ? ANCHO_UTIL - ancho * (campos.length - 1) : ancho,
  )
  return new Table({
    width: { size: ANCHO_UTIL, type: WidthType.DXA },
    columnWidths: anchos,
    rows: [
      new TableRow({
        children: campos.map(([etiqueta, valor], i) => celdaCampo(etiqueta, valor, anchos[i])),
      }),
    ],
  })
}

function espacio(alto = 100): Paragraph {
  return new Paragraph({ spacing: { after: alto }, children: [] })
}

function formatearFecha(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  if (Number.isNaN(d.getTime())) return String(fecha)
  return d.toLocaleString('es-CR', { dateStyle: 'long', timeStyle: 'short' })
}

export async function generarDocumentoConexion(solicitud: SolicitudConexion): Promise<Blob> {
  const hijos: (Paragraph | Table)[] = []

  hijos.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: ASADA_NOMBRE_LEGAL.toUpperCase(), bold: true, size: 30, color: AZUL_OSCURO }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: `Cédula jurídica ${ASADA_CEDULA_JURIDICA}`, size: 18, color: GRIS_ETIQUETA }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: 'Solicitud de conexión de servicio', bold: true, size: 26, color: NEGRO_TEXTO }),
      ],
    }),
    filaCampos([
      ['Código de solicitud', solicitud.codigo_solicitud],
      ['Fecha', formatearFecha(solicitud.fecha_creacion)],
    ]),
    espacio(150),

    encabezadoSeccion('I. Solicitud de paja de agua relacionada'),
    espacio(60),
    filaCampos([
      ['Código de la solicitud original', solicitud.solicitud_paja_agua_codigo],
      ['Abonado', `${solicitud.nombre_abonado} (${solicitud.numero_abonado})`],
    ]),
    espacio(150),

    encabezadoSeccion('II. Medio para notificación'),
    espacio(60),
    filaCampos([
      [
        'Medio principal',
        `${etiquetaMedioNotificacion(solicitud.medio_notificacion_principal)}: ${solicitud.valor_notificacion_principal}`,
      ],
      [
        'Medio secundario',
        solicitud.medio_notificacion_secundario
          ? `${etiquetaMedioNotificacion(solicitud.medio_notificacion_secundario)}: ${solicitud.valor_notificacion_secundario}`
          : '—',
      ],
    ]),
    espacio(150),

    encabezadoSeccion('III. Información adicional del inmueble'),
    espacio(60),
    filaCampos([
      ['Folio real / Concesión / Arriendo', solicitud.folio_real ?? ''],
      ['Plano catastro', solicitud.plano_catastro ?? ''],
    ]),
    espacio(60),
    filaCampos([
      ['Plano de agrimensura', solicitud.plano_agrimensura ?? ''],
      ['Número de disponibilidad', solicitud.numero_disponibilidad],
    ]),
    espacio(60),
    filaCampos([['Número de NIS', solicitud.numero_nis ?? '']]),
    espacio(150),

    encabezadoSeccion('IV. Propósito de la solicitud'),
    espacio(60),
    filaCampos([
      ['Servicio solicitado', etiquetaServicioSolicitado(solicitud.servicio_solicitado)],
      ['Tipo de trámite', etiquetaTipoTramite(solicitud.tipo_tramite)],
    ]),
    espacio(60),
    filaCampos([
      ['Código APC / CFIA', solicitud.codigo_apc_cfia ?? ''],
      ['Forma de pago', etiquetaFormaPago(solicitud.forma_pago)],
    ]),
    espacio(150),

    encabezadoSeccion('V. Firma del solicitante'),
    espacio(60),
    filaCampos([
      ['Nombre completo', solicitud.nombre_firmante],
      ['Identificación', solicitud.identificacion_firmante],
    ]),
    espacio(100),
    new Paragraph({
      children: [
        new TextRun({ text: 'Firma:', bold: true, size: 18, color: GRIS_ETIQUETA }),
      ],
    }),
  )

  if (solicitud.firma_path) {
    try {
      const respuesta = await fetch(solicitud.firma_path)
      const buffer = await respuesta.arrayBuffer()
      hijos.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: 'png',
              data: buffer,
              transformation: { width: 220, height: 80 },
            }),
          ],
        }),
      )
    } catch {
      // Si no se pudo traer la imagen (CORS, red), el documento se genera
      // igual sin la firma incrustada — no debe bloquear la descarga.
    }
  }

  hijos.push(
    espacio(150),
    encabezadoSeccion('VII. Documentos adjuntos'),
    espacio(60),
    ...(solicitud.adjuntos.length > 0
      ? solicitud.adjuntos.map(
          (a) =>
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: `• ${a.etiqueta}`, size: 20, color: NEGRO_TEXTO })],
            }),
        )
      : [
          new Paragraph({
            children: [new TextRun({ text: 'Sin documentos adjuntos.', size: 20, color: GRIS_ETIQUETA })],
          }),
        ]),
  )

  const documento = new Document({
    sections: [
      {
        properties: { page: { size: { width: ANCHO_PAGINA, height: 15840 } } },
        children: hijos,
      },
    ],
  })

  return Packer.toBlob(documento)
}

export function descargarDocumentoConexion(blob: Blob, codigoSolicitud: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${codigoSolicitud}.docx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
