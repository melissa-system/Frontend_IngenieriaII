// Mensaje de error que va justo debajo de su campo (PBI 511). Mismo estilo
// que ya usaban Empleados, Contacto y Horario de la ASADA.
function CampoError({ mensaje, id }: { mensaje?: string | null; id?: string }) {
  if (!mensaje) return null
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600">
      {mensaje}
    </p>
  )
}

// Asterisco rojo para marcar los campos obligatorios en su etiqueta.
export function Obligatorio() {
  return (
    <span className="text-red-500" aria-hidden="true">
      {' '}
      *
    </span>
  )
}

// Clases de borde del input: rojo si el campo tiene error, el azul habitual
// si no. Reemplaza al 'border-primary-200 ... focus:border-primary-500'.
export function bordeCampo(error?: string | null): string {
  return error
    ? 'border-red-300 focus:border-red-500'
    : 'border-primary-200 focus:border-primary-500'
}

export default CampoError
