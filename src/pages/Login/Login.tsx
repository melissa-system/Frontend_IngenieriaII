import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import AuthLayout from '../../components/auth/AuthLayout'
import { OjoAbiertoIcon, OjoCerradoIcon } from '../../components/auth/EyeIcons'

// Traduce errores de red/validación del backend a un mensaje legible.
function obtenerMensajeError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
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

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    '/dashboard'
  // Mensaje de éxito opcional que llega al redirigir desde otro flujo (por
  // ejemplo, tras restablecer la contraseña — ver RestablecerPassword.tsx).
  const mensajeExito = (
    location.state as { mensajeExito?: string } | null
  )?.mensajeExito

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
    <AuthLayout subtitle="Sistema de Información de Abonados Pueblo Nuevo">
      {mensajeExito && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800"
        >
          {mensajeExito}
        </div>
      )}

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

        <Link
          to="/recuperar-password"
          className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </form>

      <Link
        to="/"
        className="mt-5 block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        ← Volver al sitio
      </Link>
    </AuthLayout>
  )
}

export default Login