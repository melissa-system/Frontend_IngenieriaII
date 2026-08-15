import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCedulaLookup } from '../../hooks/useCedulaLookup'

interface SolicitudFisicaForm {
  nombre: string
  telefono: string
  correo: string
  direccion: string
  numeroPlano: string
  observaciones: string
}

const INITIAL_FISICA: SolicitudFisicaForm = {
  nombre: '',
  telefono: '',
  correo: '',
  direccion: '',
  numeroPlano: '',
  observaciones: '',
}

interface SolicitudJuridicaForm {
  nombreEmpresa: string
  cedulaJuridica: string
  nombreRepresentante: string
  cedulaRepresentante: string
  telefono: string
  correo: string
  direccion: string
  numeroPlano: string
  observaciones: string
}

const INITIAL_JURIDICA: SolicitudJuridicaForm = {
  nombreEmpresa: '',
  cedulaJuridica: '',
  nombreRepresentante: '',
  cedulaRepresentante: '',
  telefono: '',
  correo: '',
  direccion: '',
  numeroPlano: '',
  observaciones: '',
}

type TipoPersona = 'fisica' | 'juridica' | ''
type TipoIdentificacion = 'nacional' | 'dimex' | ''

function Afiliacion() {
  const [tipoPersona, setTipoPersona] = useState<TipoPersona>('')
  const [tipoId, setTipoId] = useState<TipoIdentificacion>('')

  // Flujo persona física: cédula nacional (API de Hacienda)
  const {
    cedula,
    setCedula,
    lookupStatus,
    setLookupStatus,
    datosListos: datosListosNacional,
    nombreEncontrado,
    buscarCedula,
  } = useCedulaLookup()

  // Flujo persona física: DIMEX (registro manual)
  const [numeroDimex, setNumeroDimex] = useState('')
  const [nombreDimex, setNombreDimex] = useState('')

  const [formFisica, setFormFisica] = useState<SolicitudFisicaForm>(INITIAL_FISICA)
  const [formJuridica, setFormJuridica] =
    useState<SolicitudJuridicaForm>(INITIAL_JURIDICA)

  const [permisosMunicipales, setPermisosMunicipales] = useState<File | null>(
    null,
  )
  const [cartaSolicitud, setCartaSolicitud] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (nombreEncontrado) {
      setFormFisica((prev) => ({ ...prev, nombre: nombreEncontrado }))
    }
  }, [nombreEncontrado])

  const resetTodo = () => {
    setTipoId('')
    setCedula('')
    setLookupStatus('idle')
    setNumeroDimex('')
    setNombreDimex('')
    setFormFisica(INITIAL_FISICA)
    setFormJuridica(INITIAL_JURIDICA)
    setPermisosMunicipales(null)
    setCartaSolicitud(null)
  }

  const datosListosFisica =
    tipoId === 'nacional'
      ? datosListosNacional
      : tipoId === 'dimex'
        ? numeroDimex.trim() !== '' && nombreDimex.trim() !== ''
        : false

  const datosListos =
    tipoPersona === 'fisica'
      ? datosListosFisica
      : tipoPersona === 'juridica'
        ? true
        : false

  const nombreFinal =
    tipoPersona === 'juridica'
      ? formJuridica.nombreEmpresa || 'la empresa'
      : tipoId === 'nacional'
        ? formFisica.nombre || 'vecino/a'
        : nombreDimex || 'vecino/a'

  const handleChangeFisica = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormFisica((prev) => ({ ...prev, [name]: value }))
  }

  const handleChangeJuridica = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormJuridica((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // TODO: conectar a un backend real cuando exista (SIAP).
    // Por ahora solo simulamos el envío de la solicitud.
    if (tipoPersona === 'fisica') {
      console.log('Solicitud de paja de agua - persona física (mock):', {
        ...formFisica,
        tipoId,
        identificacion: tipoId === 'nacional' ? cedula : numeroDimex,
        nombre: tipoId === 'nacional' ? formFisica.nombre : nombreDimex,
        permisosMunicipales: permisosMunicipales?.name ?? null,
        cartaSolicitud: cartaSolicitud?.name ?? null,
      })
    } else {
      console.log('Solicitud de paja de agua - persona jurídica (mock):', {
        ...formJuridica,
        permisosMunicipales: permisosMunicipales?.name ?? null,
        cartaSolicitud: cartaSolicitud?.name ?? null,
      })
    }
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

      <h1 className="mt-4 text-center text-3xl font-black tracking-normal text-primary-900 uppercase sm:text-4xl">
        Solicitud de paja de agua
      </h1>
      <p className="mt-3 text-center text-primary-700">
        Completa tus datos para solicitar una nueva conexión de agua potable.
        Verificaremos la disponibilidad de paja de agua para tu propiedad y
        te contactaremos.
      </p>

      {submitted ? (
        <div className="mt-10 rounded-2xl bg-primary-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-primary-900">
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
          {/* Paso 0: tipo de persona */}
          <div>
            <label
              htmlFor="tipoPersona"
              className="block text-sm font-medium text-primary-900"
            >
              Tipo de solicitante
            </label>
            <select
              id="tipoPersona"
              required
              value={tipoPersona}
              onChange={(e) => {
                setTipoPersona(e.target.value as TipoPersona)
                resetTodo()
              }}
              className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              <option value="fisica">Persona física</option>
              <option value="juridica">Persona jurídica</option>
            </select>
          </div>

          {/* Paso 0b (solo persona física): tipo de identificación */}
          {tipoPersona === 'fisica' && (
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
                  setNumeroDimex('')
                  setNombreDimex('')
                  setFormFisica(INITIAL_FISICA)
                }}
                className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                <option value="" disabled>
                  Selecciona una opción
                </option>
                <option value="nacional">Cédula nacional</option>
                <option value="dimex">DIMEX</option>
              </select>
            </div>
          )}

          {/* Paso 1a: cédula nacional (API de Hacienda) */}
          {tipoPersona === 'fisica' && tipoId === 'nacional' && (
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
                    disabled={datosListosNacional}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="Ej. 1-2345-6789"
                    className="flex-1 rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none disabled:bg-primary-50"
                  />
                  {!datosListosNacional && (
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
                  <span className="font-semibold">{formFisica.nombre}</span>
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
                    value={formFisica.nombre}
                    onChange={handleChangeFisica}
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

          {/* Paso 1b: DIMEX (registro manual) */}
          {tipoPersona === 'fisica' && tipoId === 'dimex' && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="numeroDimex"
                  className="block text-sm font-medium text-primary-900"
                >
                  Número de DIMEX
                </label>
                <input
                  id="numeroDimex"
                  type="text"
                  required
                  value={numeroDimex}
                  onChange={(e) => setNumeroDimex(e.target.value)}
                  placeholder="Número de DIMEX"
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="nombreDimex"
                  className="block text-sm font-medium text-primary-900"
                >
                  Nombre completo
                </label>
                <input
                  id="nombreDimex"
                  type="text"
                  required
                  value={nombreDimex}
                  onChange={(e) => setNombreDimex(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Paso 2 (persona física): resto de datos, solo si ya pasamos la verificación */}
          {tipoPersona === 'fisica' && datosListos && (
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
                    value={formFisica.telefono}
                    onChange={handleChangeFisica}
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
                    value={formFisica.correo}
                    onChange={handleChangeFisica}
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
                  value={formFisica.direccion}
                  onChange={handleChangeFisica}
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
                  value={formFisica.numeroPlano}
                  onChange={handleChangeFisica}
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
                  value={formFisica.observaciones}
                  onChange={handleChangeFisica}
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

          {/* Formulario completo (persona jurídica) */}
          {tipoPersona === 'juridica' && (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 border-t border-primary-100 pt-8"
            >
              <div>
                <label
                  htmlFor="nombreEmpresa"
                  className="block text-sm font-medium text-primary-900"
                >
                  Nombre de la empresa
                </label>
                <input
                  id="nombreEmpresa"
                  name="nombreEmpresa"
                  type="text"
                  required
                  value={formJuridica.nombreEmpresa}
                  onChange={handleChangeJuridica}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="cedulaJuridica"
                  className="block text-sm font-medium text-primary-900"
                >
                  Cédula jurídica
                </label>
                <input
                  id="cedulaJuridica"
                  name="cedulaJuridica"
                  type="text"
                  required
                  value={formJuridica.cedulaJuridica}
                  onChange={handleChangeJuridica}
                  placeholder="Ej. 3-101-123456"
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="nombreRepresentante"
                    className="block text-sm font-medium text-primary-900"
                  >
                    Nombre del representante
                  </label>
                  <input
                    id="nombreRepresentante"
                    name="nombreRepresentante"
                    type="text"
                    required
                    value={formJuridica.nombreRepresentante}
                    onChange={handleChangeJuridica}
                    className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cedulaRepresentante"
                    className="block text-sm font-medium text-primary-900"
                  >
                    Cédula del representante
                  </label>
                  <input
                    id="cedulaRepresentante"
                    name="cedulaRepresentante"
                    type="text"
                    required
                    value={formJuridica.cedulaRepresentante}
                    onChange={handleChangeJuridica}
                    placeholder="Ej. 1-2345-6789"
                    className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="telefonoJuridica"
                    className="block text-sm font-medium text-primary-900"
                  >
                    Número de contacto
                  </label>
                  <input
                    id="telefonoJuridica"
                    name="telefono"
                    type="tel"
                    required
                    value={formJuridica.telefono}
                    onChange={handleChangeJuridica}
                    className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="correoJuridica"
                    className="block text-sm font-medium text-primary-900"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="correoJuridica"
                    name="correo"
                    type="email"
                    required
                    value={formJuridica.correo}
                    onChange={handleChangeJuridica}
                    className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="direccionJuridica"
                  className="block text-sm font-medium text-primary-900"
                >
                  Dirección exacta de la propiedad
                </label>
                <input
                  id="direccionJuridica"
                  name="direccion"
                  type="text"
                  required
                  value={formJuridica.direccion}
                  onChange={handleChangeJuridica}
                  placeholder="Ej. 100m norte de..."
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="numeroPlanoJuridica"
                  className="block text-sm font-medium text-primary-900"
                >
                  Número de plano
                </label>
                <input
                  id="numeroPlanoJuridica"
                  name="numeroPlano"
                  type="text"
                  required
                  value={formJuridica.numeroPlano}
                  onChange={handleChangeJuridica}
                  placeholder="Ej. G-1234567-2024"
                  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="permisosMunicipalesJuridica"
                  className="block text-sm font-medium text-primary-900"
                >
                  Permisos municipales (adjuntar documento)
                </label>
                <input
                  id="permisosMunicipalesJuridica"
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
                  htmlFor="cartaSolicitudJuridica"
                  className="block text-sm font-medium text-primary-900"
                >
                  Carta correspondiente a la solicitud (adjuntar documento)
                </label>
                <input
                  id="cartaSolicitudJuridica"
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
                  htmlFor="observacionesJuridica"
                  className="block text-sm font-medium text-primary-900"
                >
                  Observaciones (opcional)
                </label>
                <textarea
                  id="observacionesJuridica"
                  name="observaciones"
                  rows={4}
                  value={formJuridica.observaciones}
                  onChange={handleChangeJuridica}
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
