function SolicitudesPajaAgua() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Paja de Agua
        </h1>
        <p className="mt-1 text-sm text-primary-500">
          Solicitudes de paja de agua registradas
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 bg-white py-16 text-center shadow-sm">
        <p className="text-lg font-medium text-primary-700">
          No hay solicitudes registradas de este tipo.
        </p>
        <p className="mt-1 text-sm text-primary-400">
          Las solicitudes de paja de agua aparecerán aquí.
        </p>
      </div>
    </div>
  )
}

export default SolicitudesPajaAgua