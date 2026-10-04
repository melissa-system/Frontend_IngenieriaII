import Button from './Button'

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
      className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-red-500" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <p className="mt-3 text-sm font-medium text-red-800">{mensaje}</p>
      {onReintentar && (
        <Button variant="danger" size="sm" className="mt-4" onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  )
}

export default ErrorState
