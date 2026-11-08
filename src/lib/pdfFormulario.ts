import { jsPDF } from 'jspdf'

// Dibujo de formularios en PDF con texto vectorial (sin html2canvas).
//
// html2canvas dibuja el texto más arriba o más abajo de lo que indica el
// layout y cambia según el navegador, la pantalla y el zoom. Aquí cada texto
// se coloca con coordenadas en milímetros y se centra por cálculo dentro de su
// caja, así el documento se ve igual en cualquier dispositivo.

export const MM_POR_PT = 25.4 / 72
const ALTURA_MAYUSCULA = 0.718 // de Helvetica, en em
const INTERLINEADO = 1.28

export const A4 = { ancho: 210, alto: 297 }
export const MARGEN_PAGINA = 5 // del borde de la hoja al marco
export const X0 = 12 // inicio del contenido
export const X1 = 198 // fin del contenido
export const ANCHO = X1 - X0
const Y_MAX = 278 // límite inferior del contenido (el pie va debajo)

const GRIS = 34

export interface OpcionesTexto {
  size?: number
  bold?: boolean
  italic?: boolean
  align?: 'left' | 'center' | 'right'
}

export class Formulario {
  readonly pdf: jsPDF
  y = 0
  pagina = 0
  private encabezado: (() => void) | null = null

  constructor() {
    this.pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    this.pdf.setLineWidth(0.25)
    this.pdf.setDrawColor(GRIS, GRIS, GRIS)
    this.pdf.setTextColor(GRIS, GRIS, GRIS)
    this.pagina = 1
    this.marco()
  }

  // ---------- página ----------

  private marco() {
    const { pdf } = this
    pdf.setLineWidth(0.4)
    pdf.setDrawColor(GRIS, GRIS, GRIS)
    pdf.roundedRect(MARGEN_PAGINA, MARGEN_PAGINA, A4.ancho - MARGEN_PAGINA * 2, A4.alto - MARGEN_PAGINA * 2, 3, 3)
    pdf.setLineWidth(0.25)
    // pie
    pdf.line(MARGEN_PAGINA, 285, A4.ancho - MARGEN_PAGINA, 285)
    this.texto('El agua es vida ... ¡Cuidémosla!', A4.ancho / 2, 290, { size: 8, align: 'center' })
    this.texto(String(this.pagina), A4.ancho - 12, 290, { size: 8, align: 'right' })
  }

  nuevaPagina(encabezado?: (() => void) | null) {
    this.pdf.addPage()
    this.pagina += 1
    this.marco()
    if (encabezado !== undefined) this.encabezado = encabezado
    this.y = 0
    this.encabezado?.()
  }

  /** Si lo que sigue no cabe, pasa a una página nueva (repite el encabezado). */
  asegurar(alto: number) {
    if (this.y + alto > Y_MAX) this.nuevaPagina()
  }

  fijarEncabezado(fn: (() => void) | null) {
    this.encabezado = fn
  }

  // ---------- texto ----------

  private estilo(o: OpcionesTexto = {}) {
    const { pdf } = this
    pdf.setFont('helvetica', o.bold && o.italic ? 'bolditalic' : o.bold ? 'bold' : o.italic ? 'italic' : 'normal')
    pdf.setFontSize(o.size ?? 9)
    pdf.setTextColor(GRIS, GRIS, GRIS)
  }

  ancho(texto: string, o: OpcionesTexto = {}): number {
    this.estilo(o)
    return this.pdf.getTextWidth(texto)
  }

  /** Escribe una línea con su centro vertical en `yCentro` (centrado óptico por altura de mayúsculas). */
  texto(texto: string, x: number, yCentro: number, o: OpcionesTexto = {}) {
    if (!texto) return
    this.estilo(o)
    const size = o.size ?? 9
    const base = yCentro + (ALTURA_MAYUSCULA * size * MM_POR_PT) / 2
    this.pdf.text(texto, x, base, { align: o.align ?? 'left' })
  }

  lineas(texto: string, ancho: number, o: OpcionesTexto = {}): string[] {
    this.estilo(o)
    return this.pdf.splitTextToSize(texto, ancho) as string[]
  }

  altoLinea(size: number): number {
    return size * MM_POR_PT * INTERLINEADO
  }

  /** Bloque de varias líneas con su centro vertical en `yCentro`. */
  bloque(lineas: string[], x: number, yCentro: number, o: OpcionesTexto = {}) {
    const size = o.size ?? 9
    const alto = this.altoLinea(size)
    const inicio = yCentro - (alto * lineas.length) / 2 + alto / 2
    lineas.forEach((l, i) => this.texto(l, x, inicio + alto * i, o))
  }

  /** Párrafo que fluye, con salto de página automático. Devuelve nada; avanza `y`. */
  parrafo(texto: string, o: OpcionesTexto & { x?: number; ancho?: number; sangria?: number; vineta?: boolean; subrayado?: boolean; espacio?: number } = {}) {
    const size = o.size ?? 8.5
    const x = (o.x ?? X0) + (o.sangria ?? 0)
    const ancho = (o.ancho ?? ANCHO) - (o.sangria ?? 0) - (o.vineta ? 3.5 : 0)
    const lineas = this.lineas(texto, ancho, o)
    const alto = this.altoLinea(size)
    lineas.forEach((l, i) => {
      this.asegurar(alto)
      const yc = this.y + alto / 2
      if (i === 0 && o.vineta) {
        this.pdf.setFillColor(GRIS, GRIS, GRIS)
        this.pdf.circle(x + 1, yc, 0.45, 'F')
      }
      this.texto(l, x + (o.vineta ? 3.5 : 0), yc, o)
      if (o.subrayado) {
        const w = this.ancho(l, o)
        this.pdf.line(x, yc + 1.5, x + w, yc + 1.5)
      }
      this.y += alto
    })
    this.y += o.espacio ?? 1
  }

  // ---------- formas ----------

  rect(x: number, y: number, w: number, h: number) {
    this.pdf.setLineWidth(0.25)
    this.pdf.setDrawColor(GRIS, GRIS, GRIS)
    this.pdf.rect(x, y, w, h)
  }

  linea(x1: number, y1: number, x2: number, y2: number) {
    this.pdf.setLineWidth(0.25)
    this.pdf.setDrawColor(GRIS, GRIS, GRIS)
    this.pdf.line(x1, y1, x2, y2)
  }

  /** Título de sección con su número romano dentro de un óvalo. */
  seccion(romano: string, titulo: string, nota?: string) {
    this.asegurar(14)
    const yc = this.y + 5
    this.pdf.setLineWidth(0.4)
    this.pdf.setDrawColor(GRIS, GRIS, GRIS)
    this.pdf.ellipse(X0 + 6.5, yc, 6.5, 3.8)
    this.texto(romano, X0 + 6.5, yc, { size: 8.5, bold: true, align: 'center' })
    this.texto(titulo, X0 + 16, yc, { size: 10.5, bold: true })
    if (nota) this.texto(nota, X0 + 16 + this.ancho(titulo, { size: 10.5, bold: true }) + 3, yc, { size: 7.5 })
    this.y += 11
  }

  /**
   * Caja con etiqueta centrada arriba y el valor centrado verticalmente
   * dentro. La etiqueta tiene su propio espacio: nunca toca el borde.
   */
  campo(etiqueta: string, valor: string, x: number, w: number, o: { alto?: number; size?: number } = {}) {
    const alto = o.alto ?? 7.5
    const size = o.size ?? 9.5
    this.texto(etiqueta, x + w / 2, this.y + 2.4, { size: 8.5, bold: true, align: 'center' })
    const yCaja = this.y + 5
    this.rect(x, yCaja, w, alto)
    this.valorEnCaja(valor, x, yCaja, w, alto, size)
    return yCaja + alto
  }

  /** Valor dentro de una caja: una o varias líneas, centrado verticalmente; reduce la letra si no cabe. */
  valorEnCaja(valor: string, x: number, y: number, w: number, h: number, size = 9.5, pad = 2) {
    const texto = (valor ?? '').trim()
    if (!texto) return
    const disponible = w - pad * 2
    let s = size
    let lineas = this.lineas(texto, disponible, { size: s })
    while (lineas.length * this.altoLinea(s) > h - 1 && s > 6) {
      s -= 0.5
      lineas = this.lineas(texto, disponible, { size: s })
    }
    const max = Math.max(1, Math.floor((h - 0.6) / this.altoLinea(s)))
    if (lineas.length > max) {
      lineas = lineas.slice(0, max)
      lineas[max - 1] = `${lineas[max - 1].slice(0, -1)}…`
    }
    this.bloque(lineas, x + pad, y + h / 2, { size: s })
  }

  /** Fila de campos con separación fija; devuelve el borde inferior. */
  fila(campos: { etiqueta: string; valor: string; ancho: number }[], o: { gap?: number; alto?: number; x?: number } = {}) {
    const gap = o.gap ?? 4
    const alto = o.alto ?? 7.5
    this.asegurar(5 + alto + 2)
    let x = o.x ?? X0
    for (const c of campos) {
      this.campo(c.etiqueta, c.valor, x, c.ancho, { alto })
      x += c.ancho + gap
    }
    this.y += 5 + alto + 2
  }

  /** Control de selección (círculo o cuadro) con su etiqueta. `yc` es el centro vertical. */
  opcion(tipo: 'radio' | 'check', marcado: boolean, x: number, yc: number, etiqueta: string, o: { ancho?: number; size?: number } = {}): number {
    const { pdf } = this
    const size = o.size ?? 8.5
    const lado = 3.4
    pdf.setLineWidth(0.3)
    pdf.setDrawColor(GRIS, GRIS, GRIS)
    pdf.setFillColor(GRIS, GRIS, GRIS)
    if (tipo === 'radio') {
      pdf.circle(x + lado / 2, yc, lado / 2)
      if (marcado) pdf.circle(x + lado / 2, yc, 1.1, 'F')
    } else {
      pdf.rect(x, yc - lado / 2, lado, lado)
      if (marcado) {
        pdf.setLineWidth(0.55)
        pdf.line(x + 0.7, yc + 0.1, x + 1.5, yc + 1.1)
        pdf.line(x + 1.5, yc + 1.1, x + lado - 0.6, yc - 1.1)
        pdf.setLineWidth(0.25)
      }
    }
    const xt = x + lado + 1.8
    const lineas = o.ancho ? this.lineas(etiqueta, o.ancho - lado - 1.8, { size }) : [etiqueta]
    this.bloque(lineas, xt, yc, { size })
    return lineas.length * this.altoLinea(size)
  }

  imagenEnCaja(dataUrl: string, x: number, y: number, w: number, h: number, pad = 1.5) {
    try {
      const props = this.pdf.getImageProperties(dataUrl)
      const maxW = w - pad * 2
      const maxH = h - pad * 2
      const escala = Math.min(maxW / props.width, maxH / props.height)
      const iw = props.width * escala
      const ih = props.height * escala
      this.pdf.addImage(dataUrl, props.fileType, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih)
    } catch {
      // Si la imagen no se puede leer se deja la caja vacía.
    }
  }

  // ---------- encabezados ----------

  private partesLogo(nombre: string): string[] {
    const palabras = nombre.split(' ')
    return palabras.length >= 3 ? [palabras[0], palabras.slice(1, -1).join(' '), palabras[palabras.length - 1]] : palabras
  }

  encabezadoCompleto(nombre: string, subtitulo: string, codigo: string) {
    const h = 22
    this.rect(X0, this.y, ANCHO, h)
    const yc = this.y + h / 2
    this.bloque(this.partesLogo(nombre), X0 + 19, yc, { size: 11, bold: true, align: 'center' })
    this.texto(nombre, X0 + ANCHO / 2, yc - 2.2, { size: 13, bold: true, align: 'center' })
    this.texto(subtitulo, X0 + ANCHO / 2, yc + 3.4, { size: 8.5, bold: true, align: 'center' })
    this.texto(codigo, X1 - 3, this.y + h - 3, { size: 7, align: 'right' })
    this.y += h + 2
  }

  encabezadoSimple(nombre: string, titulo: string) {
    const h = 14
    this.y = 10
    this.rect(X0, this.y, ANCHO, h)
    const yc = this.y + h / 2
    this.bloque(this.partesLogo(nombre), X0 + 19, yc, { size: 8, bold: true, align: 'center' })
    this.texto(titulo, X0 + ANCHO / 2 + 6, yc, { size: 11, bold: true, align: 'center' })
    this.y += h + 4
  }
}
