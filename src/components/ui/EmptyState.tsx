// Estado vacío estándar de listas y tablas.
function EmptyState({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 bg-white py-16 text-center shadow-sm">
      <p className="text-lg font-medium text-primary-700">{titulo}</p>
      {descripcion && <p className="mt-1 text-sm text-primary-400">{descripcion}</p>}
    </div>
  )
}

export default EmptyState
