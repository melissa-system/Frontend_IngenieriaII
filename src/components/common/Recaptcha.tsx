import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'

// Clave de SITIO de reCAPTCHA v2 (la pública; la secreta vive en el backend).
//
// Si no está configurada, en desarrollo se usan las claves de prueba de
// Google, con las que toda verificación pasa y el widget avisa que es solo
// para pruebas. En producción NO se usa ese respaldo: es preferible ver un
// error de configuración a creer que el formulario está protegido cuando no
// lo está.
const CLAVE_PRUEBA_GOOGLE = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
const CLAVE_SITIO =
  (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined) ??
  (import.meta.env.DEV ? CLAVE_PRUEBA_GOOGLE : undefined)

const URL_SCRIPT = 'https://www.google.com/recaptcha/api.js?render=explicit'
const ID_SCRIPT = 'recaptcha-script'

// Cuánto se espera a que cargue el script de Google antes de darlo por
// fallido. Sin este límite, si el script queda colgado (red lenta, dominio
// bloqueado) la persona vería el formulario bloqueado para siempre sin saber
// por qué.
const ESPERA_MAXIMA_MS = 10000

type Estado = 'cargando' | 'listo' | 'error'

export interface RecaptchaRef {
  // Vuelve a dejar la casilla sin marcar. Hay que llamarla cuando el envío
  // falla: el token de reCAPTCHA es de un solo uso, así que reintentar con
  // el mismo token siempre sería rechazado por el backend.
  reiniciar: () => void
}

// El objeto que Google inyecta en window. Se declara solo lo que se usa.
interface GrecaptchaApi {
  render: (
    contenedor: HTMLElement,
    opciones: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ) => number
  reset: (id?: number) => void
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaApi & { ready?: (cb: () => void) => void }
  }
}

// Carga el script de Google una sola vez, aunque haya varios formularios en
// la misma página.
function cargarScript(): Promise<void> {
  if (window.grecaptcha?.render) return Promise.resolve()

  return new Promise((resolver, rechazar) => {
    const existente = document.getElementById(ID_SCRIPT)
    if (existente) {
      existente.addEventListener('load', () => resolver())
      existente.addEventListener('error', () => rechazar(new Error('script')))
      return
    }
    const script = document.createElement('script')
    script.id = ID_SCRIPT
    script.src = URL_SCRIPT
    script.async = true
    script.defer = true
    script.onload = () => resolver()
    script.onerror = () => rechazar(new Error('script'))
    document.head.appendChild(script)
  })
}

/**
 * Casilla "No soy un robot" (reCAPTCHA v2) para formularios públicos.
 *
 * Avisa al formulario del token mediante onCambio: recibe el token cuando la
 * persona marca la casilla, y null cuando se vence o falla. El formulario
 * usa ese valor para habilitar o deshabilitar su botón de envío.
 *
 * Uso:
 *   const recaptchaRef = useRef<RecaptchaRef>(null)
 *   <Recaptcha ref={recaptchaRef} onCambio={setTokenRecaptcha} />
 *   // si el envío falla: recaptchaRef.current?.reiniciar()
 */
const Recaptcha = forwardRef<RecaptchaRef, { onCambio: (token: string | null) => void }>(
  function Recaptcha({ onCambio }, ref) {
    const contenedorRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<number | null>(null)
    const [estado, setEstado] = useState<Estado>('cargando')
    const [expirado, setExpirado] = useState(false)

    // onCambio se guarda en una ref para no re-renderizar el widget cada vez
    // que el formulario padre cambia (escribir en un campo lo volvería a
    // dibujar y la persona perdería la casilla ya marcada).
    const onCambioRef = useRef(onCambio)
    onCambioRef.current = onCambio

    useImperativeHandle(ref, () => ({
      reiniciar: () => {
        if (widgetIdRef.current !== null) {
          window.grecaptcha?.reset(widgetIdRef.current)
          setExpirado(false)
          onCambioRef.current(null)
        }
      },
    }))

    useEffect(() => {
      if (!CLAVE_SITIO) {
        setEstado('error')
        return
      }

      let cancelado = false
      const temporizador = setTimeout(() => {
        if (!cancelado) setEstado('error')
      }, ESPERA_MAXIMA_MS)

      cargarScript()
        .then(() => {
          if (cancelado || !contenedorRef.current) return
          // Si el widget ya se dibujó (por un re-render en desarrollo con
          // StrictMode), no se vuelve a dibujar: Google lanza error.
          if (widgetIdRef.current !== null) return

          widgetIdRef.current = window.grecaptcha!.render(contenedorRef.current, {
            sitekey: CLAVE_SITIO,
            callback: (token) => {
              setExpirado(false)
              onCambioRef.current(token)
            },
            // El token dura unos 2 minutos; si la persona se demora llenando
            // el formulario, hay que pedirle que vuelva a marcar la casilla.
            'expired-callback': () => {
              setExpirado(true)
              onCambioRef.current(null)
            },
            'error-callback': () => {
              setEstado('error')
              onCambioRef.current(null)
            },
          })
          setEstado('listo')
        })
        .catch(() => {
          if (!cancelado) setEstado('error')
        })

      return () => {
        cancelado = true
        clearTimeout(temporizador)
      }
    }, [])

    return (
      <div className="space-y-2">
        <div ref={contenedorRef} />

        {estado === 'cargando' && (
          <p className="text-sm text-primary-500">
            Cargando la verificación de seguridad...
          </p>
        )}

        {estado === 'error' && (
          <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
            No se pudo cargar la verificación de seguridad. Revisa tu conexión y
            recarga la página. Si el problema continúa, comunícate con la ASADA
            para hacer tu trámite.
          </p>
        )}

        {expirado && (
          <p className="text-sm font-medium text-amber-600">
            La verificación venció. Vuelve a marcar la casilla.
          </p>
        )}
      </div>
    )
  },
)

export default Recaptcha
