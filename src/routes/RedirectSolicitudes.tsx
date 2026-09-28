import { Navigate } from 'react-router-dom'

// Redirige la entrada "solicitudes" a la primera sección disponible ("Paja de Agua")
function RedirectSolicitudes() {
  return <Navigate to="/dashboard/solicitudes/paja-de-agua" replace />
}

export default RedirectSolicitudes
