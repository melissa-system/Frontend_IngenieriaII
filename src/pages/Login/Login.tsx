import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import logo from '../../assets/logo.png'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const ok = login(username, password)
      if (ok) {
        navigate(from, { replace: true })
      } else {
        setError('Usuario o contraseña incorrectos.')
        setLoading(false)
      }
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <div className="mb-6 text-center">
          <img src={logo} alt="ASADA Pueblo Nuevo" className="mx-auto h-14 w-auto object-contain" />
          <h1 className="mt-4 font-heading text-2xl font-semibold text-primary-900">
            SIAPB
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            Sistema de Información de Abonados Pueblo Nuevo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-primary-900"
            >
              Usuario
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
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
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
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
            disabled={loading}
            className="w-full rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
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
