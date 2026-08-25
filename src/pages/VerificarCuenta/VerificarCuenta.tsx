import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import apiClient from '../../lib/apiClient'
import logo from '../../assets/logo.png'

type Estado = 'verificando' | 'exito' | 'error'

const SEGUNDOS_REDIRECCION = 5
const MENSAJE_ERROR_DEFECTO = 'El enlace de activación es inválido o ha expirado.'

function VerificarCuenta() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [estado, setEstado] = useState<Estado>('verificando')
  const [mensajeError, setMensajeError] = useState('')
  const [segundosRestantes, setSegundosRestantes] = useState(
    SEGUNDOS_REDIRECCION,
  )

  // Llama a GET /auth/verify-email en cuanto se monta la vista: el enlace
  // del correo trae el token y este es el único momento en que se valida
  // (no hay una forma de "revisar" el token sin intentar usarlo).
  useEffect(() => {
    if (!token) {
      setEstado('error')
      setMensajeError('El enlace de activación no incluye un token válido.')
      return
    }

    let cancelado = false
    apiClient
      .get('/auth/verify-email', { params: { token } })
      .then(() => {
        if (!cancelado) setEstado('exito')
      })
      .catch((err) => {
        if (cancelado) return
        // El backend usa a propósito un mensaje genérico: no distingue si
        // el token ya se usó, expiró o nunca existió, para no dar pistas.
        // Se muestra tal cual llega, con un texto de respaldo si no viene.
        const msg = axios.isAxiosError(err)
          ? err.response?.data?.message
          : undefined
        setMensajeError(typeof msg === 'string' ? msg : MENSAJE_ERROR_DEFECTO)
        setEstado('error')
      })

    return () => {
      cancelado = true
    }
  }, [token])

  // Redirección automática al login tras el éxito (opcional, con cuenta
  // regresiva visible para que no se sienta abrupta).
  useEffect(() => {
    if (estado !== 'exito') return
    if (segundosRestantes === 0) {
      navigate('/login', {
        state: { mensajeExito: 'Cuenta activada. Ya puedes iniciar sesión.' },
      })
      return
    }
    const t = setTimeout(() => setSegundosRestantes((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [estado, segundosRestantes, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
        <img
          src={logo}
          alt="ASADA Pueblo Nuevo"
          className="mx-auto h-16 w-auto object-contain sm:h-20"
        />

        {estado === 'verificando' && (
          <>
            <h1 className="mt-4 text-lg font-semibold text-primary-900">
              Activando tu cuenta...
            </h1>
            <p className="mt-3 text-sm text-primary-700">
              Espera un momento mientras verificamos tu enlace.
            </p>
          </>
        )}

        {estado === 'exito' && (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-700 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="h-8 w-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </span>
            <h1 className="mt-4 text-lg font-semibold text-primary-900">
              ¡Cuenta activada exitosamente!
            </h1>
            <p className="mt-3 text-sm text-primary-700">
              Ya puedes iniciar sesión con tu correo y contraseña.
            </p>
            <p className="mt-1 text-xs text-primary-500">
              Te llevaremos al login en {segundosRestantes}s...
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Ir a iniciar sesión
            </Link>
          </>
        )}

        {estado === 'error' && (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="h-8 w-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </span>
            <h1 className="mt-4 text-lg font-semibold text-primary-900">
              No se pudo activar tu cuenta
            </h1>
            <p className="mt-3 text-sm text-red-600">{mensajeError}</p>
            <p className="mt-3 text-xs text-primary-500">
              Si el enlace ya venció o ya lo usaste antes, contacta a la
              ASADA para que te reenvíen el correo de activación.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Ir al inicio de sesión
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default VerificarCuenta