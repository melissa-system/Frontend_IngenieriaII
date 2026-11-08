import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { alDenegarAcceso } from '../../lib/accesoDenegado'

// Puente entre apiClient y el Router: convierte el evento "acceso denegado"
// (que el interceptor dispara desde fuera de React) en una navegación real.
// No renderiza nada y debe vivir dentro del Router para poder usar useNavigate.
function GestorAcceso() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    return alDenegarAcceso(() => {
      // Ya estamos en la pantalla: no navegar de nuevo. Varios 403 del mismo
      // lote disparan el evento más de una vez.
      if (location.pathname === '/acceso-denegado') return
      navigate('/acceso-denegado', { replace: true })
    })
  }, [navigate, location])

  return null
}

export default GestorAcceso
