import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  passwordCumpleMinimos,
  calcularFortaleza,
  confirmarResetPassword,
} from '../../lib/passwordReset.service'
import AuthLayout from '../../components/auth/AuthLayout'
import { OjoAbiertoIcon, OjoCerradoIcon } from '../../components/auth/EyeIcons'

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

const ETIQUETAS_FORTALEZA = ['', 'Débil', 'Media', 'Fuerte'] as const
const COLORES_FORTALEZA = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'] as const

function RestablecerPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fortaleza = calcularFortaleza(nuevaPassword)
  const cumpleMinimos = passwordCumpleMinimos(nuevaPassword)
  const coinciden = confirmarPassword !== '' && nuevaPassword === confirmarPassword
  const noCoinciden = confirmarPassword !== '' && nuevaPassword !== confirmarPassword

  const puedeEnviar = Boolean(token) && cumpleMinimos && coinciden && !loading

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!puedeEnviar) return
    setError('')
    setLoading(true)

    try {
      await confirmarResetPassword(token, nuevaPassword)
      // El backend ya revocó todas las sesiones anteriores al completar el
      // cambio; se avisa explícitamente en el mensaje que recibe el login.
      navigate('/login', {
        state: {
          mensajeExito:
            'Contraseña actualizada. Por seguridad, cerramos todas tus sesiones anteriores — inicia sesión de nuevo.',
        },
      })
    } catch (err) {
      setError(obtenerMensajeError(err))
    } finally {
      setLoading(false)
    }
  }

  // Sin token en la URL: no tiene sentido mostrar el formulario.
  if (!token) {
    return (
      <AuthLayout title="Enlace inválido">
        <div className="text-center">
          <p className="text-sm text-primary-700">
            Este enlace de recuperación de contraseña no es válido o está
            incompleto. Solicita uno nuevo para continuar.
          </p>
          <Link
            to="/recuperar-password"
            className="mt-6 inline-block rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Crea tu nueva contraseña">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="nuevaPassword"
            className="block text-sm font-medium text-primary-900"
          >
            Nueva contraseña
          </label>
          <div className="relative mt-1">
            <input
              id="nuevaPassword"
              type={mostrarPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-primary-200 px-4 py-2.5 pr-11 text-primary-900 placeholder-primary-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
            <button
              type="button"
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setMostrarPassword((p) => !p)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-primary-400 transition-colors hover:text-primary-700"
            >
              {mostrarPassword ? <OjoCerradoIcon /> : <OjoAbiertoIcon />}
            </button>
          </div>

          {nuevaPassword && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3].map((nivel) => (
                  <span
                    key={nivel}
                    className={`h-1.5 flex-1 rounded-full ${
                      nivel <= fortaleza
                        ? COLORES_FORTALEZA[fortaleza]
                        : 'bg-primary-100'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-primary-500">
                Seguridad: {ETIQUETAS_FORTALEZA[fortaleza]}
                {!cumpleMinimos &&
                  ' — mínimo 8 caracteres, una mayúscula y un número'}
              </p>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmarPassword"
            className="block text-sm font-medium text-primary-900"
          >
            Confirmar contraseña
          </label>
          <div className="relative mt-1">
            <input
              id="confirmarPassword"
              type={mostrarConfirmar ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-primary-200 px-4 py-2.5 pr-11 text-primary-900 placeholder-primary-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
            <button
              type="button"
              aria-label={mostrarConfirmar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setMostrarConfirmar((p) => !p)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-primary-400 transition-colors hover:text-primary-700"
            >
              {mostrarConfirmar ? <OjoCerradoIcon /> : <OjoAbiertoIcon />}
            </button>
          </div>
          {noCoinciden && (
            <p className="mt-1 text-xs text-red-600">
              Las contraseñas no coinciden
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!puedeEnviar}
          className="w-full rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
        </button>
      </form>

      <Link
        to="/login"
        className="mt-5 block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        ← Volver al inicio de sesión
      </Link>
    </AuthLayout>
  )
}

export default RestablecerPassword