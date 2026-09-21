import { useEffect, useRef } from 'react'

export type TipoToast = 'exito' | 'error'

// Notificación flotante que aparece sobre la pantalla, en la esquina inferior
// derecha.
//
// Se usa para el resultado de gestionar una solicitud desde el modal: al
// cerrarlo, la persona suele estar viendo la lista más abajo, así que un
// banner arriba de la página quedaba fuera de pantalla y parecía que no había
// pasado nada.
//
// Se cierra solo a los 5 segundos, o antes con la X. Los mensajes de error no
// se cierran solos: si algo falló, la persona debe leerlo antes de seguir.
function Toast({
  mensaje,
  tipo,
  onCerrar,
}: {
  mensaje: string
  tipo: TipoToast
  onCerrar: () => void
}) {
  // onCerrar se guarda en una ref para que el temporizador NO se reinicie en
  // cada render del padre. Si estuviera en las dependencias del useEffect, un
  // `onCerrar={() => setToast(null)}` crea una función nueva en cada render y
  // cualquier cosa que re-renderice la página (escribir en un campo, cargar la
  // lista) reiniciaría los 5 segundos: el toast podría no cerrarse nunca.
  const onCerrarRef = useRef(onCerrar)
  onCerrarRef.current = onCerrar

  useEffect(() => {
    if (tipo === 'error') return
    const t = setTimeout(() => onCerrarRef.current(), 5000)
    return () => clearTimeout(t)
  }, [tipo, mensaje])

  const estilos =
    tipo === 'exito'
      ? 'border-green-300 bg-green-50 text-green-800'
      : 'border-red-300 bg-red-50 text-red-700'

  return (
    <div
      // role alert hace que los lectores de pantalla lo anuncien apenas
      // aparece, sin que la persona tenga que ir a buscarlo.
      role="alert"
      className={`fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg ${estilos}`}
    >
      <span className="flex-none pt-0.5">
        {tipo === 'exito' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        )}
      </span>

      <p className="flex-1 text-sm font-medium">{mensaje}</p>

      <button
        type="button"
        onClick={() => onCerrarRef.current()}
        aria-label="Cerrar notificación"
        className="flex-none rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default Toast