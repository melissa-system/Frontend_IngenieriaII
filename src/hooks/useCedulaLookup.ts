import { useState, type FormEvent } from 'react'

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

  const setCedula = (valor: string) => {
    setCedulaRaw(formatearCedulaFisica(valor))
  }

  const datosListos = lookupStatus === 'found' || lookupStatus === 'not-found'

  const buscarCedula = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    let digitos = cedula.replace(/\D/g, '')
    if (!digitos) return

    // Normalizar a 9 dígitos si es cédula física (relleno con cero a la izquierda si hiciera falta)
    if (digitos.length < 9) {
      digitos = digitos.padStart(9, '0')
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
  }
}