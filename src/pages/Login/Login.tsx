import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import logo from '../../assets/logo.png'

// Traduce errores de red/validación del backend a un mensaje legible.
function obtenerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Inténtalo más tarde.'
    }
    const msg = error.response?.data?.message
    if (typeof msg === 'string') return msg
    if (Array.isArray(msg)) return msg.join('. ')
  }
  return 'Ocurrió un error. Intenta de nuevo.'
}

// El backend envía Retry-After en segundos (tiempo restante real de bloqueo).
// Fallback: la ventana completa de la política del throttler.
const BLOQUEO_DEFECTO_SEGUNDOS = 15 * 60

// Formato mm:ss para el contador regresivo.
function formatearTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function OjoAbiertoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function OjoCerradoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243"
      />
    </svg>
  )
}

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // Segundos restantes de bloqueo por límite de intentos (429). En 0 = libre.
  const [bloqueoSegundos, setBloqueoSegundos] = useState(0)

  // Contador regresivo: cada tick reprograma el siguiente y se detiene solo
  // al llegar a cero, rehabilitando el botón sin intervención del usuario.
  useEffect(() => {
    if (bloqueoSegundos === 0) return
    const t = setTimeout(() => setBloqueoSegundos((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [bloqueoSegundos])

  // Campos obligatorios completos antes de habilitar el envío.
  const puedeEnviar = email.trim() !== '' && password !== '' && !loading

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // Bloqueo activo: no enviar nada (cada petición rechazada también cuenta
    // en el throttler y extendería la ventana de castigo).
    if (bloqueoSegundos > 0) return
    setError('')
    setLoading(true)

    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        // Límite de intentos alcanzado: el header Retry-After trae los
        // segundos restantes reales; con él se arma el contador regresivo.
        const retry = Number(err.response.headers['retry-after'])
        setBloqueoSegundos(
          Number.isFinite(retry) && retry > 0
            ? retry
            : BLOQUEO_DEFECTO_SEGUNDOS,
        )
      } else {
        setError(obtenerMensajeError(err))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <div className="mb-6 text-center">
          <img
            src={logo}
            alt="ASADA Pueblo Nuevo"
            className="mx-auto h-16 w-auto object-contain sm:h-20"
          />
          <p className="mt-3 text-sm text-primary-500">
            Sistema de Información de Abonados Pueblo Nuevo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-primary-900"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 placeholder-primary-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-primary-900"
            >
              Contraseña
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={mostrarPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-primary-200 px-4 py-2.5 pr-11 text-primary-900 placeholder-primary-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
              <button
                type="button"
                aria-label={
                  mostrarPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
                onClick={() => setMostrarPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-primary-400 transition-colors hover:text-primary-700"
              >
                {mostrarPassword ? <OjoCerradoIcon /> : <OjoAbiertoIcon />}
              </button>
            </div>
          </div>

          {bloqueoSegundos > 0 ? (
            <div
              role="alert"
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
            >
              <p className="font-semibold">
                Demasiados intentos fallidos de inicio de sesión.
              </p>
              <p className="mt-1">
                Por seguridad tu acceso quedó bloqueado temporalmente. Podrás
                intentar de nuevo en{' '}
                <span className="font-mono font-bold">
                  {formatearTiempo(bloqueoSegundos)}
                </span>
                .
              </p>
            </div>
          ) : (
            error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                {error}
              </p>
            )
          )}

          <button
            type="submit"
            disabled={!puedeEnviar || loading || bloqueoSegundos > 0}
            className="w-full rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <Link
          to="/"
          className="mt-5 block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          ← Volver al sitio
        </Link>
      </div>
    </div>
  )
}

export default Login
