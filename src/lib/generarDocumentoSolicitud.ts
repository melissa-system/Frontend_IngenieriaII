import {
  AlignmentType,
  Document,
  HeadingLevel,
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
import type { Configuracion } from '../components/Services/configuracion.service'

// Identidad legal de la ASADA: no vive en la tabla `configuracion` (esa
// solo guarda datos de contacto/horario), así que quedan fijos acá. Mismos
// datos usados en AboutUs.tsx (Nuestra historia).
export const ASADA_NOMBRE_LEGAL = 'ASADA Pueblo Nuevo'
export const ASADA_CEDULA_JURIDICA = '3-002-458332'

// Forma común para generar el documento, sin importar si los datos vienen
// del wizard recién enviado (misma sesión, sin volver a pedirle nada al
// backend) o de la lista que ve un administrador logueado.
export interface DatosDocumentoSolicitud {
  codigoSolicitud: string
  fecha: string | Date
  tipoPersona: 'fisica' | 'juridica'
  nombreSolicitante: string
  identificacion: string
  nombreRepresentante?: string | null
  cedulaRepresentante?: string | null
  telefono: string
  telefonoSecundario?: string | null
  correo: string
  provincia?: string | null
  canton?: string | null
  distrito?: string | null
  direccion: string
  numeroPlano: string
  naturalezaInmueble?: string | null
  calidadTitular?: string | null
  tipoServicio?: string | null
  tipoConexion?: string | null
  observaciones?: string | null
}

function formatearFecha(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  if (Number.isNaN(d.getTime())) return String(fecha)
  return d.toLocaleString('es-CR', { dateStyle: 'long', timeStyle: 'short' })
}

function valorOGuion(valor: string | null | undefined): string {
  return valor && valor.trim() !== '' ? valor : '—'
}

// --- Estilos compartidos (colores/medidas) ---
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

// Ancho útil de una página carta con 1" de margen a cada lado (en DXA).
const ANCHO_PAGINA = 12240
const MARGEN = 1440
const ANCHO_UTIL = ANCHO_PAGINA - MARGEN * 2 // 9360

// Barra de título de sección (I., II., III. ...), igual criterio visual que
// el machote original de AyA (encabezado marcado con número romano).
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
                children: [
                  new TextRun({ text: texto, bold: true, color: 'FFFFFF', size: 20 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

// Una "casilla" del formulario: etiqueta pequeña arriba, valor en negrita
// abajo — mismo criterio que las cajas del PDF original (etiqueta + recuadro).
function celdaCampo(etiqueta: string, valor: string, ancho: number): TableCell {
  return new TableCell({
    width: { size: ancho, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    borders: BORDE_CELDA,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: etiqueta.toUpperCase(),
            bold: true,
            size: 14,
            color: GRIS_ETIQUETA,
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 40 },
        children: [new TextRun({ text: valorOGuion(valor), bold: true, size: 21, color: NEGRO_TEXTO })],
      }),
    ],
  })
}

// Arma una fila de N campos repartiendo el ancho útil en partes iguales.
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

// Arma el documento Word (.docx) del "machote" ya lleno: la solicitud de
// conexión de servicio adaptada del formulario GNU-42-01-F1 de AyA para
// ASADA Pueblo Nuevo, replicando las secciones I-V (numeración romana,
// etiquetas y orden de campos) del formulario original, con los datos de
// la solicitud y los datos reales de la ASADA (dirección, teléfono, correo
// desde Configuracion; nombre y cédula jurídica fijos).
export async function generarDocumentoSolicitud(
  datos: DatosDocumentoSolicitud,
  configuracion: Configuracion,
): Promise<Blob> {
  const esJuridica = datos.tipoPersona === 'juridica'

  const hijos: (Paragraph | Table)[] = []

  // --- Encabezado institucional ---
  hijos.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: ASADA_NOMBRE_LEGAL.toUpperCase(), bold: true, size: 30, color: AZUL_OSCURO }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40 },
      children: [
        new TextRun({ text: `Cédula jurídica ${ASADA_CEDULA_JURIDICA}`, size: 18, color: GRIS_ETIQUETA }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: configuracion.direccion, size: 18, color: GRIS_ETIQUETA })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Tel. ${configuracion.telefono} · ${configuracion.correo_electronico}`,
          size: 18,
          color: GRIS_ETIQUETA,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'SOLICITUD DE CONEXIÓN DE SERVICIO', bold: true, size: 26, color: AZUL_OSCURO }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: `Adaptado del formulario GNU-42-01-F1 del Instituto Costarricense de Acueductos y Alcantarillados (AyA) para uso interno de ${ASADA_NOMBRE_LEGAL}`,
          italics: true,
          size: 16,
          color: GRIS_ETIQUETA,
        }),
      ],
    }),
    filaCampos([
      ['Código de solicitud', datos.codigoSolicitud],
      ['Fecha', formatearFecha(datos.fecha)],
    ]),
    espacio(160),
  )

  // --- I. Información del titular del inmueble ---
  hijos.push(encabezadoSeccion('I.  INFORMACIÓN DEL TITULAR DEL INMUEBLE'), espacio(60))
  hijos.push(
    filaCampos([
      ['Tipo de persona', esJuridica ? 'Persona jurídica' : 'Persona física'],
      [
        esJuridica ? 'No. de cédula jurídica' : 'No. de identificación',
        datos.identificacion,
      ],
    ]),
  )
  hijos.push(
    filaCampos([[esJuridica ? 'Razón social' : 'Nombre completo', datos.nombreSolicitante]]),
  )
  if (esJuridica) {
    hijos.push(
      filaCampos([
        ['Representante legal', datos.nombreRepresentante ?? ''],
        ['Cédula del representante', datos.cedulaRepresentante ?? ''],
      ]),
    )
  }
  hijos.push(
    filaCampos([
      ['Teléfono 1', datos.telefono],
      ['Teléfono 2', datos.telefonoSecundario ?? ''],
    ]),
  )
  hijos.push(espacio(160))

  // --- II. Medio para notificación ---
  hijos.push(encabezadoSeccion('II.  MEDIO PARA NOTIFICACIÓN'), espacio(60))
  hijos.push(filaCampos([['Correo electrónico', datos.correo]]))
  hijos.push(espacio(160))

  // --- III. Información del inmueble ---
  hijos.push(encabezadoSeccion('III.  INFORMACIÓN DEL INMUEBLE'), espacio(60))
  hijos.push(
    filaCampos([
      ['Provincia', datos.provincia ?? ''],
      ['Cantón', datos.canton ?? ''],
      ['Distrito', datos.distrito ?? ''],
    ]),
  )
  hijos.push(filaCampos([['Dirección exacta del inmueble', datos.direccion]]))
  hijos.push(
    filaCampos([
      ['Número de plano catastrado', datos.numeroPlano],
    ]),
  )
  hijos.push(
    filaCampos([
      ['1. Naturaleza del inmueble', datos.naturalezaInmueble ?? ''],
      ['2. Calidad del titular del inmueble', datos.calidadTitular ?? ''],
    ]),
  )
  hijos.push(espacio(160))

  // --- IV. Propósito de la solicitud ---
  hijos.push(encabezadoSeccion('IV.  PROPÓSITO DE LA SOLICITUD'), espacio(60))
  hijos.push(
    filaCampos([
      ['Servicio que solicita', datos.tipoServicio ?? ''],
      ['Tipo de conexión', datos.tipoConexion ?? ''],
    ]),
  )
  hijos.push(espacio(160))

  // --- Observaciones (si las hay) ---
  if (datos.observaciones && datos.observaciones.trim() !== '') {
    hijos.push(encabezadoSeccion('OBSERVACIONES'), espacio(60))
    hijos.push(
      new Table({
        width: { size: ANCHO_UTIL, type: WidthType.DXA },
        columnWidths: [ANCHO_UTIL],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: ANCHO_UTIL, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 150, right: 150 },
                borders: BORDE_CELDA,
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: datos.observaciones, size: 21, color: NEGRO_TEXTO })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    )
    hijos.push(espacio(160))
  }

  // --- V. Firma del solicitante ---
  hijos.push(encabezadoSeccion('V.  FIRMA DEL SOLICITANTE'), espacio(60))
  hijos.push(
    filaCampos([
      ['Nombre completo del solicitante', datos.nombreSolicitante],
      ['Identificación', datos.identificacion],
    ]),
  )
  hijos.push(espacio(400))
  hijos.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: {
        top: { style: BorderStyle.SINGLE, size: 4, color: NEGRO_TEXTO },
      },
      spacing: { before: 200 },
      children: [new TextRun({ text: 'Firma del solicitante', size: 18, color: GRIS_ETIQUETA })],
    }),
  )

  // --- Pie ---
  hijos.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: GRIS_BORDE } },
      children: [
        new TextRun({
          text: `Documento generado automáticamente por el Sistema de Información de ${ASADA_NOMBRE_LEGAL} (SIAPB) a partir de la solicitud con código ${datos.codigoSolicitud}. No requiere firma digital para su trámite interno.`,
          size: 14,
          italics: true,
          color: GRIS_ETIQUETA,
        }),
      ],
    }),
  )

  const documento = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: ANCHO_PAGINA, height: 15840 },
            margin: { top: MARGEN, bottom: MARGEN, left: MARGEN, right: MARGEN },
          },
        },
        children: hijos,
      },
    ],
  })

  return Packer.toBlob(documento)
}

// Dispara la descarga DIRECTA del .docx generado (nunca vista en línea): se
// crea un Blob local y se hace clic sintético en un enlace con atributo
// `download`, así el navegador siempre guarda el archivo en vez de abrirlo.
export function descargarDocumentoSolicitud(blob: Blob, codigoSolicitud: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `solicitud-${codigoSolicitud}.docx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
