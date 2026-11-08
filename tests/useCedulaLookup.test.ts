/// <reference types="node" />
import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { consultarNombrePorCedula } from '../src/hooks/useCedulaLookup.ts'

describe('useCedulaLookup: consultarNombrePorCedula', () => {
  const fetchOriginal = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = fetchOriginal
  })

  it('retorna null si la identificación tiene menos de 9 dígitos', async () => {
    const res = await consultarNombrePorCedula('1234')
    assert.equal(res, null)
  })

  it('retorna null si la identificación tiene más de 12 dígitos', async () => {
    const res = await consultarNombrePorCedula('1234567890123')
    assert.equal(res, null)
  })

  it('consulta correctamente la API con cédula física formateada y retorna el nombre', async () => {
    let urlConsultada = ''
    globalThis.fetch = (async (url: string | URL | Request) => {
      urlConsultada = String(url)
      return {
        ok: true,
        json: async () => ({ nombre: 'JUAN PÉREZ ROJAS' }),
        text: async () => JSON.stringify({ nombre: 'JUAN PÉREZ ROJAS' }),
      } as Response
    }) as typeof fetch

    const resultado = await consultarNombrePorCedula('1-0234-0567')
    assert.equal(resultado, 'JUAN PÉREZ ROJAS')
    assert.ok(urlConsultada.includes('identificacion=102340567'))
  })

  it('consulta correctamente cédula jurídica de 10 dígitos', async () => {
    let urlConsultada = ''
    globalThis.fetch = (async (url: string | URL | Request) => {
      urlConsultada = String(url)
      return {
        ok: true,
        json: async () => ({ nombre: 'EMPRESA EJEMPLO S.A.' }),
        text: async () => JSON.stringify({ nombre: 'EMPRESA EJEMPLO S.A.' }),
      } as Response
    }) as typeof fetch

    const resultado = await consultarNombrePorCedula('3-101-123456')
    assert.equal(resultado, 'EMPRESA EJEMPLO S.A.')
    assert.ok(urlConsultada.includes('identificacion=3101123456'))
  })

  it('retorna null si la API responde con status no-ok (ej. 404)', async () => {
    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 404,
      } as Response
    }) as typeof fetch

    const resultado = await consultarNombrePorCedula('9-9999-9999')
    assert.equal(resultado, null)
  })

  it('retorna null sin lanzar excepciones si ocurre un error de red', async () => {
    globalThis.fetch = (async () => {
      throw new Error('Network error / Failed to fetch')
    }) as typeof fetch

    const resultado = await consultarNombrePorCedula('1-1111-1111')
    assert.equal(resultado, null)
  })
})

