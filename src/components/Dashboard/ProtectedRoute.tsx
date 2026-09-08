import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, status } = useAuth()
  const location = useLocation()

  // Mientras se intenta restaurar la sesión (recarga de página) no redirigir:
  // el Access Token vive en memoria y tarda un instante en recuperarse.
  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm font-medium text-primary-600">
          Restaurando sesión...
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
