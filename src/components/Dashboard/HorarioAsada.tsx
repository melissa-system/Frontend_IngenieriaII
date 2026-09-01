import { useState, useEffect, useRef, type FormEvent } from 'react'
import {
  obtenerConfiguracion,
  actualizarConfiguracion,
  type Configuracion,
  type ConfiguracionUpdatePayload,
} from '../Services/configuracion.service'

interface Errores {
  horarioLunVie?: string
  horarioSabado?: string
  horarioDomingo?: string
}

function HorarioAsada() {
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [horarioLunVie, setHorarioLunVie] = useState('')
  const [horarioSabado, setHorarioSabado] = useState('')
  const [horarioDomingo, setHorarioDomingo] = useState('')

  const inicialesRef = useRef({
    horarioLunVie: '',
    horarioSabado: '',
    horarioDomingo: '',
  })

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)
  const [errores, setErrores] = useState<Errores>({})

  function cargarValores(data: Configuracion) {
    setHorarioLunVie(data.horario_lunes_viernes)
    setHorarioSabado(data.horario_sabado)
    setHorarioDomingo(data.horario_domingo)
    inicialesRef.current = {
      horarioLunVie: data.horario_lunes_viernes,
      horarioSabado: data.horario_sabado,
      horarioDomingo: data.horario_domingo,
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
          Horario de Atención
        </h1>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorCarga}
        </div>
      </div>
    )
  }

  function cancelar() {
    const ini = inicialesRef.current
    setHorarioLunVie(ini.horarioLunVie)
    setHorarioSabado(ini.horarioSabado)
    setHorarioDomingo(ini.horarioDomingo)
    setError(null)
    setExito(false)
    setErrores({})
  }

  function validar(): Errores {
    const e: Errores = {}

    if (horarioLunVie.length > 100) {
      e.horarioLunVie = 'No puede exceder 100 caracteres.'
    }
    if (horarioSabado.length > 100) {
      e.horarioSabado = 'No puede exceder 100 caracteres.'
    }
    if (horarioDomingo.length > 100) {
      e.horarioDomingo = 'No puede exceder 100 caracteres.'
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
        horario_lunes_viernes: horarioLunVie.trim(),
        horario_sabado: horarioSabado.trim(),
        horario_domingo: horarioDomingo.trim(),
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
          Horario de Atención
        </h1>
        <p className="mt-1 text-sm text-primary-500">
          Horarios de atención de la ASADA.
        </p>
      </div>

      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        {exito && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Horario guardado correctamente.
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
              Lunes a Viernes
            </label>
            <input
              type="text"
              value={horarioLunVie}
              onChange={(e) => {
                setHorarioLunVie(e.target.value)
                if (errores.horarioLunVie) setErrores((prev) => ({ ...prev, horarioLunVie: undefined }))
              }}
              placeholder="8:00 am - 5:00 pm"
              className={inputClass(!!errores.horarioLunVie)}
            />
            {errores.horarioLunVie && (
              <p className="mt-1 text-xs text-red-600">{errores.horarioLunVie}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700">
              Sábados
            </label>
            <input
              type="text"
              value={horarioSabado}
              onChange={(e) => {
                setHorarioSabado(e.target.value)
                if (errores.horarioSabado) setErrores((prev) => ({ ...prev, horarioSabado: undefined }))
              }}
              placeholder="8:00 am - 1:00 pm"
              className={inputClass(!!errores.horarioSabado)}
            />
            {errores.horarioSabado && (
              <p className="mt-1 text-xs text-red-600">{errores.horarioSabado}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700">
              Domingos
            </label>
            <input
              type="text"
              value={horarioDomingo}
              onChange={(e) => {
                setHorarioDomingo(e.target.value)
                if (errores.horarioDomingo) setErrores((prev) => ({ ...prev, horarioDomingo: undefined }))
              }}
              placeholder="Cerrado"
              className={inputClass(!!errores.horarioDomingo)}
            />
            {errores.horarioDomingo && (
              <p className="mt-1 text-xs text-red-600">{errores.horarioDomingo}</p>
            )}
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

export default HorarioAsada
