import { useEffect, useState } from 'react'
import {
  alActualizarConfiguracion,
  obtenerConfiguracion,
  type Configuracion,
} from '../components/Services/configuracion.service'

// Configuración pública de la ASADA (horario, contacto, ubicación) para el
// footer y la sección Ubicación. Además de cargarla al montar, la mantiene al
// día sin recargar la página:
//  - al guardar cambios desde el dashboard (en esta u otra pestaña), y
//  - al volver a la pestaña, por si cambió desde otro equipo.
// Devuelve null mientras carga o si la API falla; quien la usa cae a sus
// valores por defecto.
export function useConfiguracion(): Configuracion | null {
  const [config, setConfig] = useState<Configuracion | null>(null)

  useEffect(() => {
    let activo = true

    function cargar() {
      obtenerConfiguracion()
        .then((data) => {
          if (activo) setConfig(data)
        })
        .catch(() => {
          /* se mantiene lo último cargado (o los DEFAULTS) */
        })
    }

    function alVolverAPestana() {
      if (document.visibilityState === 'visible') cargar()
    }

    cargar()
    const desuscribir = alActualizarConfiguracion((nueva) => {
      if (nueva) setConfig(nueva)
      else cargar()
    })
    document.addEventListener('visibilitychange', alVolverAPestana)

    return () => {
      activo = false
      desuscribir()
      document.removeEventListener('visibilitychange', alVolverAPestana)
    }
  }, [])

  return config
}
