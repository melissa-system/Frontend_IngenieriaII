import { useState, type FormEvent } from 'react'
import { MENSAJES_VALIDACION } from '../lib/validaciones'

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
        digitos ? MENSAJES_VALIDACION.cedulaFisica : 'La cédula es obligatoria.',
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