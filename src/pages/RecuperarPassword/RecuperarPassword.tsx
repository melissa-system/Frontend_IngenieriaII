import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { solicitarResetPassword } from '../../lib/passwordReset.service'
import logo from '../../assets/logo.png'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mismo helper que Login.tsx: traduce errores de red/validación del
// backend a un mensaje legible.
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

function RecuperarPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const emailValido = EMAIL_REGEX.test(email.trim())
  const puedeEnviar = emailValido && !loading

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!puedeEnviar) return
    setError('')
    setLoading(true)

    try {
      // El backend responde el mismo mensaje sin importar si el correo
      // existe o no en el sistema — es intencional, evita revelar qué
      // cuentas están registradas. La vista no distingue tampoco.
      await solicitarResetPassword(email.trim())
      setEnviado(true)
    } catch (err) {
      setError(obtenerMensajeError(err))
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
          <h1 className="mt-4 text-xl font-semibold text-primary-900">
            Recuperar contraseña
          </h1>
          {!enviado && (
            <p className="mt-2 text-sm text-primary-700">
              Ingresa tu correo y te enviaremos un enlace para restablecer
              tu contraseña.
            </p>
          )}
        </div>

        {enviado ? (
          <div className="rounded-2xl bg-primary-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-primary-900">
              Revisa tu correo
            </h2>
            <p className="mt-3 text-sm text-primary-700">
              Si <strong>{email.trim()}</strong> está registrado en el
              sistema, te enviamos un enlace para restablecer tu
              contraseña. El enlace tiene una vigencia limitada.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Volver al login
            </Link>
          </div>
        ) : (
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
              {loading ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </form>
        )}

        {!enviado && (
          <Link
            to="/login"
            className="mt-5 block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Volver al inicio de sesión
          </Link>
        )}
      </div>
    </div>
  )
}

export default RecuperarPassword