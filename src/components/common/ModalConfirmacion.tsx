import type { ReactNode } from 'react'

// Modal de confirmación con código de seguimiento SOL-XXX-YYYY-XXXX. Es el
// mismo que usa "Cambio de Propietario", compartido para estandarizar el
// comportamiento de todas las solicitudes.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h3 className="mt-4 text-xl font-bold text-primary-900">{titulo}</h3>
        <p className="mt-2 text-sm text-primary-600">{descripcion}</p>

        <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50/60 p-3">
          <span className="text-xs text-primary-500 uppercase tracking-wider font-semibold">
            Número de seguimiento
          </span>
          <p className="mt-1 font-mono text-lg font-bold text-primary-800">
            {codigo}
          </p>
        </div>

        <p className="mt-3 text-xs text-primary-400">
          Guardá este código para consultar el estado de tu trámite en ventanilla o desde tu panel.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={onCerrar}
            className="w-full rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800"
          >
            Entendido y continuar
          </button>
        </div>
      </div>
    </div>
  )
}