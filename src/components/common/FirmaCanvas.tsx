import { useRef, useState, type PointerEvent } from 'react'

// Lienzo de firma digital: el solicitante dibuja con mouse/dedo y al enviar
// se exporta como PNG (Blob) para adjuntarlo igual que cualquier otro
// documento. Se usa en la Solicitud de conexión de servicio (sección V del
// formulario GNU-42-01-F1: "Firma del solicitante").
export function FirmaCanvas({
  onChange,
}: {
  onChange: (archivo: File | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dibujando = useRef(false)
  const [tieneTrazo, setTieneTrazo] = useState(false)

  function contexto() {
    return canvasRef.current?.getContext('2d') ?? null
  }

  function posicion(e: PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function iniciar(e: PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const ctx = contexto()
    if (!ctx) return
    dibujando.current = true
    const { x, y } = posicion(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function dibujar(e: PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return
    const ctx = contexto()
    if (!ctx) return
    const { x, y } = posicion(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0F3D5C'
    ctx.lineTo(x, y)
    ctx.stroke()
    setTieneTrazo(true)
  }

  function terminar() {
    if (!dibujando.current) return
    dibujando.current = false
    exportar()
  }

  function exportar() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      onChange(new File([blob], 'firma.png', { type: 'image/png' }))
    }, 'image/png')
  }

  function limpiar() {
    const canvas = canvasRef.current
    const ctx = contexto()
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setTieneTrazo(false)
    onChange(null)
  }

  return (
    <div>
      <div className="rounded-lg border border-dashed border-primary-300 bg-primary-50/40">
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          className="h-40 w-full touch-none rounded-lg"
          onPointerDown={iniciar}
          onPointerMove={dibujar}
          onPointerUp={terminar}
          onPointerLeave={terminar}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-primary-400">
          {tieneTrazo ? 'Firma capturada.' : 'Dibuja tu firma con el mouse o el dedo.'}
        </p>
        <button
          type="button"
          onClick={limpiar}
          className="rounded-full border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50"
        >
          Limpiar
        </button>
      </div>
    </div>
  )
}
