// Verifica que los tokens de color de src/index.css cumplan el contraste
// WCAG AA (4.5:1 texto normal) en las combinaciones que usa el sistema.
// Si se cambia un color del @theme y deja de cumplir, este test falla.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const css = fs.readFileSync('src/index.css', 'utf8')
const tokens: Record<string, string> = {}
for (const m of css.matchAll(/--color-([a-z]+-\d+):\s*(#[0-9a-fA-F]{6})/g)) tokens[m[1]] = m[2]
tokens.blanco = '#ffffff'

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(tokens[a]), luminancia(tokens[b])].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// [texto, fondo] que la guía permite usar.
const PARES: [string, string][] = [
  ['primary-900', 'blanco'], ['primary-800', 'blanco'], ['primary-700', 'blanco'],
  ['primary-600', 'blanco'], ['primary-500', 'blanco'], ['primary-400', 'blanco'],
  ['primary-900', 'primary-50'], ['primary-700', 'primary-50'], ['primary-500', 'primary-50'],
  ['primary-400', 'primary-50'],
  ['blanco', 'primary-700'], ['blanco', 'primary-800'], ['blanco', 'primary-900'],
  ['primary-200', 'primary-900'], ['primary-300', 'primary-900'],
  // Badges: tono 700 sobre tono 100 de cada estado
  ['exito-700', 'exito-100'], ['advertencia-700', 'advertencia-100'], ['error-700', 'error-100'],
  ['info-700', 'info-100'], ['acento-700', 'acento-100'],
  // Texto de estado sobre blanco (botones de acción, mensajes)
  ['exito-700', 'blanco'], ['advertencia-700', 'blanco'], ['error-600', 'blanco'],
  ['info-600', 'blanco'], ['acento-700', 'blanco'],
  // Banners/toasts
  ['exito-800', 'exito-50'], ['error-700', 'error-50'], ['advertencia-800', 'advertencia-50'],
  ['info-800', 'info-50'],
  // Botones sólidos con texto blanco
  ['blanco', 'exito-700'], ['blanco', 'error-600'], ['blanco', 'info-700'],
]

describe('contraste de color (WCAG AA 4.5:1)', () => {
  for (const [t, f] of PARES) {
    it(`${t} sobre ${f}`, () => {
      const c = contraste(t, f)
      assert.ok(c >= 4.5, `${t} sobre ${f}: ${c.toFixed(2)}:1 (mínimo 4.5)`)
    })
  }
})
