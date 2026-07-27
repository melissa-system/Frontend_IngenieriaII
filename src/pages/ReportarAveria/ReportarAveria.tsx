import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { crearAveria } from '../../components/Services/averias.service'

const TIPOS_AVERIA = [
  'Fuga de agua',
  'Tubería rota',
  'Falta de presión / sin agua',
  'Contador dañado',
  'Fuga en la vía pública',
  'Otro',
]

type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error'

interface HaciendaResponse {
  nombre?: string
}

function ReportarAveria() {
  const [cedula, setCedula] = useState('')
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [nombre, setNombre] = useState('')
  const [manualNombre, setManualNombre] = useState('')

  const [tipoAveria, setTipoAveria] = useState('')
  const [otroDescripcion, setOtroDescripcion] = useState('')
  const [detalle, setDetalle] = useState('')
  const [imagen, setImagen] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  
  // Estados para controlar el envío al backend
  const [submitting, setSubmitting] = useState(false)
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null)

  const datosListos = lookupStatus === 'found' || lookupStatus === 'not-found'

  const handleBuscarCedula = async (e: FormEvent) => {
    e.preventDefault()
    if (!cedula.trim()) return

    setLookupStatus('loading')
    try {
      const res = await fetch(
        `https://api.hacienda.go.cr/fe/ae?identificacion=${cedula.trim()}`,
      )
      const text = await res.text()
      const data: HaciendaResponse = text ? JSON.parse(text) : {}

      if (data.nombre) {
        setNombre(data.nombre)
        setLookupStatus('found')
      } else {
        setLookupStatus('not-found')
      }
    } catch {
      setLookupStatus('error')
    }
  }

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setImagen(file)
    setImagenPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorSubmit(null)

    // Concatenamos para enviar los campos que el backend en NestJS espera (tipo_averia y descripcion)
    const tipoFinal = tipoAveria === 'Otro' ? otroDescripcion : tipoAveria
    const descripcionFinal = `Reportado por: ${nombre || manualNombre} (Cédula: ${cedula}). Detalle: ${detalle}`

    try {
      await crearAveria({
        tipo_averia: tipoFinal,
        descripcion: descripcionFinal,
      })
      setSubmitted(true)
    } catch (error) {
      console.error('Error al enviar la avería:', error)
      setErrorSubmit('No se pudo guardar el reporte en la base de datos. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const nombreFinal = nombre || manualNombre

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="text-sm font-medium text-primary-700 hover:underline"
      >
        ← Volver al inicio
      </Link>

      <h1 className="mt-4 font-heading text-3xl font-semibold text-primary-900 sm:text-4xl">
        Reportar avería
      </h1>
      <p className="mt-3 text-primary-700">
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
          {/* Paso 1: cédula */}
          <form onSubmit={handleBuscarCedula} className="space-y-4">
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
                Nombre: <span className="font-semibold">{nombre}</span>
              </p>
            )}

            {lookupStatus === 'not-found' && (
              <div className="space-y-2">
                <p className="text-sm text-primary-600">
                  No encontramos datos para esa cédula. Verifica el número o
                  ingresa tu nombre manualmente para continuar.
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

          {/* Paso 2: detalles de la avería */}
          {datosListos && (nombre || manualNombre) && (
            <form onSubmit={handleSubmit} className="space-y-6 border-t border-primary-100 pt-8">
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
                  onChange={handleImagenChange}
                  className="mt-1 w-full text-sm text-primary-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
                />
                {imagenPreview && (
                  <img
                    src={imagenPreview}
                    alt="Vista previa de la avería"
                    className="mt-3 h-40 w-40 rounded-lg object-cover"
                  />
                )}
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