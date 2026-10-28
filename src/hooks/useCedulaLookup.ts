import { useState, useRef, useCallback, type FormEvent } from 'react'

export type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error'

interface HaciendaResponse {
  nombre?: string
}

// Función auxiliar para dar formato 1-2345-6789
export function formatearCedulaFisica(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 9)
  if (digitos.length <= 1) return digitos
  if (digitos.length <= 5) return `${digitos.slice(0, 1)}-${digitos.slice(1)}`
  return `${digitos.slice(0, 1)}-${digitos.slice(1, 5)}-${digitos.slice(5)}`
}

/**
 * Consulta el nombre completo de una persona física o jurídica a través de la API pública de Hacienda.
 * Retorna el nombre si fue encontrado, o null si no se encuentra o la API falla.
 */
export async function consultarNombrePorCedula(
  cedulaOIdentificacion: string,
): Promise<string | null> {
  const digitos = cedulaOIdentificacion.replace(/\D/g, '')
  if (digitos.length !== 9 && digitos.length !== 10) return null

  try {
    const res = await fetch(
      `https://api.hacienda.go.cr/fe/ae?identificacion=${digitos}`,
    )
    if (!res.ok) return null
    try {
      const data = (await res.json()) as HaciendaResponse
      return data?.nombre ? String(data.nombre).trim() : null
    } catch {
      try {
        const text = await res.text()
        const data = text ? (JSON.parse(text) as HaciendaResponse) : {}
        return data?.nombre ? String(data.nombre).trim() : null
      } catch {
        return null
      }
    }
  } catch {
    return null
  }
}

/**
 * Hook para autocompletar el nombre a partir del número de cédula en formularios.
 * Se dispara al alcanzar 9 dígitos (o 10 para jurídica) o al evento onBlur.
 * Si la consulta falla o no se encuentra, permite la edición manual sin bloquear.
 */
export function useAutocompletarCedula(
  onNombreEncontrado: (nombre: string) => void,
) {
  const [cargando, setCargando] = useState(false)
  const ultimaConsultada = useRef('')

  const consultar = useCallback(
    async (cedula: string) => {
      const digitos = cedula.replace(/\D/g, '')
      if (
        (digitos.length !== 9 && digitos.length !== 10) ||
        digitos === ultimaConsultada.current
      ) {
        return
      }

      ultimaConsultada.current = digitos
      setCargando(true)
      try {
        const nombre = await consultarNombrePorCedula(digitos)
        if (nombre) {
          onNombreEncontrado(nombre)
        }
      } finally {
        setCargando(false)
      }
    },
    [onNombreEncontrado],
  )

  const resetearConsulta = useCallback(() => {
    ultimaConsultada.current = ''
    setCargando(false)
  }, [])

  return { cargando, consultar, resetearConsulta }
}

export function useCedulaLookup() {
  const [cedula, setCedulaRaw] = useState('')
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [nombreEncontrado, setNombreEncontrado] = useState<string | null>(null)
  const [errorCedula, setErrorCedula] = useState<string | null>(null)

  const setCedula = (valor: string) => {
    setCedulaRaw(formatearCedulaFisica(valor))
    setErrorCedula(null)
  }

  const datosListos = lookupStatus === 'found' || lookupStatus === 'not-found'

  const buscarCedula = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    const digitos = cedula.replace(/\D/g, '')
    // Una cédula física tiene exactamente 9 dígitos. Antes se rellenaba con
    // ceros a la izquierda y una cédula incompleta se aceptaba.
    if (digitos.length !== 9) {
      setErrorCedula(
        digitos
          ? 'La cédula física debe tener 9 dígitos (ej. 1-2345-6789).'
          : 'La cédula es obligatoria.',
      )
      return
    }

    setLookupStatus('loading')
    try {
      const res = await fetch(
        `https://api.hacienda.go.cr/fe/ae?identificacion=${digitos}`,
      )
      const text = await res.text()
      let data: HaciendaResponse = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = {}
      }

      if (data.nombre) {
        setNombreEncontrado(data.nombre)
        setLookupStatus('found')
      } else {
        setNombreEncontrado(null)
        setLookupStatus('not-found')
      }
    } catch {
      setNombreEncontrado(null)
      setLookupStatus('error')
    }
  }

  return {
    cedula,
    setCedula,
    lookupStatus,
    setLookupStatus,
    datosListos,
    nombreEncontrado,
    buscarCedula,
    errorCedula,
  }
}