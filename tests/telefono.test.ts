// Teléfonos con código de país (CR por defecto y números extranjeros).
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { esTelefonoValido, formatearTelefonoVisible, normalizarTelefono } from '../src/lib/telefono.ts'
import { esTelefono } from '../src/lib/validaciones.ts'

describe('teléfonos internacionales', () => {
  it('los números locales de CR pasan a +506 (compatibilidad con los ya guardados)', () => {
    assert.equal(normalizarTelefono('8888-8888'), '+50688888888')
    assert.equal(normalizarTelefono('88888888'), '+50688888888')
    assert.equal(normalizarTelefono('+506 8888 8888'), '+50688888888')
    assert.equal(normalizarTelefono(''), '')
    assert.equal(normalizarTelefono('abc'), '')
  })

  it('valida según el país seleccionado', () => {
    assert.equal(esTelefonoValido('+50688888888'), true)
    assert.equal(esTelefonoValido('8888-8888'), true)
    assert.equal(esTelefonoValido('+14155552671'), true)
    assert.equal(esTelefonoValido('+34612345678'), true)
    assert.equal(esTelefonoValido('+506123'), false)
    assert.equal(esTelefonoValido(''), false)
  })

  it('se muestra con formato internacional', () => {
    assert.equal(formatearTelefonoVisible('+50688888888'), '+506 8888 8888')
    assert.equal(formatearTelefonoVisible('8888-8888'), '+506 8888 8888')
    assert.equal(formatearTelefonoVisible(''), '')
  })

  it('la regla común de formularios acepta CR local e internacionales', () => {
    assert.equal(esTelefono('8888-8888'), true)
    assert.equal(esTelefono('+14155552671'), true)
    assert.equal(esTelefono('+506 12'), false)
  })
})
