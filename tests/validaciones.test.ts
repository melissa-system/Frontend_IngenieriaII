// Pruebas de las reglas comunes de validación de formularios (PBI 511 /
// Task 513). Se prueban con datos vacíos, inválidos, en el límite y válidos.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  cedula,
  correo,
  entero,
  esCorreo,
  esFecha,
  esIdentificacion,
  esTelefono,
  fecha,
  formatearTelefono,
  hayErrores,
  longitud,
  MB,
  requerido,
  telefono,
  validarArchivo,
  validarCampos,
} from '../src/lib/validaciones.ts'

describe('Cédula', () => {
  it('acepta física, jurídica y DIMEX con o sin guiones', () => {
    for (const v of ['1-2345-6789', '123456789', '3-101-123456', '3101123456', '12345678901', '123456789012']) {
      assert.equal(esIdentificacion(v), true, v)
    }
  })
  it('rechaza incompletas, con letras y del tipo equivocado', () => {
    for (const v of ['', '1-2345-678', '12345678A', '1234567890123']) {
      assert.equal(esIdentificacion(v), false, v)
    }
    assert.equal(esIdentificacion('3-101-123456', ['fisica']), false)
    assert.equal(esIdentificacion('1-2345-6789', ['juridica']), false)
  })
  it('la regla no marca un campo opcional vacío, pero sí uno mal escrito', () => {
    assert.equal(cedula()(''), null)
    assert.match(cedula(['fisica'])('1-234') ?? '', /9 dígitos/)
  })
})

describe('Teléfono, correo y fecha', () => {
  it('teléfono de 8 dígitos exactos', () => {
    assert.equal(esTelefono('8888-8888'), true)
    assert.equal(esTelefono('88888888'), true)
    assert.equal(esTelefono('8888-888'), false)
    assert.equal(esTelefono('8888-88889'), false)
    assert.equal(formatearTelefono('8888abc88889'), '8888-8888')
    assert.equal(telefono()(''), null)
  })
  it('correo con usuario, dominio y extensión', () => {
    assert.equal(esCorreo('ana@correo.com'), true)
    assert.equal(esCorreo('ana@correo'), false)
    assert.equal(esCorreo('ana @correo.com'), false)
    assert.equal(correo()('x@'), 'El correo electrónico no tiene un formato válido.')
  })
  it('fecha real y no futura cuando se pide', () => {
    assert.equal(esFecha('2026-02-28'), true)
    assert.equal(esFecha('2026-02-30'), false)
    assert.equal(fecha({ noFutura: true })('2999-01-01'), 'La fecha no puede ser posterior a hoy.')
  })
})

describe('Obligatorios, longitudes y números', () => {
  it('obligatorio con mensaje en género correcto', () => {
    assert.equal(requerido('La cédula', true)('  '), 'La cédula es obligatoria.')
    assert.equal(requerido('El nombre')('Ana'), null)
  })
  it('longitud en el límite', () => {
    const regla = longitud('El asunto', 20, 150)
    assert.equal(regla('x'.repeat(20)), null)
    assert.equal(regla('x'.repeat(150)), null)
    assert.match(regla('x'.repeat(19)) ?? '', /al menos 20/)
    assert.match(regla('x'.repeat(151)) ?? '', /150 caracteres/)
  })
  it('enteros positivos', () => {
    assert.equal(entero('La cantidad', 1)('3'), null)
    assert.equal(entero('La cantidad', 1)('1.5'), 'La cantidad debe ser un número entero.')
    assert.equal(entero('La cantidad', 0)('-1'), 'La cantidad no puede ser menor a 0.')
  })
})

describe('validarCampos', () => {
  it('devuelve el primer error de cada campo', () => {
    const errores = validarCampos(
      { cedula: [requerido('La cédula', true), cedula()], correo: [requerido('El correo'), correo()] },
      { cedula: '', correo: 'malo' },
    )
    assert.deepEqual(errores, {
      cedula: 'La cédula es obligatoria.',
      correo: 'El correo electrónico no tiene un formato válido.',
    })
    assert.equal(hayErrores(errores), true)
    assert.equal(hayErrores(validarCampos({ correo: [correo()] }, { correo: 'a@b.cr' })), false)
  })
})

describe('Archivos adjuntos', () => {
  const opciones = { extensiones: ['.pdf', '.jpg'], maxBytes: 5 * MB }
  const archivo = (name: string, size: number) => ({ name, size }) as File
  it('acepta tipo y peso permitidos', () => {
    assert.equal(validarArchivo(archivo('carta.PDF', 5 * MB), opciones), null)
  })
  it('rechaza formato no permitido o más pesado que el límite', () => {
    assert.match(validarArchivo(archivo('virus.exe', 10), opciones) ?? '', /Formato no permitido/)
    assert.equal(validarArchivo(archivo('foto.jpg', 5 * MB + 1), opciones), 'El archivo no puede superar los 5 MB.')
  })
})
