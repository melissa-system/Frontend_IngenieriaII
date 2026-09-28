import Afiliacion from '../Afiliacion/Afiliacion'

// Permite a un Abonado ya registrado solicitar una paja de agua adicional a
// su propio nombre (por ejemplo, cuando tiene una segunda propiedad). Es
// exactamente el mismo wizard público de /afiliacion — mismos campos, mismo
// machote generado y misma aprobación por parte de la administración —
// solo que embebido en el dashboard (variante="dashboard") y sin la
// navegación al landing. El backend ya reutiliza el Abonado existente por
// cédula/correo al aprobar la solicitud (resolverAbonado), así que no hace
// falta ningún cambio en el flujo de aprobación.
function NuevaPajaAgua() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">Nueva paja de agua</h1>
        <p className="mt-1 text-sm text-primary-500">
          Usá este formulario si tenés una propiedad adicional y necesitás tramitar una nueva
          conexión de paja de agua a tu nombre. Es el mismo proceso que la solicitud pública de
          disponibilidad de servicio: la administración la revisará y seguirá el flujo normal de
          aprobación.
        </p>
      </div>

      <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm sm:p-8">
        <Afiliacion variante="dashboard" />
      </div>
    </div>
  )
}

export default NuevaPajaAgua
