import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

interface SolicitudForm {
  nombre: string
  telefono: string
  correo: string
  direccion: string
  numeroPlano: string
  observaciones: string
}

const INITIAL_FORM: SolicitudForm = {
  nombre: '',
  telefono: '',
  correo: '',
  direccion: '',
  numeroPlano: '',
  observaciones: '',
}

type TipoIdentificacion = 'nacional' | 'extranjero' | ''
type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error'

interface HaciendaResponse {
  nombre?: string
}

function Afiliacion() {
  const [tipoId, setTipoId] = useState<TipoIdentificacion>('')

  // Flujo nacional / DIMEX
  const [cedula, setCedula] = useState('')
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')

  // Flujo extranjero
  const [pasaporte, setPasaporte] = useState('')
  const [nombreManual, setNombreManual] = useState('')

  const [form, setForm] = useState<SolicitudForm>(INITIAL_FORM)
  const [permisosMunicipales, setPermisosMunicipales] = useState<File | null>(
    null,
  )
  const [cartaSolicitud, setCartaSolicitud] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const datosListos =
    tipoId === 'nacional'
      ? lookupStatus === 'found' || lookupStatus === 'not-found'
      : tipoId === 'extranjero'
        ? pasaporte.trim() !== '' && nombreManual.trim() !== ''
        : false

  const nombreFinal =
    tipoId === 'nacional' ? form.nombre || 'vecino/a' : nombreManual || 'vecino/a'
  const identificacionFinal = tipoId === 'nacional' ? cedula : pasaporte

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
    console.log('Solicitud de paja de agua (mock):', {
      ...form,
      tipoId,
      identificacion: identificacionFinal,
      nombre: tipoId === 'nacional' ? form.nombre : nombreManual,
      permisosMunicipales: permisosMunicipales?.name ?? null,
      cartaSolicitud: cartaSolicitud?.name ?? null,
    })
    setSubmitted(true)
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <Link
        to="/"
        className="text-sm font-medium text-primary-700 hover:underline"
      >
        ← Volver al inicio
      </Link>

      <h1 className="mt-4 text-center font-heading text-3xl font-semibold text-primary-900 sm:text-4xl">
        Solicitud de paja de agua
      </h1>
      <p className="mt-3 text-center text-primary-700">
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
            Gracias, {nombreFinal}. Recibimos tu solicitud de paja de agua.
            Nos pondremos en contacto contigo para confirmar la
            disponibilidad en tu propiedad.
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
                setPasaporte('')
                setNombreManual('')
                setForm(INITIAL_FORM)
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
                <div className="space-y-2">
                  <p className="text-sm text-primary-600">
                    No encontramos datos para esa cédula. Verifica el número
                    o completa tu nombre manualmente abajo para continuar.
                  </p>
                  <input
                    type="text"
                    required
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Nombre completo"
                    className="w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
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
                  htmlFor="nombreManual"
                  className="block text-sm font-medium text-primary-900"
                >
                  Nombre completo
                </label>
                <input
                  id="nombreManual"
                  type="text"
                  required
                  value={nombreManual}
                  onChange={(e) => setNombreManual(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Paso 2: resto de datos, solo si ya pasamos la verificación */}
          {datosListos && (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 border-t border-primary-100 pt-8"
            >
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
                  htmlFor="numeroPlano"
                  className="block text-sm font-medium text-primary-900"
                >
                  Número de plano
                </label>
                <input
                  id="numeroPlano"
                  name="numeroPlano"
                  type="text"
                  required
                  value={form.numeroPlano}
                  onChange={handleChange}
                  placeholder="Ej. G-1234567-2024"
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="permisosMunicipales"
                  className="block text-sm font-medium text-primary-900"
                >
                  Permisos municipales (adjuntar documento)
                </label>
                <input
                  id="permisosMunicipales"
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    setPermisosMunicipales(e.target.files?.[0] ?? null)
                  }
                  className="mt-1 w-full text-sm text-primary-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
                />
              </div>

              <div>
                <label
                  htmlFor="cartaSolicitud"
                  className="block text-sm font-medium text-primary-900"
                >
                  Carta correspondiente a la solicitud (adjuntar documento)
                </label>
                <input
                  id="cartaSolicitud"
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    setCartaSolicitud(e.target.files?.[0] ?? null)
                  }
                  className="mt-1 w-full text-sm text-primary-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
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
