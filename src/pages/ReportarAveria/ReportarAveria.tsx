import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { crearAveria } from '../../components/Services/averias.service'
import { useCedulaLookup } from '../../hooks/useCedulaLookup'

const TIPOS_AVERIA = [
  'Fuga de agua',
  'Tubería rota',
  'Falta de presión / sin agua',
  'Contador dañado',
  'Fuga en la vía pública',
  'Otro',
]

type TipoIdentificacion = 'nacional' | 'extranjero' | ''

function ReportarAveria() {
  const [tipoId, setTipoId] = useState<TipoIdentificacion>('')

  // Flujo nacional / DIMEX (hook compartido con Solicitud de paja de agua)
  const {
    cedula,
    setCedula,
    lookupStatus,
    setLookupStatus,
    datosListos: datosListosNacional,
    nombreEncontrado,
    buscarCedula,
  } = useCedulaLookup()
  const [manualNombre, setManualNombre] = useState('')

  // Flujo extranjero
  const [pasaporte, setPasaporte] = useState('')
  const [nombreExtranjero, setNombreExtranjero] = useState('')

  const [tipoAveria, setTipoAveria] = useState('')
  const [otroDescripcion, setOtroDescripcion] = useState('')
  const [detalle, setDetalle] = useState('')
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [sinFoto, setSinFoto] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Estados para controlar el envío al backend
  const [submitting, setSubmitting] = useState(false)
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null)

  const datosListos =
    tipoId === 'nacional'
      ? datosListosNacional
      : tipoId === 'extranjero'
        ? pasaporte.trim() !== '' && nombreExtranjero.trim() !== ''
        : false

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setImagenPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleSinFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setSinFoto(checked)
    if (checked) {
      setImagenPreview(null)
    }
  }

  const nombreFinal =
    tipoId === 'nacional'
      ? nombreEncontrado || manualNombre
      : nombreExtranjero

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorSubmit(null)

    // Concatenamos para enviar los campos que el backend en NestJS espera (tipo_averia y descripcion)
    const tipoFinal = tipoAveria === 'Otro' ? otroDescripcion : tipoAveria
    const identificacionReportante =
      tipoId === 'nacional' ? cedula : `Pasaporte ${pasaporte}`
    const descripcionFinal = `Reportado por: ${nombreFinal} (${identificacionReportante}). Detalle: ${detalle}`

    try {
      await crearAveria({
        tipo_averia: tipoFinal,
        descripcion: descripcionFinal,
        cedula_reportante: identificacionReportante,
        nombre_reportante: nombreFinal,
      })
      setSubmitted(true)
    } catch (error) {
      console.error('Error al enviar la avería:', error)
      setErrorSubmit(
        'No se pudo guardar el reporte en la base de datos. Inténtalo de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <Link
        to="/"
        className="text-sm font-medium text-primary-700 hover:underline"
      >
        ← Volver al inicio
      </Link>

      <h1 className="mt-4 text-center text-3xl font-black tracking-tight text-primary-900 uppercase sm:text-4xl">
        Reportar avería
      </h1>
      <p className="mt-3 text-center text-primary-700">
        Primero verificamos tu identidad con tu número de cédula, luego nos
        cuentas qué está pasando.
      </p>

      {submitted ? (
        <div className="mt-10 rounded-2xl bg-primary-50 p-8 text-center">
          <h2 className="font-heading text-xl font-semibold text-primary-900">
            ¡Reporte enviado!
          </h2>
          <p className="mt-3 text-primary-700">
            Gracias, {nombreFinal || 'vecino/a'}. Recibimos tu reporte de
            avería y lo atenderemos lo antes posible.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800"
          >
            Volver al inicio
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-8">
          {/* Paso 0: tipo de identificación */}
          <div>
            <label
              htmlFor="tipoId"
              className="block text-sm font-medium text-primary-900"
            >
              Tipo de identificación
            </label>
            <select
              id="tipoId"
              required
              value={tipoId}
              onChange={(e) => {
                const value = e.target.value as TipoIdentificacion
                setTipoId(value)
                // Reiniciamos los flujos al cambiar de tipo de identificación
                setCedula('')
                setLookupStatus('idle')
                setManualNombre('')
                setPasaporte('')
                setNombreExtranjero('')
              }}
              className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              <option value="nacional">Cédula nacional / DIMEX</option>
              <option value="extranjero">Extranjero (pasaporte)</option>
            </select>
          </div>

          {/* Paso 1a: cédula (nacional/DIMEX) */}
          {tipoId === 'nacional' && (
            <form onSubmit={buscarCedula} className="space-y-4">
              <div>
                <label
                  htmlFor="cedula"
                  className="block text-sm font-medium text-primary-900"
                >
                  Número de cédula
                </label>
                <div className="mt-1 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="cedula"
                    type="text"
                    required
                    value={cedula}
                    disabled={datosListos}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="Ej. 1-2345-6789"
                    className="flex-1 rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none disabled:bg-primary-50"
                  />
                  {!datosListos && (
                    <button
                      type="submit"
                      disabled={lookupStatus === 'loading'}
                      className="flex-none rounded-full bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
                    >
                      {lookupStatus === 'loading' ? 'Buscando...' : 'Buscar'}
                    </button>
                  )}
                </div>
              </div>

              {lookupStatus === 'found' && (
                <p className="rounded-lg bg-primary-50 px-4 py-3 text-primary-800">
                  Nombre:{' '}
                  <span className="font-semibold">{nombreEncontrado}</span>
                </p>
              )}

              {lookupStatus === 'not-found' && (
                <div className="space-y-2">
                  <p className="text-sm text-primary-600">
                    No encontramos datos para esa cédula. Verifica el número
                    o ingresa tu nombre manualmente para continuar.
                  </p>
                  <input
                    type="text"
                    required
                    value={manualNombre}
                    onChange={(e) => setManualNombre(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              )}

              {lookupStatus === 'error' && (
                <div className="space-y-2">
                  <p className="text-sm text-primary-600">
                    No pudimos verificar tu cédula automáticamente. Puedes
                    continuar ingresando tu nombre manualmente.
                  </p>
                  <input
                    type="text"
                    required
                    value={manualNombre}
                    onChange={(e) => setManualNombre(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setLookupStatus('not-found')}
                    className="text-sm font-medium text-primary-700 hover:underline"
                  >
                    Continuar con este nombre →
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Paso 1b: pasaporte (extranjero) */}
          {tipoId === 'extranjero' && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="pasaporte"
                  className="block text-sm font-medium text-primary-900"
                >
                  Número de pasaporte / identificación
                </label>
                <input
                  id="pasaporte"
                  type="text"
                  required
                  value={pasaporte}
                  onChange={(e) => setPasaporte(e.target.value)}
                  placeholder="Número de pasaporte"
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="nombreExtranjero"
                  className="block text-sm font-medium text-primary-900"
                >
                  Nombre completo
                </label>
                <input
                  id="nombreExtranjero"
                  type="text"
                  required
                  value={nombreExtranjero}
                  onChange={(e) => setNombreExtranjero(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Paso 2: detalles de la avería */}
          {datosListos && (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 border-t border-primary-100 pt-8"
            >
              <div>
                <label
                  htmlFor="tipoAveria"
                  className="block text-sm font-medium text-primary-900"
                >
                  Tipo de avería
                </label>
                <select
                  id="tipoAveria"
                  required
                  value={tipoAveria}
                  onChange={(e) => setTipoAveria(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Selecciona una opción
                  </option>
                  {TIPOS_AVERIA.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              {tipoAveria === 'Otro' && (
                <div>
                  <label
                    htmlFor="otroDescripcion"
                    className="block text-sm font-medium text-primary-900"
                  >
                    Especifica el tipo de avería
                  </label>
                  <input
                    id="otroDescripcion"
                    type="text"
                    required
                    value={otroDescripcion}
                    onChange={(e) => setOtroDescripcion(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="detalle"
                  className="block text-sm font-medium text-primary-900"
                >
                  Cuéntanos más sobre la avería
                </label>
                <textarea
                  id="detalle"
                  rows={4}
                  required
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  placeholder="¿Dónde ocurre? ¿Desde cuándo? ¿Algo más que debamos saber?"
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="imagen"
                  className="block text-sm font-medium text-primary-900"
                >
                  Adjuntar una imagen (opcional)
                </label>
                <input
                  id="imagen"
                  type="file"
                  accept="image/*"
                  disabled={sinFoto}
                  onChange={handleImagenChange}
                  className="mt-1 w-full text-sm text-primary-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200 disabled:opacity-50"
                />
                {imagenPreview && (
                  <img
                    src={imagenPreview}
                    alt="Vista previa de la avería"
                    className="mt-3 h-40 w-40 rounded-lg object-cover"
                  />
                )}

                <label className="mt-3 flex items-center gap-2 text-sm text-primary-700">
                  <input
                    type="checkbox"
                    checked={sinFoto}
                    onChange={handleSinFotoChange}
                    className="h-4 w-4 rounded border-primary-300 text-primary-700 focus:ring-primary-500"
                  />
                  No agregar foto
                </label>
                <p className="mt-1 text-xs text-primary-500">
                  Podés enviar el reporte sin evidencia fotográfica.
                </p>
              </div>

              {errorSubmit && (
                <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                  {errorSubmit}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:opacity-50 sm:w-auto"
              >
                {submitting ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  )
}

export default ReportarAveria
