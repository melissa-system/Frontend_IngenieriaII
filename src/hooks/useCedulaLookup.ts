import { useState, type FormEvent } from 'react'

export type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error'

interface HaciendaResponse {
  nombre?: string
}

export function useCedulaLookup() {
  const [cedula, setCedula] = useState('')
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [nombreEncontrado, setNombreEncontrado] = useState<string | null>(null)

  const datosListos = lookupStatus === 'found' || lookupStatus === 'not-found'

  const buscarCedula = async (e: FormEvent) => {
    e.preventDefault()
    const digitos = cedula.replace(/\D/g, '')
    if (!digitos) return

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
  }
}
