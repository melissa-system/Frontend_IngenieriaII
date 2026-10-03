// Pruebas del lector único de errores de la API (PBI 511 / Task 516): el
// frontend entiende el formato { statusCode, codigo, message, errores } y
// lo muestra igual en todas las pantallas.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import {
  crearErrorApi,
  ErrorApi,
  erroresPorCampo,
  obtenerMensajeError,
} from '../src/components/Services/erroresApi.ts'

function errorAxios(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response)
}

const respuestaValidacion = {
  statusCode: 400,
  codigo: 'DATOS_INVALIDOS',
  message: 'Revise los datos marcados en el formulario.',
  errores: [
    { campo: 'cedula', mensaje: 'La cédula debe tener 9 dígitos.' },
    { campo: 'telefono', mensaje: 'El teléfono debe tener 8 dígitos.' },
    { campo: 'telefono', mensaje: 'Segundo error del mismo campo.' },
  ],
}

describe('Lector de errores de la API', () => {
  it('usa el mensaje general del backend', () => {
    assert.equal(
      obtenerMensajeError(errorAxios(400, respuestaValidacion), 'fallback'),
      'Revise los datos marcados en el formulario.',
    )
  })

  it('convierte la lista de errores en un mensaje por campo (el primero de cada uno)', () => {
    const error = crearErrorApi(errorAxios(400, respuestaValidacion), 'fallback')
    assert.ok(error instanceof ErrorApi)
    assert.equal(error.status, 400)
    assert.equal(error.codigo, 'DATOS_INVALIDOS')
    assert.deepEqual(error.errores, {
      cedula: 'La cédula debe tener 9 dígitos.',
      telefono: 'El teléfono debe tener 8 dígitos.',
    })
  })

  it('traduce los nombres de campo del backend a los del formulario', () => {
    const error = crearErrorApi(
      errorAxios(409, {
        statusCode: 409,
        codigo: 'DUPLICADO',
        message: 'Ya existe una cuenta con ese correo',
        errores: [{ campo: 'email', mensaje: 'Ya existe una cuenta con ese correo' }],
      }),
      'fallback',
    )
    assert.deepEqual(erroresPorCampo(error, { email: 'correo' }), {
      correo: 'Ya existe una cuenta con ese correo',
    })
  })

  it('sigue entendiendo el formato anterior (message como arreglo)', () => {
    assert.equal(
      obtenerMensajeError(errorAxios(400, { message: ['nombre vacío', 'cédula inválida'] }), 'x'),
      'nombre vacío. cédula inválida',
    )
  })

  it('sin conexión o sin respuesta usa un mensaje claro', () => {
    const sinRed = new AxiosError('Network Error', 'ERR_NETWORK')
    assert.equal(
      obtenerMensajeError(sinRed, 'x'),
      'No se pudo conectar con el servidor. Inténtalo más tarde.',
    )
    assert.equal(obtenerMensajeError(new Error('boom'), 'No se pudo guardar.'), 'No se pudo guardar.')
    assert.deepEqual(erroresPorCampo(new Error('boom')), {})
  })
})
