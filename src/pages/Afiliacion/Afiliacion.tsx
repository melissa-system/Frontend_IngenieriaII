import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

interface AfiliacionForm {
  nombre: string
  telefono: string
  correo: string
  direccion: string
  observaciones: string
}

const INITIAL_FORM: AfiliacionForm = {
  nombre: '',
  telefono: '',
  correo: '',
  direccion: '',
  observaciones: '',
}

type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error'

interface HaciendaResponse {
  nombre?: string
}

function Afiliacion() {
  const [cedula, setCedula] = useState('')
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [form, setForm] = useState<AfiliacionForm>(INITIAL_FORM)
  const [submitted, setSubmitted] = useState(false)

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
        setForm((prev) => ({ ...prev, nombre: data.nombre ?? '' }))
        setLookupStatus('found')
      } else {
        setLookupStatus('not-found')
      }
    } catch {
      // Puede fallar por CORS o problemas de red: dejamos continuar
      // al usuario ingresando su nombre manualmente.
      setLookupStatus('error')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // TODO: conectar a un backend real cuando exista (SIAP).
    // Por ahora solo simulamos el envío de la solicitud.
    console.log('Solicitud de afiliación (mock):', { cedula, ...form })
    setSubmitted(true)
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="text-sm font-medium text-primary-700 hover:underline"
      >
        ← Volver al inicio
      </Link>

      <h1 className="mt-4 font-heading text-3xl font-semibold text-primary-900 sm:text-4xl">
        Solicitud de afiliación
      </h1>
      <p className="mt-3 text-primary-700">
        Completa tus datos para solicitar una nueva conexión de agua potable.
        Verificaremos la disponibilidad de paja de agua para tu propiedad y
        te contactaremos.
      </p>

      {submitted ? (
        <div className="mt-10 rounded-2xl bg-primary-50 p-8 text-center">
          <h2 className="font-heading text-xl font-semibold text-primary-900">
            ¡Solicitud enviada!
          </h2>
          <p className="mt-3 text-primary-700">
            Gracias, {form.nombre || 'vecino/a'}. Recibimos tu solicitud de
            afiliación. Nos pondremos en contacto contigo para confirmar la
            disponibilidad de paja de agua en tu propiedad.
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
                Nombre: <span className="font-semibold">{form.nombre}</span>
              </p>
            )}

            {lookupStatus === 'not-found' && (
              <p className="text-sm text-primary-600">
                No encontramos datos para esa cédula. Verifica el número o
                completa tu nombre manualmente abajo para continuar.
              </p>
            )}

            {lookupStatus === 'error' && (
              <div className="space-y-2">
                <p className="text-sm text-primary-600">
                  No pudimos verificar tu cédula automáticamente. Puedes
                  continuar e ingresar tu nombre manualmente abajo.
                </p>
                <button
                  type="button"
                  onClick={() => setLookupStatus('not-found')}
                  className="text-sm font-medium text-primary-700 hover:underline"
                >
                  Continuar de todas formas →
                </button>
              </div>
            )}
          </form>

          {/* Paso 2: resto de datos, solo si ya pasamos la verificación */}
          {datosListos && (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 border-t border-primary-100 pt-8"
            >
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-primary-900"
                >
                  Nombre completo
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  value={form.nombre}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="telefono"
                    className="block text-sm font-medium text-primary-900"
                  >
                    Teléfono
                  </label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    required
                    value={form.telefono}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="correo"
                    className="block text-sm font-medium text-primary-900"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    required
                    value={form.correo}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="direccion"
                  className="block text-sm font-medium text-primary-900"
                >
                  Dirección exacta de la propiedad
                </label>
                <input
                  id="direccion"
                  name="direccion"
                  type="text"
                  required
                  value={form.direccion}
                  onChange={handleChange}
                  placeholder="Ej. 100m norte de..."
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="observaciones"
                  className="block text-sm font-medium text-primary-900"
                >
                  Observaciones (opcional)
                </label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  rows={4}
                  value={form.observaciones}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800 sm:w-auto"
              >
                Enviar solicitud
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  )
}

export default Afiliacion
