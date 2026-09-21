import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Restringe una ruta por rol efectivo (etiqueta en español, ej. 'Junta
// Directiva'). Junto con el filtrado del menú, evita que un usuario entre por
// URL a una sección que no le corresponde: cualquiera que no tenga el rol
// pedido es redirigido al inicio del panel.
function RoleRoute({
  role,
  children,
}: {
  role: string
  children: React.ReactNode
}) {
  const { rolEfectivo } = useAuth()

  if (rolEfectivo !== role) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default RoleRoute

