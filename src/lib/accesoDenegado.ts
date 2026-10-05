// Contrato de las denegaciones de acceso (PBI pantalla de Acceso denegado).
//
// El backend responde 403 con codigo SIN_PERMISO desde tres sitios distintos:
//   1. RolesGuard  -> el usuario autenticado no tiene permiso para el recurso.
//   2. RecaptchaGuard -> fallo de la verificacion "no soy un robot" (formularios
//      publicos).
//   3. Reglas de negocio (ej. cambio-propietario intentando suplantar).
//
// Solo el caso 1 debe abrir la pantalla de "Acceso denegado"; los demas son
// errores que la pagina que los disparo tiene que mostrar en linea, sin
// sacar al usuario de donde esta. Para distinguirlos, RolesGuard agrega al
// cuerpo del error la marca `origen` (ORIGEN_AUTORIZACION); los otros 403 no
// la traen.

export const ORIGEN_AUTORIZACION = 'autorizacion'

// Evento de window que dispara apiClient cuando detecta un 403 de
// autorizacion. Se usa un evento en vez de un callback porque apiClient no es
// un componente React: el que navega es GestorAcceso.tsx, dentro del Router.
export const EVENTO_ACCESO_DENEGADO = 'siapb:acceso-denegado'

// true solo si el cuerpo del error trae la marca de autorizacion. Acepta
// `unknown` porque el cuerpo viene del interceptor de axios.
export function esDenegacionDeAutorizacion(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false
  return (data as { origen?: unknown }).origen === ORIGEN_AUTORIZACION
}

// Dispara el evento (lo llama apiClient).
export function notificarAccesoDenegado(): void {
  window.dispatchEvent(new Event(EVENTO_ACCESO_DENEGADO))
}

// Suscribe un oyente y devuelve la funcion de limpieza (mismo patron que
// alExpirarSesion en apiClient.ts).
export function alDenegarAcceso(oyente: () => void): () => void {
  window.addEventListener(EVENTO_ACCESO_DENEGADO, oyente)
  return () => {
    window.removeEventListener(EVENTO_ACCESO_DENEGADO, oyente)
  }
}
