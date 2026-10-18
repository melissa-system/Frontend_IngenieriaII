import { useState, type FormEvent } from 'react'
import Alerta from '../ui/Alerta'
import Button from '../ui/Button'
import { Textarea } from '../ui/campos'
import Modal, { ModalAcciones, ModalTitulo } from '../ui/Modal'

// Mínimo de caracteres del motivo. Debe coincidir con MIN_MOTIVO_RECHAZO del
// backend (actualizar-estado-solicitud.dto.ts).
export const MIN_MOTIVO = 10

export type AccionGestion = 'aprobar' | 'rechazar'

// Modal de confirmación al aprobar o rechazar una solicitud (vistas de
// gestión del administrador). Nada cambia de estado hasta que se confirma
// aquí. Al rechazar pide un motivo (obligatorio, mínimo MIN_MOTIVO
// caracteres) que se envía al backend y le llega al solicitante por correo;
// en ambos casos avisa que el solicitante será notificado por correo.
function ModalGestionEstado({
  accion,
  codigo,
  motivo,
  onMotivoChange,
  motivoObligatorio = accion === 'rechazar',
  mostrarMotivo = accion === 'rechazar',
  etiquetaMotivo,
  ayudaMotivo,
  aviso,
  cargando = false,
  onConfirmar,
  onCancelar,
}: {
  accion: AccionGestion
  codigo: string
  motivo: string
  onMotivoChange: (valor: string) => void
  /** Rechazar: obligatorio. Aprobar: solo si el trámite lo exige (ej. "Otro"). */
  motivoObligatorio?: boolean
  /** Muestra el campo de texto (por defecto solo al rechazar). */
  mostrarMotivo?: boolean
  etiquetaMotivo?: string
  ayudaMotivo?: string
  /** Texto de la notificación; por defecto un aviso genérico de correo. */
  aviso?: string
  cargando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  const [intento, setIntento] = useState(false)
  const largo = motivo.trim().length
  const invalido = motivoObligatorio && largo < MIN_MOTIVO
  const esRechazo = accion === 'rechazar'

  const error = intento && invalido
    ? largo === 0
      ? 'Debes indicar el motivo.'
      : `Escribí al menos ${MIN_MOTIVO} caracteres (llevás ${largo}).`
    : null

  function enviar(e: FormEvent) {
    e.preventDefault()
    setIntento(true)
    if (invalido) return
    onConfirmar()
  }

  return (
    <Modal size="lg" layer={60} scroll onCerrar={cargando ? undefined : onCancelar}>
      <form onSubmit={enviar} noValidate className="space-y-4">
        <ModalTitulo>
          {esRechazo ? 'Rechazar' : 'Aprobar'} solicitud {codigo}
        </ModalTitulo>

        <p className="text-sm text-primary-700">
          {esRechazo
            ? '¿Seguro que querés rechazar esta solicitud? Una vez rechazada no se puede volver a gestionar.'
            : '¿Seguro que querés aprobar esta solicitud? Se aplicarán los cambios correspondientes y no se podrá deshacer.'}
        </p>

        {mostrarMotivo && (
          <Textarea
            label={etiquetaMotivo ?? (esRechazo ? 'Motivo del rechazo' : 'Comentario de la resolución')}
            obligatorio={motivoObligatorio}
            rows={4}
            value={motivo}
            onChange={(e) => onMotivoChange(e.target.value)}
            placeholder={esRechazo ? 'Ej: Documentación incompleta o ilegible…' : 'Ej: Se gestionó y entregó la constancia solicitada'}
            error={error}
            ayuda={ayudaMotivo ?? `Mínimo ${MIN_MOTIVO} caracteres. Es el texto que recibirá el solicitante.`}
            disabled={cargando}
          />
        )}

        <Alerta tipo="info">
          {aviso ??
            (esRechazo
              ? 'Al confirmar, el solicitante recibirá un correo con el resultado y el motivo del rechazo.'
              : 'Al confirmar, el solicitante recibirá un correo con el resultado de su solicitud.')}
        </Alerta>

        <ModalAcciones>
          <Button type="submit" variant={esRechazo ? 'danger' : 'success'} loading={cargando}>
            {esRechazo ? 'Confirmar rechazo' : 'Confirmar aprobación'}
          </Button>
          <Button variant="secondary" disabled={cargando} onClick={onCancelar}>
            Cancelar
          </Button>
        </ModalAcciones>
      </form>
    </Modal>
  )
}

export default ModalGestionEstado
