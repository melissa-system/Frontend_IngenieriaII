// Los estilos de los PDF no deben salirse del contenedor oculto de captura
// (antes cambiaban el body y las tablas de toda la pantalla al exportar).
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aislarCss, aislarEstilosHtml } from '../src/lib/aislarEstilosPdf.ts'

describe('Estilos aislados de los PDF', () => {
  const css = `@page{size:A4;margin:0}
*{box-sizing:border-box}
body{margin:0;padding:18px;font-size:10.5px}
table{width:100%}
th,td{padding:2mm}
.page:last-child{page-break-after:auto}
input[type=text],input[type=date]{width:100%}`

  it('cada regla queda dentro del contenedor de captura', () => {
    const reglas = aislarCss(css).split('\n')
    assert.deepEqual(reglas, [
      '.pdf-captura,.pdf-captura *{box-sizing:border-box}',
      '.pdf-captura{margin:0;padding:18px;font-size:10.5px}',
      '.pdf-captura table{width:100%}',
      '.pdf-captura th,.pdf-captura td{padding:2mm}',
      '.pdf-captura .page:last-child{page-break-after:auto}',
      '.pdf-captura input[type=text],.pdf-captura input[type=date]{width:100%}',
    ])
  })

  it('reescribe el <style> del documento sin tocar el resto del HTML', () => {
    const html = `<html><head><style>${css}</style></head><body><section class="page">Hola</section></body></html>`
    const resultado = aislarEstilosHtml(html)
    assert.ok(!/(^|[}\s])body\{/.test(resultado))
    assert.ok(!resultado.includes('@page'))
    assert.ok(resultado.includes('<section class="page">Hola</section>'))
  })
})

describe('Centrado vertical de campos en los PDF', () => {
  it('el contenedor de captura convierte inputs/textarea en cajas flex centradas', async () => {
    const fuente = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../src/lib/aislarEstilosPdf.ts', import.meta.url), 'utf8'),
    )
    assert.match(fuente, /convertirCamposEnTexto\(contenedor\)/)
    assert.match(fuente, /alignItems: 'center'/)
    assert.match(fuente, /paddingTop: '0'/)
    assert.match(fuente, /contenedor\.style\.width = '210mm'/)
  })
})
