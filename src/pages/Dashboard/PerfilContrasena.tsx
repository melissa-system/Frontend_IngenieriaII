import { useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../lib/apiClient'

// Espejo client-side de las reglas de fortaleza que aplica el backend en
// CambiarPasswordDto (min 8 caracteres, mayuscula, numero).
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
  return 'No se pudo realizar la operación. Intenta nuevamente.'
}

// Cambio de contraseña, separado de "Editar perfil" (ver PerfilEditar.tsx)
// para que el menú del Sidebar pueda enlazar cada acción por separado.
function PerfilContrasena() {
  const { logout } = useAuth()

  const [passwordActual, setPasswordActual] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  function cancelar() {
    setPasswordActual('')
    setNuevaPassword('')
    setConfirmarPassword('')
    setError(null)
    setExito(false)
  }

  async function manejarSubmit(e: FormEvent) {
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
      setTimeout(logout, 1800)
    } catch (err) {
      setError(obtenerMensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">Cambio de contraseña</h1>
        <p className="mt-1 text-sm text-primary-500">
          Mínimo 8 caracteres, una letra mayúscula y un número.
        </p>
      </div>

      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        {exito && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Contraseña actualizada correctamente. Cierra sesión e inicia con tu
            nueva contraseña…
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={manejarSubmit} className="space-y-5">
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={enviando || exito}
              className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
            <button
              type="button"
              onClick={cancelar}
              disabled={enviando}
              className="rounded-full border border-primary-300 px-5 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PerfilContrasena
