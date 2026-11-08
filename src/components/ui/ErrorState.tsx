import Button from './Button'
import Icono from './Icono'

// Estado de error estándar: mensaje claro y, si se pasa onReintentar, botón
// "Reintentar" para volver a pedir los datos sin recargar la página.
function ErrorState({
  mensaje = 'No se pudo cargar la información.',
  onReintentar,
}: {
  mensaje?: string
  onReintentar?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-tarjeta border border-error-200 bg-error-50 px-6 py-12 text-center"
    >
      <Icono nombre="alerta" grosor={1.5} className="h-10 w-10 text-error-600" />
      <p className="mt-3 text-sm font-medium text-error-800">{mensaje}</p>
      {onReintentar && (
        <Button variant="danger" size="sm" className="mt-4" onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  )
}

export default ErrorState
