import { useEffect, useRef } from 'react'
import Icono from './Icono'
import { estiloAlerta } from './Alerta'

export type TipoToast = 'exito' | 'error' | 'advertencia' | 'info'

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

  const { caja: estilos, icono } = estiloAlerta(tipo)

  return (
    <div
      // role alert hace que los lectores de pantalla lo anuncien apenas
      // aparece, sin que la persona tenga que ir a buscarlo.
      role={tipo === 'error' || tipo === 'advertencia' ? 'alert' : 'status'}
      className={`fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-3 rounded-tarjeta border p-4 shadow-flotante ${estilos}`}
    >
      <span className="flex-none pt-0.5">
        <Icono nombre={icono} />
      </span>

      <p className="flex-1 text-sm font-medium">{mensaje}</p>

      <button
        type="button"
        onClick={() => onCerrarRef.current()}
        aria-label="Cerrar notificación"
        className="flex-none rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <Icono nombre="cerrar" className="h-4 w-4" />
      </button>
    </div>
  )
}

export default Toast