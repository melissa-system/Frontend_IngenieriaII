// Los PDF de solicitud se dibujan con texto vectorial: el valor de cada campo
// queda centrado por cálculo en su caja (html2canvas lo dibujaba más arriba o
// más abajo y variaba según el navegador).
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Formulario, MM_POR_PT } from '../src/lib/pdfFormulario.ts'

describe('PDF de solicitudes con texto vectorial', () => {
  it('el texto se centra verticalmente: la línea base sale del centro de la caja', () => {
    const f = new Formulario()
    const llamadas: number[] = []
    const original = f.pdf.text.bind(f.pdf)
    f.pdf.text = ((t: string, x: number, y: number, o?: object) => {
      llamadas.push(y)
      return original(t, x, y, o as never)
    }) as never
    f.texto('Hola', 20, 50, { size: 10 })
    const esperado = 50 + (0.718 * 10 * MM_POR_PT) / 2
    assert.ok(Math.abs(llamadas[0] - esperado) < 1e-9)
  })

  it('un valor largo se reduce o recorta en vez de salirse de la caja', () => {
    const f = new Formulario()
    const anchos: number[] = []
    const original = f.pdf.text.bind(f.pdf)
    f.pdf.text = ((t: string | string[], x: number, y: number, o?: object) => {
      const linea = Array.isArray(t) ? t[0] : t
      anchos.push(f.pdf.getTextWidth(linea))
      return original(t as never, x, y, o as never)
    }) as never
    f.valorEnCaja('x'.repeat(400), 20, 50, 60, 8, 9.5)
    assert.ok(anchos.every((a) => a <= 60))
  })

  it('los generadores ya no usan html2canvas', () => {
    for (const f of ['generarPdfSolicitud', 'generarPdfConexion']) {
      const fuente = readFileSync(new URL(`../src/lib/${f}.ts`, import.meta.url), 'utf8')
      assert.doesNotMatch(fuente, /html2canvas/)
    }
  })
})
