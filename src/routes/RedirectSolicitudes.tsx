import { Navigate } from 'react-router-dom'

// La raíz del menú de Solicitudes no es una página propia: al entrar se
// reenvía a la primera solicitud (paja de agua). Cada tipo tiene su página.
function RedirectSolicitudes() {
  return <Navigate to="/dashboard/solicitudes/paja-de-agua" replace />
}

export default RedirectSolicitudes