import Alerta from '../../components/ui/Alerta'
import { useState, type FormEvent } from 'react'
import { obtenerMensajeError as mensajeDeError } from '../../components/Services/erroresApi'
import { esCorreo } from '../../lib/validaciones'
import { Link } from 'react-router-dom'
import { solicitarResetPassword } from '../../lib/passwordReset.service'
import AuthLayout from '../../components/auth/AuthLayout'
import Button from '../../components/ui/Button'


// Lector único de errores de la API (PBI 511 / Task 516).
function obtenerMensajeError(error: unknown): string {
  return mensajeDeError(error, 'Ocurrió un error. Intenta de nuevo.')
}

function RecuperarPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const emailValido = esCorreo(email)
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
    <AuthLayout
      title="Recuperar contraseña"
      subtitle={
        !enviado &&
        'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.'
      }
    >
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
            <Alerta tipo="error">
              {error}
            </Alerta>
          )}

          <Button
            variant="primary"
            type="submit"
            disabled={!puedeEnviar}
            className="w-full">
            {loading ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
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
    </AuthLayout>
  )
}

export default RecuperarPassword