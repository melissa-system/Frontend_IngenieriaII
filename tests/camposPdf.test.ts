// Los valores de los PDF se escriben como texto del PDF centrado en su caja
// (html2canvas los dibujaba más abajo y variaba según el navegador).
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dibujarCampos, type CampoSuperpuesto } from '../src/lib/camposPdf.ts'

function pdfFalso() {
  const llamadas: { texto: string; x: number; y: number }[] = []
  const pdf = {
    setTextColor() {},
    setFont() {},
    setFontSize() {},
    getTextWidth: (t: string) => t.length * 1.5,
    splitTextToSize: (t: string) => [t],
    text: (texto: string, x: number, y: number) => llamadas.push({ texto, x, y }),
  }
  return { pdf, llamadas }
}

const campo = (extra: Partial<CampoSuperpuesto> = {}): CampoSuperpuesto => ({
  pagina: 0, x: 20, y: 40, ancho: 80, alto: 6, texto: 'Hola', fontPt: 7, margen: 1.3,
  multilinea: false, negrita: false, ...extra,
})

describe('campos de los PDF: texto centrado en su caja', () => {
  it('la línea base deja el texto centrado verticalmente (mismo espacio arriba y abajo)', () => {
    const { pdf, llamadas } = pdfFalso()
    dibujarCampos(pdf as never, [campo()], 0)
    const mitadAltura = (0.718 * 7 * (25.4 / 72)) / 2
    assert.ok(Math.abs(llamadas[0].y - (40 + 3 + mitadAltura)) < 1e-9)
    assert.equal(llamadas[0].x, 21.3)
  })

  it('solo dibuja los campos de la página indicada', () => {
    const { pdf, llamadas } = pdfFalso()
    dibujarCampos(pdf as never, [campo(), campo({ pagina: 1, texto: 'Otra' })], 1)
    assert.deepEqual(llamadas.map((l) => l.texto), ['Otra'])
  })

  it('el texto largo se recorta con puntos suspensivos en vez de salirse de la caja', () => {
    const { pdf, llamadas } = pdfFalso()
    dibujarCampos(pdf as never, [campo({ texto: 'x'.repeat(200) })], 0)
    assert.ok(llamadas[0].texto.endsWith('…'))
  })

  it('los generadores usan el texto superpuesto y no el de html2canvas', () => {
    for (const f of ['generarPdfSolicitud', 'generarPdfConexion']) {
      const fuente = readFileSync(new URL(`../src/lib/${f}.ts`, import.meta.url), 'utf8')
      assert.match(fuente, /extraerCamposTexto\(contenedor\)/)
      assert.match(fuente, /dibujarCampos\(pdf, campos, i\)/)
    }
  })
})
