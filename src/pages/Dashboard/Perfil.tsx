import { useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../lib/apiClient'

// Espejo client-side de las reglas de fortaleza que aplica el backend en
// CambiarPasswordDto (min 8 caracteres, mayuscula, numero). Evita un viaje
// innecesario al servidor pero el backend sigue siendo la fuente de verdad.
function validarFortaleza(pw: string): string | null {
  if (pw.length < 8) {
    return 'La nueva contraseña debe tener al menos 8 caracteres'
  }
  if (!/[A-Z]/.test(pw)) {
    return 'La nueva contraseña debe incluir al menos una letra mayúscula'
  }
  if (!/[0-9]/.test(pw)) {
    return 'La nueva contraseña debe incluir al menos un número'
  }
  return null
}

function obtenerMensajeError(err: unknown): string {
  const data = (err as { response?: { data?: { message?: unknown } } })?.response
    ?.data?.message
  if (Array.isArray(data)) return data.join(' · ')
  if (typeof data === 'string') return data
  return 'No se pudo cambiar la contraseña. Intenta nuevamente.'
}

function Perfil() {
  const { user, logout } = useAuth()

  // Estado del formulario "Cambiar contraseña".
  const [passwordActual, setPasswordActual] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  if (!user) return null

  async function manejarCambio(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setExito(false)

    const falloFortaleza = validarFortaleza(nuevaPassword)
    if (falloFortaleza) {
      setError(falloFortaleza)
      return
    }
    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    if (nuevaPassword === passwordActual) {
      setError('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setEnviando(true)
    try {
      await apiClient.post('/auth/cambiar-password', {
        passwordActual,
        nuevaPassword,
      })
      setExito(true)
      setPasswordActual('')
      setNuevaPassword('')
      setConfirmarPassword('')
      // El backend revocó todas las sesiones del usuario: cerramos la local y
      // ProtectedRoute redirige al login para iniciar sesión con la nueva.
      setTimeout(logout, 1800)
    } catch (err) {
      setError(obtenerMensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">Mi Perfil</h1>
        <p className="mt-1 text-sm text-primary-500">
          Información de tu cuenta en SIAPB
        </p>
      </div>

      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-700 text-xl font-bold text-white">
            {user.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-primary-900">
              {user.nombre}
            </h2>
            <p className="text-sm text-primary-500">{user.rol}</p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Nombre completo
            </label>
            <input
              type="text"
              defaultValue={user.nombre}
              className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Nombre de usuario
            </label>
            <input
              type="text"
              defaultValue={user.username}
              readOnly
              className="mt-1 w-full rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm text-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Correo electrónico
            </label>
            <input
              type="email"
              defaultValue={user.email}
              className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Rol
            </label>
            <input
              type="text"
              defaultValue={user.rol}
              readOnly
              className="mt-1 w-full rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm text-primary-500"
            />
          </div>
          <button
            type="button"
            title="Disponible próximamente"
            className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
          >
            Actualizar perfil
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900">
          Cambiar contraseña
        </h2>
        <p className="mt-1 text-sm text-primary-500">
          Mínimo 8 caracteres, una letra mayúscula y un número.
        </p>

        {exito && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Contraseña actualizada correctamente. Cierra sesión e inicia con tu
            nueva contraseña…
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={manejarCambio} className="mt-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Contraseña actual
            </label>
            <input
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={enviando || exito}
            className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Perfil
