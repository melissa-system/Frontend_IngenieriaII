import type { ReactNode } from 'react'
import Button from '../ui/Button'
import Icono from '../ui/Icono'
import Modal, { ModalTitulo } from '../ui/Modal'

// Modal de confirmación con código de seguimiento SOL-XXX-YYYY-XXXX. Es el
// mismo que usa "Cambio de Propietario", compartido para estandarizar el
// comportamiento de todas las solicitudes. Usa el <Modal> estándar (foco,
// teclado y lector de pantalla incluidos).
export default function ModalConfirmacion({
  codigo,
  onCerrar,
  titulo,
  descripcion,
}: {
  codigo: string
  onCerrar: () => void
  titulo: string
  descripcion: ReactNode
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

        <div className="mt-6">
          <Button className="w-full" onClick={onCerrar}>
            Entendido y continuar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
