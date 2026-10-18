import type jsPDF from 'jspdf'

// html2canvas dibuja el texto de los campos (inputs, textareas y cajas de
// texto) más abajo de lo que indica el layout, y varía según el navegador, así
// que no se puede garantizar que el valor quede al centro de su cuadro.
// Solución: antes de capturar, los valores se sacan del HTML (la caja queda
// vacía, solo con su borde) y se guardan con su posición exacta en
// milímetros; después de pegar la imagen de cada página, el valor se escribe
// como texto del propio PDF, centrado matemáticamente en la caja. Así el
// resultado no depende de la pantalla, el zoom ni el navegador.

export interface CampoSuperpuesto {
  pagina: number
  /** Posición y tamaño de la caja, en mm, relativos a la hoja. */
  x: number
  y: number
  ancho: number
  alto: number
  texto: string
  /** Tamaño de letra en puntos. */
  fontPt: number
  /** Margen izquierdo interno en mm. */
  margen: number
  multilinea: boolean
  negrita: boolean
}

const SELECTOR_CAMPOS =
  'input[type=text], input[type=date], input[type=email], textarea, [data-campo-valor]'

const ANCHO_HOJA_MM = 210
const PT_POR_PX = 0.75
const MM_POR_PT = 25.4 / 72

// Recorre el contenedor de captura, vacía visualmente cada campo de texto y
// devuelve los valores a escribir encima del PDF.
export function extraerCamposTexto(raiz: HTMLElement): CampoSuperpuesto[] {
  const paginas = Array.from(raiz.querySelectorAll<HTMLElement>('.page'))
  const campos: CampoSuperpuesto[] = []

  raiz.querySelectorAll<HTMLElement>(SELECTOR_CAMPOS).forEach((campo) => {
    const pagina = campo.closest<HTMLElement>('.page')
    const indice = pagina ? paginas.indexOf(pagina) : -1
    if (!pagina || indice < 0) return

    const esFormulario = campo instanceof HTMLInputElement || campo instanceof HTMLTextAreaElement
    const texto = (esFormulario ? campo.value : (campo.textContent ?? '')).trim()
    const cs = getComputedStyle(campo)
    const rectPagina = pagina.getBoundingClientRect()
    const rect = campo.getBoundingClientRect()
    const mmPorPx = ANCHO_HOJA_MM / rectPagina.width

    if (texto) {
      campos.push({
        pagina: indice,
        x: (rect.left - rectPagina.left) * mmPorPx,
        y: (rect.top - rectPagina.top) * mmPorPx,
        ancho: rect.width * mmPorPx,
        alto: rect.height * mmPorPx,
        texto,
        fontPt: parseFloat(cs.fontSize) * PT_POR_PX,
        margen: (parseFloat(cs.paddingLeft) || 0) * mmPorPx,
        multilinea: campo instanceof HTMLTextAreaElement || !esFormulario,
        negrita: Number(cs.fontWeight) >= 600,
      })
    }

    // Se reemplaza por una caja vacía del mismo tamaño y borde.
    const caja = document.createElement('div')
    Object.assign(caja.style, {
      boxSizing: 'border-box',
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      border: cs.borderTopWidth === '0px' ? '0' : `${cs.borderTopWidth} solid ${cs.borderTopColor}`,
      background: cs.backgroundColor,
      flex: 'none',
    })
    campo.replaceWith(caja)
  })

  return campos
}

// Escribe los valores de una página centrados en sus cajas. La línea base se
// calcula a partir de la altura de las mayúsculas de Helvetica (0.718 em) para
// que el texto quede centrado ópticamente, tanto en minúsculas como en
// mayúsculas.
const ALTURA_MAYUSCULA = 0.718
const FONT_MIN_PT = 6

export function dibujarCampos(pdf: jsPDF, campos: CampoSuperpuesto[], pagina: number): void {
  pdf.setTextColor(34, 34, 34)
  for (const c of campos.filter((x) => x.pagina === pagina)) {
    pdf.setFont('helvetica', c.negrita ? 'bold' : 'normal')
    const disponible = c.ancho - c.margen * 2
    let fontPt = c.fontPt
    pdf.setFontSize(fontPt)

    if (!c.multilinea) {
      // Una línea: se reduce la letra si no cabe y, como último recurso, se
      // recorta con puntos suspensivos.
      let texto = c.texto
      while (pdf.getTextWidth(texto) > disponible && fontPt > FONT_MIN_PT) {
        fontPt -= 0.25
        pdf.setFontSize(fontPt)
      }
      while (pdf.getTextWidth(texto) > disponible && texto.length > 1) {
        texto = texto.slice(0, -1)
      }
      if (texto !== c.texto) texto = `${texto.slice(0, -1)}…`
      const base = c.y + c.alto / 2 + (ALTURA_MAYUSCULA * fontPt * MM_POR_PT) / 2
      pdf.text(texto, c.x + c.margen, base)
      continue
    }

    // Varias líneas: bloque centrado verticalmente en la caja.
    const alturaLinea = fontPt * MM_POR_PT * 1.2
    let lineas: string[] = pdf.splitTextToSize(c.texto, disponible)
    const maxLineas = Math.max(1, Math.floor(c.alto / alturaLinea))
    lineas = lineas.slice(0, maxLineas)
    const alturaBloque = lineas.length * alturaLinea
    const inicio = c.y + (c.alto - alturaBloque) / 2
    lineas.forEach((linea, i) => {
      const centroLinea = inicio + alturaLinea * i + alturaLinea / 2
      pdf.text(linea, c.x + c.margen, centroLinea + (ALTURA_MAYUSCULA * fontPt * MM_POR_PT) / 2)
    })
  }
}
