import { useState, useEffect, useRef, type FormEvent } from 'react'
import {
  obtenerConfiguracion,
  actualizarConfiguracion,
  type Configuracion,
  type ConfiguracionUpdatePayload,
} from '../Services/configuracion.service'

const RE_TELEFONO = /^\d{4}-?\d{4}$/
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RE_URL = /^https?:\/\/.+/

interface Errores {
  direccion?: string
  telefono?: string
  correo?: string
  enlaceMaps?: string
  coordenadas?: string
  telJunta1?: string
  telJunta2?: string
}

function ContactoAsada() {
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [enlaceMaps, setEnlaceMaps] = useState('')
  const [coordenadas, setCoordenadas] = useState('')
  const [telJunta1, setTelJunta1] = useState('')
  const [telJunta2, setTelJunta2] = useState('')

  const inicialesRef = useRef({
    direccion: '',
    telefono: '',
    correo: '',
    enlaceMaps: '',
    coordenadas: '',
    telJunta1: '',
    telJunta2: '',
  })

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)
  const [errores, setErrores] = useState<Errores>({})

  function cargarValores(data: Configuracion) {
    setDireccion(data.direccion)
    setTelefono(data.telefono)
    setCorreo(data.correo_electronico)
    setEnlaceMaps(data.enlace_google_maps)
    setCoordenadas(data.coordenadas_mapa)
    setTelJunta1(data.telefono_miembro_junta_1)
    setTelJunta2(data.telefono_miembro_junta_2)
    inicialesRef.current = {
      direccion: data.direccion,
      telefono: data.telefono,
      correo: data.correo_electronico,
      enlaceMaps: data.enlace_google_maps,
      coordenadas: data.coordenadas_mapa,
      telJunta1: data.telefono_miembro_junta_1,
      telJunta2: data.telefono_miembro_junta_2,
    }
  }

  useEffect(() => {
    let cancelado = false
    obtenerConfiguracion()
      .then((data) => {
        if (cancelado) return
        cargarValores(data)
      })
      .catch(() => {
        if (!cancelado) setErrorCarga('No se pudo cargar la configuración.')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-primary-500">Cargando configuración…</p>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold text-primary-900">
          Información de Contacto
        </h1>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorCarga}
        </div>
      </div>
    )
  }

  function cancelar() {
    const ini = inicialesRef.current
    setDireccion(ini.direccion)
    setTelefono(ini.telefono)
    setCorreo(ini.correo)
    setEnlaceMaps(ini.enlaceMaps)
    setCoordenadas(ini.coordenadas)
    setTelJunta1(ini.telJunta1)
    setTelJunta2(ini.telJunta2)
    setError(null)
    setExito(false)
    setErrores({})
  }

  function validar(): Errores {
    const e: Errores = {}

    if (!direccion.trim()) {
      e.direccion = 'La dirección es obligatoria.'
    } else if (direccion.length > 500) {
      e.direccion = 'La dirección no puede exceder 500 caracteres.'
    }

    if (telefono && !RE_TELEFONO.test(telefono)) {
      e.telefono = 'Formato: 0000-0000 (8 dígitos).'
    }

    if (correo && !RE_EMAIL.test(correo)) {
      e.correo = 'El correo electrónico no es válido.'
    } else if (correo.length > 150) {
      e.correo = 'El correo no puede exceder 150 caracteres.'
    }

    if (enlaceMaps && !RE_URL.test(enlaceMaps)) {
      e.enlaceMaps = 'Debe ser una URL válida (https://...).'
    }

    if (coordenadas.length > 100) {
      e.coordenadas = 'Las coordenadas no pueden exceder 100 caracteres.'
    }

    if (telJunta1 && !RE_TELEFONO.test(telJunta1)) {
      e.telJunta1 = 'Formato: 0000-0000.'
    }

    if (telJunta2 && !RE_TELEFONO.test(telJunta2)) {
      e.telJunta2 = 'Formato: 0000-0000.'
    }

    return e
  }

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setExito(false)

    const validacion = validar()
    setErrores(validacion)
    if (Object.keys(validacion).length > 0) return

    setGuardando(true)
    try {
      const payload: ConfiguracionUpdatePayload = {
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        correo_electronico: correo.trim(),
        enlace_google_maps: enlaceMaps.trim(),
        coordenadas_mapa: coordenadas.trim(),
        telefono_miembro_junta_1: telJunta1.trim(),
        telefono_miembro_junta_2: telJunta2.trim(),
      }
      const actualizada = await actualizarConfiguracion(payload)
      cargarValores(actualizada)
      setExito(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar la configuración.',
      )
    } finally {
      setGuardando(false)
    }
  }

  const inputClass = (tieneError: boolean) =>
    `mt-1 w-full rounded-lg border px-4 py-2.5 text-sm text-primary-900 focus:outline-none ${
      tieneError
        ? 'border-red-400 focus:border-red-500'
        : 'border-primary-200 focus:border-primary-500'
    }`

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Información de Contacto
        </h1>
        <p className="mt-1 text-sm text-primary-500">
          Datos de contacto y ubicación de la ASADA.
        </p>
      </div>

      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        {exito && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Configuración guardada correctamente.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={manejarEnvio} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Dirección completa <span className="text-red-500">*</span>
            </label>
            <textarea
              value={direccion}
              onChange={(e) => {
                setDireccion(e.target.value)
                if (errores.direccion) setErrores((prev) => ({ ...prev, direccion: undefined }))
              }}
              rows={2}
              className={inputClass(!!errores.direccion)}
            />
            {errores.direccion && (
              <p className="mt-1 text-xs text-red-600">{errores.direccion}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Teléfono principal
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => {
                  setTelefono(e.target.value)
                  if (errores.telefono) setErrores((prev) => ({ ...prev, telefono: undefined }))
                }}
                placeholder="8741-8543"
                className={inputClass(!!errores.telefono)}
              />
              {errores.telefono && (
                <p className="mt-1 text-xs text-red-600">{errores.telefono}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Correo electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value)
                  if (errores.correo) setErrores((prev) => ({ ...prev, correo: undefined }))
                }}
                placeholder="correo@ejemplo.com"
                className={inputClass(!!errores.correo)}
              />
              {errores.correo && (
                <p className="mt-1 text-xs text-red-600">{errores.correo}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700">
              Enlace de Google Maps
            </label>
            <input
              type="url"
              value={enlaceMaps}
              onChange={(e) => {
                setEnlaceMaps(e.target.value)
                if (errores.enlaceMaps) setErrores((prev) => ({ ...prev, enlaceMaps: undefined }))
              }}
              placeholder="https://maps.app.goo.gl/..."
              className={inputClass(!!errores.enlaceMaps)}
            />
            {errores.enlaceMaps && (
              <p className="mt-1 text-xs text-red-600">{errores.enlaceMaps}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700">
              Coordenadas del mapa (lat,lng)
            </label>
            <input
              type="text"
              value={coordenadas}
              onChange={(e) => {
                setCoordenadas(e.target.value)
                if (errores.coordenadas) setErrores((prev) => ({ ...prev, coordenadas: undefined }))
              }}
              placeholder="9.9263539,-84.9810364"
              className={inputClass(!!errores.coordenadas)}
            />
            {errores.coordenadas && (
              <p className="mt-1 text-xs text-red-600">{errores.coordenadas}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Tel. Miembro de Junta 1
              </label>
              <input
                type="tel"
                value={telJunta1}
                onChange={(e) => {
                  setTelJunta1(e.target.value)
                  if (errores.telJunta1) setErrores((prev) => ({ ...prev, telJunta1: undefined }))
                }}
                placeholder="8435-8518"
                className={inputClass(!!errores.telJunta1)}
              />
              {errores.telJunta1 && (
                <p className="mt-1 text-xs text-red-600">{errores.telJunta1}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Tel. Miembro de Junta 2
              </label>
              <input
                type="tel"
                value={telJunta2}
                onChange={(e) => {
                  setTelJunta2(e.target.value)
                  if (errores.telJunta2) setErrores((prev) => ({ ...prev, telJunta2: undefined }))
                }}
                placeholder="8305-0012"
                className={inputClass(!!errores.telJunta2)}
              />
              {errores.telJunta2 && (
                <p className="mt-1 text-xs text-red-600">{errores.telJunta2}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={cancelar}
              disabled={guardando}
              className="rounded-full border border-primary-300 px-5 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContactoAsada
