import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  passwordCumpleMinimos,
  calcularFortaleza,
  confirmarResetPassword,
} from '../../lib/passwordReset.service'
import logo from '../../assets/logo.png'

// Mismos íconos de ojo que Login.tsx. Se duplican aquí porque no existe
// todavía una carpeta de componentes compartidos para el flujo de auth; si
// un tercer formulario los vuelve a necesitar, conviene moverlos a
// components/auth/.
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
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
          <img
            src={logo}
            alt="ASADA Pueblo Nuevo"
            className="mx-auto h-16 w-auto object-contain sm:h-20"
          />
          <h1 className="mt-4 text-lg font-semibold text-primary-900">
            Enlace inválido
          </h1>
          <p className="mt-3 text-sm text-primary-700">
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
      </div>
    )
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
          <h1 className="mt-4 text-xl font-semibold text-primary-900">
            Crea tu nueva contraseña
          </h1>
        </div>

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
      </div>
    </div>
  )
}

export default RestablecerPassword