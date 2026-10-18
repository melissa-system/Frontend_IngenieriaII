// Los generadores de PDF arman un documento HTML completo con su propio
// <style> y lo insertan en un <div> oculto para capturarlo con html2canvas.
// Dentro de un <div> ese <style> es global: reglas como body{padding;
// font-size} o table/th/td cambiaban toda la pantalla del sistema mientras se
// generaba el PDF (se veía "achicarse"). Acá se reescribe el CSS para que solo
// aplique dentro del contenedor de captura.

export const CLASE_CAPTURA_PDF = 'pdf-captura'

const AMBITO = `.${CLASE_CAPTURA_PDF}`

function aislarSelector(selector: string): string {
  const s = selector.trim()
  if (s === 'html' || s === 'body') return AMBITO
  if (s === '*') return `${AMBITO},${AMBITO} *`
  return `${AMBITO} ${s}`
}

// Antepone el contenedor de captura a cada selector. Las reglas @ (como
// @page) se descartan porque solo sirven al imprimir la página completa.
export function aislarCss(css: string): string {
  const reglas: string[] = []
  for (const [, selectores, declaraciones] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectores.trim().startsWith('@')) continue
    reglas.push(`${selectores.split(',').map(aislarSelector).join(',')}{${declaraciones}}`)
  }
  return reglas.join('\n')
}

// Aplica aislarCss a los <style> de un documento HTML generado.
export function aislarEstilosHtml(html: string): string {
  return html.replace(
    /<style>([\s\S]*?)<\/style>/g,
    (_, css: string) => `<style>${aislarCss(css)}</style>`,
  )
}

// Contenedor oculto (fuera de pantalla) con el HTML del documento y sus
// estilos aislados, ya agregado al <body>.
export function crearContenedorCaptura(html: string): HTMLDivElement {
  const contenedor = document.createElement('div')
  contenedor.className = CLASE_CAPTURA_PDF
  contenedor.style.position = 'fixed'
  contenedor.style.left = '-99999px'
  contenedor.style.top = '0'
  // Ancho fijo (una hoja A4): el layout no depende del tamaño de la pantalla.
  contenedor.style.width = '210mm'
  contenedor.innerHTML = aislarEstilosHtml(html)
  document.body.appendChild(contenedor)
  return contenedor
}
