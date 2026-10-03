// Mensaje de error que va justo debajo de su campo (PBI 511). Mismo estilo
// que ya usaban Empleados, Contacto y Horario de la ASADA.
function CampoError({ mensaje, id }: { mensaje?: string | null; id?: string }) {
  if (!mensaje) return null
  return (
    <p id={id} role="alert" data-campo-error className="mt-1 text-xs text-red-600">
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

// Lleva la pantalla al primer campo con error y le pone el cursor, para que
// el usuario vea de inmediato qué debe corregir (los errores se muestran
// debajo de cada campo, no en un mensaje arriba del formulario). Se llama
// después de guardar los errores en el estado; espera al siguiente render.
export function enfocarPrimerError(): void {
  window.setTimeout(() => {
    const error = document.querySelector<HTMLElement>('[data-campo-error]')
    if (!error) return
    let bloque: HTMLElement | null = error.parentElement
    let campo: HTMLElement | null = null
    // Busca el input del mismo bloque (o del bloque padre, si el error quedó
    // fuera del contenedor del input).
    for (let i = 0; i < 3 && bloque && !campo; i++) {
      campo = bloque.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
      )
      bloque = bloque.parentElement
    }
    ;(campo ?? error).scrollIntoView({ behavior: 'smooth', block: 'center' })
    campo?.focus({ preventScroll: true })
  }, 0)
}

export default CampoError
