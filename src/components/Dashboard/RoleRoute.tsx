import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Restringe una ruta por rol o roles efectivos (etiquetas en español, ej.
// 'Junta Directiva'). Junto con el filtrado del menú, evita que un usuario
// entre por URL a una sección que no le corresponde: cualquiera que no tenga
// el rol pedido es redirigido al inicio del panel.
function RoleRoute({
  role,
  children,
}: {
  role: string | string[]
  children: React.ReactNode
}) {
  const { rolEfectivo } = useAuth()

  const permitido = Array.isArray(role) ? role.includes(rolEfectivo ?? '') : rolEfectivo === role

  if (!permitido) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default RoleRoute
