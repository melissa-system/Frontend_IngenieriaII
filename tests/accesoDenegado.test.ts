// Discriminador de denegaciones de acceso (PBI pantalla de Acceso denegado).
// Solo el 403 que el backend marca con `origen: 'autorizacion'` (RolesGuard)
// debe abrir la pantalla de Acceso Denegado; los demás 403 (reCAPTCHA, reglas
// de negocio) tienen que seguir siendo errores en línea en la página que los
// disparó. Aquí se prueba esa distinción, que es toda la lógica del helper.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  EVENTO_ACCESO_DENEGADO,
  ORIGEN_AUTORIZACION,
  alDenegarAcceso,
  esDenegacionDeAutorizacion,
  notificarAccesoDenegado,
} from '../src/lib/accesoDenegado.ts'

describe('Detectar una denegación de autorización', () => {
  it('reconoce el 403 de RolesGuard, que es el único que trae la marca', () => {
    assert.equal(
      esDenegacionDeAutorizacion({
        statusCode: 403,
        codigo: 'SIN_PERMISO',
        message: 'No tienes permisos suficientes para acceder a este recurso',
        errores: [],
        origen: 'autorizacion',
      }),
      true,
    )
  })

  it('deja pasar los otros 403 para que se muestren como error en línea', () => {
    // reCAPTCHA: mismo código, pero sin la marca.
    assert.equal(
      esDenegacionDeAutorizacion({
        statusCode: 403,
        codigo: 'SIN_PERMISO',
        message: 'No pudimos confirmar que no eres un robot.',
        errores: [],
      }),
      false,
    )
    // Reglas de negocio (cambio-propietario) u origen desconocido.
    assert.equal(
      esDenegacionDeAutorizacion({ statusCode: 403, origen: 'regla-de-negocio' }),
      false,
    )
    assert.equal(esDenegacionDeAutorizacion({ message: 'denegado' }), false)
  })

  it('no se confunde con un cuerpo malformado', () => {
    assert.equal(esDenegacionDeAutorizacion(undefined), false)
    assert.equal(esDenegacionDeAutorizacion(null), false)
    assert.equal(esDenegacionDeAutorizacion('origen'), false)
    assert.equal(esDenegacionDeAutorizacion(403), false)
    assert.equal(esDenegacionDeAutorizacion([]), false)
  })

  it('usa exactamente la marca que escribe el backend', () => {
    assert.equal(ORIGEN_AUTORIZACION, 'autorizacion')
    assert.equal(EVENTO_ACCESO_DENEGADO, 'siapb:acceso-denegado')
  })
})

describe('Evento de acceso denegado', () => {
  it('avisa a los oyentes y se puede desuscribir', () => {
    // Node no trae `window`: se instala un EventTarget mínimo con la API que
    // usan las funciones (addEventListener / removeEventListener / dispatchEvent).
    const win = new EventTarget()
    Object.assign(globalThis, { window: win })

    let avisos = 0
    const limpiar = alDenegarAcceso(() => {
      avisos += 1
    })

    notificarAccesoDenegado()
    assert.equal(avisos, 1)

    limpiar()
    notificarAccesoDenegado()
    assert.equal(avisos, 1, 'tras limpiar() no debe seguir recibiendo')

    delete (globalThis as { window?: unknown }).window
  })
})
