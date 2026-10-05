import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'

// Pantalla de "Acceso denegado" (fuera de /dashboard, sin sidebar): la ve el
// usuario cuando entra por URL a un módulo que su rol no cubre (RoleRoute) o
// cuando el backend responde un 403 de autorización. Sigue la misma
// convención que el 404 inline de AppRoutes.tsx: fondo primary-50, numeral
// grande y una sola acción.
function AccesoDenegado() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-50 px-6">
      <div className="text-center">
        {/* Decorativo: el significado lo carga el h1, no el código. */}
        <p aria-hidden="true" className="text-6xl font-bold text-primary-700">
          403
        </p>
        <h1 className="mt-4 text-titulo-pagina font-semibold text-primary-800">
          Acceso denegado
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-primary-600">
          Tu cuenta no tiene permiso para entrar a esta sección. Vuelve al
          inicio del panel para continuar con lo que sí puedes ver.
        </p>
        <Button className="mt-7" onClick={() => navigate('/dashboard')}>
          Volver al inicio
        </Button>
      </div>
    </main>
  )
}

export default AccesoDenegado
