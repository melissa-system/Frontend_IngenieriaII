import type { ReactNode } from 'react'
import Button from '../ui/Button'
import Icono from '../ui/Icono'
import Modal, { ModalTitulo } from '../ui/Modal'

// Modal de confirmación con código de seguimiento SOL-XXX-YYYY-XXXX.
// Compartido para estandarizar el comportamiento de todas las solicitudes.
// Soporta opcionalmente la descarga directa de la copia de respaldo en PDF.
export default function ModalConfirmacion({
  codigo,
  onCerrar,
  titulo,
  descripcion,
  onDescargarCopia,
  descargandoCopia = false,
}: {
  codigo: string
  onCerrar: () => void
  titulo: string
  descripcion: ReactNode
  onDescargarCopia?: () => void
  descargandoCopia?: boolean
}) {
  return (
    <Modal size="md" scroll={false} onCerrar={onCerrar}>
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-exito-100 text-exito-700">
          <Icono nombre="check" className="h-8 w-8" />
        </div>

        <div className="mt-4 [&>h2]:text-xl [&>h2]:font-bold">
          <ModalTitulo>{titulo}</ModalTitulo>
        </div>
        <p className="mt-2 text-sm text-primary-600">{descripcion}</p>

        <div className="mt-4 rounded-tarjeta border border-primary-200 bg-primary-50/60 p-3">
          <span className="text-xs font-semibold tracking-wider text-primary-500 uppercase">
            Número de seguimiento
          </span>
          <p className="mt-1 font-mono text-lg font-bold text-primary-800">{codigo}</p>
        </div>

        <p className="mt-3 text-xs text-primary-500">
          Guardá este código para consultar el estado de tu trámite en ventanilla o desde tu panel.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          {onDescargarCopia && (
            <Button
              variant="secondary"
              className="w-full"
              type="button"
              onClick={onDescargarCopia}
              disabled={descargandoCopia}
            >
              {descargandoCopia ? 'Generando copia...' : 'Descargar copia (PDF)'}
            </Button>
          )}
          <Button className="w-full" type="button" onClick={onCerrar}>
            Entendido y continuar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
