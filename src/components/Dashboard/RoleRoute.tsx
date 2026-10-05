import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Restringe una ruta por rol o roles efectivos (etiquetas en español, ej.
// 'Junta Directiva'). Junto con el filtrado del menú, evita que un usuario
// entre por URL a una sección que no le corresponde: cualquiera que no tenga
// el rol pedido va a la pantalla de "Acceso denegado" (fuera de /dashboard,
// sin sidebar) en vez de al inicio, para que la denegación sea visible.
//
// IMPORTANTE: a propósito no se manda nada en `state.from`. ProtectedRoute
// sí lo pone al entrar a /dashboard; si RoleRoute lo heredara, tras un login
// volveríamos a la misma sección rechazada y entraríamos en bucle.
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
    return <Navigate to="/acceso-denegado" replace />
  }

  return <>{children}</>
}

export default RoleRoute
