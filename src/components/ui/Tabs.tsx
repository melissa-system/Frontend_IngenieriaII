// Pestañas con subrayado (Lista / Crear, etc.). Ver diseños/formularios.md.
export interface PestanaItem<T extends string> {
  valor: T
  etiqueta: string
}

function Tabs<T extends string>({
  pestanas,
  activa,
  onCambiar,
}: {
  pestanas: PestanaItem<T>[]
  activa: T
  onCambiar: (valor: T) => void
}) {
  return (
    <div className="flex gap-6 border-b border-primary-100">
      {pestanas.map((p) => (
        <button
          key={p.valor}
          type="button"
          onClick={() => onCambiar(p.valor)}
          className={`border-b-2 pb-2 text-sm font-semibold transition-colors ${
            activa === p.valor
              ? 'border-primary-700 text-primary-900'
              : 'border-transparent text-primary-400 hover:text-primary-700'
          }`}
        >
          {p.etiqueta}
        </button>
      ))}
    </div>
  )
}

export default Tabs
