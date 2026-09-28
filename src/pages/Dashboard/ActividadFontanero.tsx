import { useAuth } from '../../contexts/AuthContext'
import ReporteActividad from './ReporteActividad'
import ReportesFontanero from './ReportesFontanero'

/**
 * Ruta /dashboard/averias/fontanero.
 *
 * Una sola entrada de menú que muestra una pantalla distinta según quién
 * entra, porque la misma información sirve para dos cosas:
 *  - Fontanero: el formulario para registrar SU actividad y ver su historial.
 *  - Administración y Junta Directiva: el listado de los reportes de TODOS
 *    los fontaneros, con filtros.
 *
 * Se resuelve acá y no con dos entradas de menú para que el fontanero no vea
 * una opción que el backend le va a rechazar con 403 de todas formas
 * (GET /reportes-fontanero está restringido a administración).
 */
function ActividadFontanero() {
  const { rolEfectivo } = useAuth()

  if (rolEfectivo === 'Fontanero') {
    return <ReporteActividad />
  }

  return <ReportesFontanero />
}

export default ActividadFontanero
