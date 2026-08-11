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
    if (!cedula.trim()) return

    setLookupStatus('loading')
    try {
      const res = await fetch(
        `https://api.hacienda.go.cr/fe/ae?identificacion=${cedula.trim()}`,
      )
      const text = await res.text()
      const data: HaciendaResponse = text ? JSON.parse(text) : {}

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
