import { Spinner } from '../ui/Cargando'

/**
 * Componente de carga para transiciones de rutas diferidas (React.lazy / Suspense).
 * Mantiene la identidad visual con el tema institucional y evita saltos de layout.
 */
export default function RouteLoadingFallback({
  mensaje = 'Cargando sección...',
}: {
  mensaje?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[350px] w-full flex-col items-center justify-center gap-3 py-20 text-primary-700"
    >
      <Spinner className="h-8 w-8 text-primary-700" />
      <span className="text-sm font-medium text-primary-600 animate-pulse">
        {mensaje}
      </span>
    </div>
  )
}
