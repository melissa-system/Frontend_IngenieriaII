import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Redirige la entrada "solicitudes" según el rol: un abonado va directo a
// "Cambio de Domicilio" (la subsección donde puede generar su solicitud);
// los demás roles a "Paja de Agua".
function RedirectSolicitudes() {
  const { rolEfectivo } = useAuth()

  if (rolEfectivo === 'Abonado') {
    return <Navigate to="/dashboard/solicitudes/cambio-domicilio" replace />
  }

  return <Navigate to="/dashboard/solicitudes/paja-de-agua" replace />
}

export default RedirectSolicitudes
