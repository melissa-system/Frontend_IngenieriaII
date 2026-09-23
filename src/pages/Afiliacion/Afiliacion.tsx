import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  crearSolicitudPajaAgua,
  formatearCedula,
  normalizarIdentificacion,
  detectarTipoIdentificacion,
  IDENTIFICACION_REGEX,
  TELEFONO_REGEX,
  EMAIL_REGEX,
  NATURALEZA_INMUEBLE_OPCIONES,
  CALIDAD_TITULAR_OPCIONES,
  TIPO_SERVICIO_OPCIONES,
  TIPO_CONEXION_OPCIONES,
  type TipoIdentificacionDetectado,
  type SolicitudPajaAgua,
} from '../../components/Services/solicitudes.service'
import {
  ACCEPT_ARCHIVOS_PERMITIDOS,
  extensionPermitida,
  MENSAJE_FORMATO_NO_PERMITIDO,
  ACCEPT_FOTO_IDENTIFICACION,
  extensionFotoIdentificacionPermitida,
  MENSAJE_FORMATO_FOTO_NO_PERMITIDO,
} from '../../lib/extensionesPermitidas'
import { obtenerConfiguracion } from '../../components/Services/configuracion.service'
import {
  generarDocumentoSolicitud,
  descargarDocumentoSolicitud,
  type DatosDocumentoSolicitud,
} from '../../lib/generarDocumentoSolicitud'

type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error'

interface DraftData {
  identificacion: string
  nombreSolicitante: string
  nombreRepresentante: string
  cedulaRepresentante: string
  telefono: string
  telefonoSecundario: string
  correo: string
  provincia: string
  canton: string
  distrito: string
  direccion: string
  numeroPlano: string
  naturalezaInmueble: string
  calidadTitular: string
  tipoServicio: string
  tipoConexion: string
  observaciones: string
}

const DRAFT_INICIAL: DraftData = {
  identificacion: '',
  nombreSolicitante: '',
  nombreRepresentante: '',
  cedulaRepresentante: '',
  telefono: '',
  telefonoSecundario: '',
  correo: '',
  provincia: '',
  canton: '',
  distrito: '',
  direccion: '',
  numeroPlano: '',
  naturalezaInmueble: '',
  calidadTitular: '',
  tipoServicio: '',
  tipoConexion: '',
  observaciones: '',
}

const DRAFT_KEY = 'siapb:solicitud-paja-agua:draft:v1'

// El borrador guardado en el navegador solo es válido por 3 días desde que
// se empezó a llenar. Pasado ese plazo, se descarta y el formulario arranca
// de cero (sin avisar con nada más que el formulario vacío).
const LIMITE_BORRADOR_MS = 3 * 24 * 60 * 60 * 1000

function formatearFechaLimite(fechaMs: number): string {
  return new Intl.DateTimeFormat('es-CR', {
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(fechaMs))
}

const TITULOS_PASO = [
  'Verificación de identidad',
  'Datos de contacto',
  'Ubicación del inmueble',
  'Detalles de la solicitud',
  'Documentos y envío',
]

const TOTAL_PASOS = TITULOS_PASO.length

const inputCls =
  'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none'
const labelCls = 'block text-xs font-semibold text-primary-900'
const selectCls =
  'mt-1 w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none'

function etiquetaTipo(tipo: TipoIdentificacionDetectado): string {
  if (tipo === 'fisica') return 'Persona física'
  if (tipo === 'juridica') return 'Persona jurídica'
  if (tipo === 'dimex') return 'DIMEX (residente extranjero)'
  return ''
}

function Afiliacion() {
  const [paso, setPaso] = useState(0)
  const [draft, setDraft] = useState<DraftData>(DRAFT_INICIAL)
  const [hidratado, setHidratado] = useState(false)
  const [huboDraftGuardado, setHuboDraftGuardado] = useState(false)
  const [huboDraftExpirado, setHuboDraftExpirado] = useState(false)
  // Marca de tiempo de cuándo se empezó ESTE borrador (no se actualiza en
  // cada guardado, para que el plazo de 3 días sea desde que la persona
  // arrancó la solicitud, no desde el último cambio que hizo).
  const [iniciadoEn, setIniciadoEn] = useState<number | null>(null)

  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [lookupRepStatus, setLookupRepStatus] = useState<LookupStatus>('idle')

  const [permisosMunicipales, setPermisosMunicipales] = useState<File | null>(null)
  const [cartaSolicitud, setCartaSolicitud] = useState<File | null>(null)
  const [cedulaFrente, setCedulaFrente] = useState<File | null>(null)
  const [cedulaDorso, setCedulaDorso] = useState<File | null>(null)
  const [errorArchivoPermisos, setErrorArchivoPermisos] = useState<string | null>(null)
  const [errorArchivoCarta, setErrorArchivoCarta] = useState<string | null>(null)
  const [errorArchivoCedulaFrente, setErrorArchivoCedulaFrente] = useState<string | null>(null)
  const [errorArchivoCedulaDorso, setErrorArchivoCedulaDorso] = useState<string | null>(null)

  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null)
  const [solicitudCreada, setSolicitudCreada] = useState<SolicitudPajaAgua | null>(null)
  const [documentoBlob, setDocumentoBlob] = useState<Blob | null>(null)
  const [errorDocumento, setErrorDocumento] = useState<string | null>(null)

  // --- Cargar borrador guardado (si existe) al montar ---
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(DRAFT_KEY)
      if (guardado) {
        const datos = JSON.parse(guardado) as {
          draft?: Partial<DraftData>
          paso?: number
          iniciadoEn?: number
        }

        const expirado =
          typeof datos.iniciadoEn === 'number' &&
          Date.now() - datos.iniciadoEn > LIMITE_BORRADOR_MS

        if (expirado) {
          // Pasaron más de 3 días: se descarta el borrador y el formulario
          // arranca en blanco, sin restaurar nada.
          localStorage.removeItem(DRAFT_KEY)
          setHuboDraftExpirado(true)
        } else {
          if (datos.draft) {
            setDraft({ ...DRAFT_INICIAL, ...datos.draft })
            if (datos.draft.nombreSolicitante) setLookupStatus('found')
          }
          if (typeof datos.paso === 'number' && datos.paso > 0) {
            setPaso(datos.paso)
            setHuboDraftGuardado(true)
          }
          if (typeof datos.iniciadoEn === 'number') {
            setIniciadoEn(datos.iniciadoEn)
          }
        }
      }
    } catch {
      // localStorage puede fallar (modo privado, cuota llena, etc.) — no es
      // crítico, el usuario simplemente empieza desde cero.
    } finally {
      setHidratado(true)
    }
  }, [])

  // --- Guardar borrador en cada cambio (nunca los archivos: File no es serializable) ---
  useEffect(() => {
    if (!hidratado || enviado) return
    try {
      const marcaInicio = iniciadoEn ?? Date.now()
      if (iniciadoEn === null) setIniciadoEn(marcaInicio)
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ draft, paso, iniciadoEn: marcaInicio }),
      )
    } catch {
      // se ignora: si falla, el peor caso es que no se pueda retomar después
    }
  }, [draft, paso, hidratado, enviado, iniciadoEn])

  const limpiarBorrador = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // se ignora
    }
  }

  const empezarDeNuevo = () => {
    limpiarBorrador()
    setDraft(DRAFT_INICIAL)
    setPaso(0)
    setLookupStatus('idle')
    setLookupRepStatus('idle')
    setPermisosMunicipales(null)
    setCartaSolicitud(null)
    setCedulaFrente(null)
    setCedulaDorso(null)
    setErrorArchivoPermisos(null)
    setErrorArchivoCarta(null)
    setErrorArchivoCedulaFrente(null)
    setErrorArchivoCedulaDorso(null)
    setErrorSubmit(null)
    setHuboDraftGuardado(false)
    setHuboDraftExpirado(false)
    setIniciadoEn(null)
  }

  // --- Avisar antes de salir si hay una solicitud en progreso sin enviar ---
  useEffect(() => {
    if (paso === 0 || enviado) return
    const manejarBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue =
        'Tu solicitud quedará guardada en este navegador por 3 días para que puedas continuarla luego.'
    }
    window.addEventListener('beforeunload', manejarBeforeUnload)
    return () => window.removeEventListener('beforeunload', manejarBeforeUnload)
  }, [paso, enviado])

  const actualizar = <K extends keyof DraftData>(campo: K, valor: DraftData[K]) => {
    setDraft((prev) => ({ ...prev, [campo]: valor }))
  }

  // ---------- Paso 0: identificación ----------
  const digitos = draft.identificacion.replace(/\D/g, '')
  const tipoDetectado = detectarTipoIdentificacion(digitos)

  const handleIdentificacionChange = (e: ChangeEvent<HTMLInputElement>) => {
    const soloDigitos = e.target.value.replace(/\D/g, '').slice(0, 12)
    let formateado = soloDigitos
    if (soloDigitos.length <= 9) formateado = formatearCedula(soloDigitos, 'fisica')
    else if (soloDigitos.length === 10) formateado = formatearCedula(soloDigitos, 'juridica')
    setDraft((prev) => ({
      ...prev,
      identificacion: formateado,
      nombreSolicitante: '',
    }))
    setLookupStatus('idle')
  }

  const buscarIdentificacion = async () => {
    if (!tipoDetectado) return

    // La API de Hacienda no cubre DIMEX de forma confiable: se pasa directo
    // al nombre manual en vez de intentar una búsqueda que casi siempre falla.
    if (tipoDetectado === 'dimex') {
      setLookupStatus('not-found')
      return
    }

    setLookupStatus('loading')
    try {
      const res = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${digitos}`)
      const text = await res.text()
      let data: { nombre?: string } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = {}
      }
      if (data.nombre) {
        actualizar('nombreSolicitante', data.nombre)
        setLookupStatus('found')
      } else {
        setLookupStatus('not-found')
      }
    } catch {
      setLookupStatus('error')
    }
  }

  const handleCedulaRepresentanteChange = (e: ChangeEvent<HTMLInputElement>) => {
    actualizar('cedulaRepresentante', formatearCedula(e.target.value, 'fisica'))
    setLookupRepStatus('idle')
  }

  const buscarRepresentante = async () => {
    const digitosRep = draft.cedulaRepresentante.replace(/\D/g, '')
    if (digitosRep.length !== 9) return
    setLookupRepStatus('loading')
    try {
      const res = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${digitosRep}`)
      const text = await res.text()
      let data: { nombre?: string } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = {}
      }
      if (data.nombre) {
        actualizar('nombreRepresentante', data.nombre)
        setLookupRepStatus('found')
      } else {
        setLookupRepStatus('not-found')
      }
    } catch {
      setLookupRepStatus('error')
    }
  }

  const nombreValido = draft.nombreSolicitante.trim().length >= 3
  const esJuridica = tipoDetectado === 'juridica'

  const paso0Valido =
    tipoDetectado !== null &&
    nombreValido &&
    (!esJuridica ||
      (draft.nombreRepresentante.trim().length >= 3 &&
        IDENTIFICACION_REGEX.test(draft.cedulaRepresentante)))

  // ---------- Paso 1: contacto ----------
  const telefonoValido = TELEFONO_REGEX.test(draft.telefono)
  const telefonoSecundarioValido =
    draft.telefonoSecundario.trim() === '' || TELEFONO_REGEX.test(draft.telefonoSecundario)
  const correoValido = EMAIL_REGEX.test(draft.correo)
  const paso1Valido = telefonoValido && correoValido && telefonoSecundarioValido

  // ---------- Paso 2: ubicación ----------
  const paso2Valido =
    draft.provincia !== '' &&
    draft.canton !== '' &&
    draft.distrito !== '' &&
    draft.direccion.trim() !== '' &&
    draft.numeroPlano.trim() !== ''

  // ---------- Paso 3: detalles de la solicitud ----------
  const paso3Valido =
    draft.naturalezaInmueble !== '' &&
    draft.calidadTitular !== '' &&
    draft.tipoServicio !== '' &&
    draft.tipoConexion !== ''

  // ---------- Paso 4: documentos ----------
  const handleFileChange =
    (
      setter: (f: File | null) => void,
      setError: (m: string | null) => void,
      validarExtension: (nombre: string) => boolean = extensionPermitida,
      mensajeError: string = MENSAJE_FORMATO_NO_PERMITIDO,
    ) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      if (file && !validarExtension(file.name)) {
        setError(mensajeError)
        setter(null)
        e.target.value = ''
        return
      }
      setError(null)
      setter(file)
    }

  const paso4Valido =
    permisosMunicipales !== null &&
    cartaSolicitud !== null &&
    cedulaFrente !== null &&
    cedulaDorso !== null

  const validezPorPaso = [paso0Valido, paso1Valido, paso2Valido, paso3Valido, paso4Valido]
  const pasoActualValido = validezPorPaso[paso]

  const irSiguiente = () => {
    if (!pasoActualValido || paso >= TOTAL_PASOS - 1) return
    setPaso((p) => Math.min(p + 1, TOTAL_PASOS - 1))
  }
  const irAtras = () => {
    setPaso((p) => Math.max(p - 1, 0))
  }

  const nombreFinal = draft.nombreSolicitante || 'vecino/a'

  const handleSubmit = async () => {
    if (!paso4Valido || !permisosMunicipales || !cartaSolicitud || !cedulaFrente || !cedulaDorso)
      return
    setEnviando(true)
    setErrorSubmit(null)
    try {
      const creada = await crearSolicitudPajaAgua({
        tipoPersona: tipoDetectado === 'juridica' ? 'juridica' : 'fisica',
        nombreSolicitante: draft.nombreSolicitante,
        identificacion: normalizarIdentificacion(draft.identificacion),
        nombreRepresentante: esJuridica ? draft.nombreRepresentante : undefined,
        cedulaRepresentante: esJuridica
          ? normalizarIdentificacion(draft.cedulaRepresentante)
          : undefined,
        telefono: draft.telefono,
        telefonoSecundario: draft.telefonoSecundario || undefined,
        correo: draft.correo,
        provincia: draft.provincia,
        canton: draft.canton,
        distrito: draft.distrito,
        direccion: draft.direccion,
        numeroPlano: draft.numeroPlano,
        naturalezaInmueble: draft.naturalezaInmueble,
        calidadTitular: draft.calidadTitular,
        tipoServicio: draft.tipoServicio,
        tipoConexion: draft.tipoConexion,
        observaciones: draft.observaciones || undefined,
        permisosMunicipales,
        cartaSolicitud,
        cedulaFrente,
        cedulaDorso,
      })
      limpiarBorrador()
      setSolicitudCreada(creada)
      setEnviado(true)

      // Generar el documento lleno para poder verlo/descargarlo de una vez.
      // Se arma con los datos que la persona ACABA de escribir (no hace
      // falta volver a pedirle nada al backend) + los datos reales de la
      // ASADA (dirección/teléfono/correo), que sí vienen de Configuracion.
      try {
        const configuracion = await obtenerConfiguracion()
        const datosDocumento: DatosDocumentoSolicitud = {
          codigoSolicitud: creada.codigo_solicitud,
          fecha: creada.fecha_solicitud,
          tipoPersona: tipoDetectado === 'juridica' ? 'juridica' : 'fisica',
          nombreSolicitante: draft.nombreSolicitante,
          identificacion: normalizarIdentificacion(draft.identificacion),
          nombreRepresentante: esJuridica ? draft.nombreRepresentante : null,
          cedulaRepresentante: esJuridica
            ? normalizarIdentificacion(draft.cedulaRepresentante)
            : null,
          telefono: draft.telefono,
          telefonoSecundario: draft.telefonoSecundario || null,
          correo: draft.correo,
          provincia: draft.provincia,
          canton: draft.canton,
          distrito: draft.distrito,
          direccion: draft.direccion,
          numeroPlano: draft.numeroPlano,
          naturalezaInmueble: draft.naturalezaInmueble,
          calidadTitular: draft.calidadTitular,
          tipoServicio: draft.tipoServicio,
          tipoConexion: draft.tipoConexion,
          observaciones: draft.observaciones || null,
        }
        setDocumentoBlob(await generarDocumentoSolicitud(datosDocumento, configuracion))
      } catch {
        // No es crítico: la solicitud YA se guardó. Solo no se podrá
        // ver/descargar el documento formal desde esta pantalla.
        setErrorDocumento(
          'La solicitud se envió correctamente, pero no pudimos generar el documento para descargar. Guardá tu código de seguimiento.',
        )
      }
    } catch (error) {
      const mensaje =
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo guardar la solicitud. Inténtalo de nuevo.'
      setErrorSubmit(mensaje)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <Link to="/" className="text-sm font-medium text-primary-700 hover:underline">
        ← Volver al inicio
      </Link>

      <h1 className="mt-2 text-center text-2xl font-title font-bold tracking-normal text-primary-900 uppercase sm:text-3xl">
        Solicitud de paja de agua
      </h1>

      {enviado ? (
        <div className="mt-8 rounded-2xl bg-primary-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-primary-900">¡Solicitud enviada!</h2>
          <p className="mt-3 text-primary-700">
            Gracias, {nombreFinal}. Recibimos tu solicitud de disponibilidad de servicio.
            La junta directiva la revisará y te contactaremos con el resultado.
          </p>
          {solicitudCreada && (
            <p className="mt-3 text-sm text-primary-600">
              Tu código de seguimiento es{' '}
              <span className="font-semibold text-primary-900">
                {solicitudCreada.codigo_solicitud}
              </span>
            </p>
          )}

          {documentoBlob && (
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  descargarDocumentoSolicitud(
                    documentoBlob,
                    solicitudCreada?.codigo_solicitud ?? 'paja-de-agua',
                  )
                }
                className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800"
              >
                Descargar documento (Word)
              </button>
            </div>
          )}
          {errorDocumento && (
            <p className="mt-3 text-xs text-primary-500">{errorDocumento}</p>
          )}

          <Link
            to="/"
            className="mt-6 inline-block text-sm font-medium text-primary-700 hover:underline"
          >
            Volver al inicio
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          {/* Indicador de pasos numerado */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            {TITULOS_PASO.map((_, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold sm:h-8 sm:w-8 ${
                    i === paso
                      ? 'bg-primary-700 text-white'
                      : i < paso
                        ? 'bg-primary-200 text-primary-800'
                        : 'bg-primary-50 text-primary-400'
                  }`}
                >
                  {i < paso ? '✓' : i + 1}
                </div>
                {i < TITULOS_PASO.length - 1 && (
                  <div
                    className={`h-0.5 w-4 sm:w-8 ${i < paso ? 'bg-primary-300' : 'bg-primary-100'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-xs font-semibold tracking-wide text-primary-600 uppercase">
            Paso {paso + 1} de {TOTAL_PASOS} · {TITULOS_PASO[paso]}
          </p>

          {huboDraftGuardado && paso > 0 && (
            <p className="mt-2 rounded-lg bg-primary-50 px-3 py-2 text-center text-xs text-primary-700">
              Retomamos tu solicitud donde la dejaste. Podés continuar hasta el{' '}
              {iniciadoEn
                ? formatearFechaLimite(iniciadoEn + LIMITE_BORRADOR_MS)
                : 'límite de 3 días'}
              , luego el formulario se reinicia.{' '}
              <button
                type="button"
                onClick={empezarDeNuevo}
                className="font-semibold underline hover:text-primary-900"
              >
                Empezar de nuevo
              </button>
            </p>
          )}

          {huboDraftExpirado && paso === 0 && (
            <p className="mt-2 rounded-lg bg-yellow-50 px-3 py-2 text-center text-xs text-yellow-700">
              Tu solicitud anterior venció (pasaron más de 3 días) y tuvimos que reiniciarla.
              Empezá de nuevo cuando quieras.
            </p>
          )}

          {/* Contenido del paso actual: min-h fija (no flex-1) para que un
              paso con pocos campos (ej. Paso 1) no estire la tarjeta a toda
              la altura de la pantalla dejando un vacío enorme abajo. El
              valor cubre el paso más cargado (Ubicación) sin scroll. */}
          <div className="mt-4 min-h-[280px] rounded-2xl border border-primary-100 p-4 sm:min-h-[300px] sm:p-5">
            {paso === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-primary-600">
                  Ingresá tu número de identificación: detectamos automáticamente si sos
                  persona física, jurídica o extranjero (DIMEX).
                </p>
                <div>
                  <label htmlFor="identificacion" className={labelCls}>
                    Número de identificación
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      id="identificacion"
                      type="text"
                      value={draft.identificacion}
                      onChange={handleIdentificacionChange}
                      placeholder="Cédula, cédula jurídica o DIMEX"
                      className={`${inputCls} mt-0 flex-1`}
                      disabled={lookupStatus === 'found'}
                    />
                    {lookupStatus !== 'found' && (
                      <button
                        type="button"
                        onClick={buscarIdentificacion}
                        disabled={!tipoDetectado || lookupStatus === 'loading'}
                        className="flex-none rounded-full bg-primary-700 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {lookupStatus === 'loading' ? 'Buscando...' : 'Buscar'}
                      </button>
                    )}
                  </div>
                  {tipoDetectado && (
                    <p className="mt-1 text-xs font-medium text-primary-600">
                      {etiquetaTipo(tipoDetectado)}
                    </p>
                  )}
                </div>

                {lookupStatus === 'found' && (
                  <div className="rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
                    <p>
                      {esJuridica ? 'Razón social:' : 'Nombre:'}{' '}
                      <span className="font-semibold">{draft.nombreSolicitante}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLookupStatus('idle')
                        actualizar('nombreSolicitante', '')
                      }}
                      className="mt-1 text-xs font-medium text-primary-700 hover:underline"
                    >
                      No soy yo, corregir identificación
                    </button>
                  </div>
                )}

                {(lookupStatus === 'not-found' || lookupStatus === 'error') && (
                  <div>
                    {lookupStatus === 'error' && (
                      <p className="mb-1 text-xs text-primary-600">
                        No pudimos verificar automáticamente. Escribí el nombre para continuar.
                      </p>
                    )}
                    {lookupStatus === 'not-found' && tipoDetectado !== 'dimex' && (
                      <p className="mb-1 text-xs text-primary-600">
                        No encontramos datos para esa identificación. Escribí el nombre para
                        continuar.
                      </p>
                    )}
                    <label htmlFor="nombreSolicitante" className={labelCls}>
                      {esJuridica ? 'Razón social' : 'Nombre completo'}
                    </label>
                    <input
                      id="nombreSolicitante"
                      type="text"
                      value={draft.nombreSolicitante}
                      onChange={(e) => actualizar('nombreSolicitante', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}

                {esJuridica && lookupStatus !== 'idle' && lookupStatus !== 'loading' && (
                  <div className="space-y-3 border-t border-primary-100 pt-3">
                    <div>
                      <label htmlFor="cedulaRepresentante" className={labelCls}>
                        Cédula del representante legal
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          id="cedulaRepresentante"
                          type="text"
                          value={draft.cedulaRepresentante}
                          onChange={handleCedulaRepresentanteChange}
                          placeholder="Ej. 1-2345-6789"
                          className={`${inputCls} mt-0 flex-1`}
                        />
                        <button
                          type="button"
                          onClick={buscarRepresentante}
                          disabled={
                            draft.cedulaRepresentante.replace(/\D/g, '').length !== 9 ||
                            lookupRepStatus === 'loading'
                          }
                          className="flex-none rounded-full bg-primary-700 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {lookupRepStatus === 'loading' ? 'Buscando...' : 'Buscar'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="nombreRepresentante" className={labelCls}>
                        Nombre del representante legal
                      </label>
                      <input
                        id="nombreRepresentante"
                        type="text"
                        value={draft.nombreRepresentante}
                        onChange={(e) => actualizar('nombreRepresentante', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {paso === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="telefono" className={labelCls}>
                      Teléfono principal
                    </label>
                    <input
                      id="telefono"
                      type="tel"
                      value={draft.telefono}
                      onChange={(e) => actualizar('telefono', e.target.value)}
                      placeholder="8888-8888"
                      className={inputCls}
                    />
                    {draft.telefono.trim() !== '' && !telefonoValido && (
                      <p className="mt-1 text-xs text-red-500">Formato inválido. Usa 8888-8888</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="telefonoSecundario" className={labelCls}>
                      Teléfono secundario (opcional)
                    </label>
                    <input
                      id="telefonoSecundario"
                      type="tel"
                      value={draft.telefonoSecundario}
                      onChange={(e) => actualizar('telefonoSecundario', e.target.value)}
                      placeholder="8888-8888"
                      className={inputCls}
                    />
                    {draft.telefonoSecundario.trim() !== '' && !telefonoSecundarioValido && (
                      <p className="mt-1 text-xs text-red-500">Formato inválido. Usa 8888-8888</p>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="correo" className={labelCls}>
                    Correo electrónico
                  </label>
                  <input
                    id="correo"
                    type="email"
                    value={draft.correo}
                    onChange={(e) => actualizar('correo', e.target.value)}
                    className={inputCls}
                  />
                  {draft.correo.trim() !== '' && !correoValido && (
                    <p className="mt-1 text-xs text-red-500">El correo no es válido</p>
                  )}
                </div>
                <p className="text-xs text-primary-500">
                  Usaremos estos datos como medio principal de notificación sobre tu solicitud.
                </p>
              </div>
            )}

            {paso === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="provincia" className={labelCls}>
                      Provincia
                    </label>
                    <input
                      id="provincia"
                      type="text"
                      value={draft.provincia}
                      onChange={(e) => actualizar('provincia', e.target.value)}
                      placeholder="Ej. Puntarenas"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="canton" className={labelCls}>
                      Cantón
                    </label>
                    <input
                      id="canton"
                      type="text"
                      value={draft.canton}
                      onChange={(e) => actualizar('canton', e.target.value)}
                      placeholder="Ej. Puntarenas"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="distrito" className={labelCls}>
                      Distrito
                    </label>
                    <input
                      id="distrito"
                      type="text"
                      value={draft.distrito}
                      onChange={(e) => actualizar('distrito', e.target.value)}
                      placeholder="Ej. Paquera"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="direccion" className={labelCls}>
                    Dirección exacta del inmueble
                  </label>
                  <textarea
                    id="direccion"
                    rows={2}
                    value={draft.direccion}
                    onChange={(e) => actualizar('direccion', e.target.value)}
                    placeholder="Ej. 100m norte de la escuela, casa portón verde"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="numeroPlano" className={labelCls}>
                    Número de plano catastrado
                  </label>
                  <input
                    id="numeroPlano"
                    type="text"
                    value={draft.numeroPlano}
                    onChange={(e) => actualizar('numeroPlano', e.target.value)}
                    placeholder="Ej. G-1234567-2024"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {paso === 3 && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="naturalezaInmueble" className={labelCls}>
                    Naturaleza del inmueble
                  </label>
                  <select
                    id="naturalezaInmueble"
                    value={draft.naturalezaInmueble}
                    onChange={(e) => actualizar('naturalezaInmueble', e.target.value)}
                    className={selectCls}
                  >
                    <option value="" disabled>
                      Selecciona una opción
                    </option>
                    {NATURALEZA_INMUEBLE_OPCIONES.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="calidadTitular" className={labelCls}>
                    Calidad del titular respecto al inmueble
                  </label>
                  <select
                    id="calidadTitular"
                    value={draft.calidadTitular}
                    onChange={(e) => actualizar('calidadTitular', e.target.value)}
                    className={selectCls}
                  >
                    <option value="" disabled>
                      Selecciona una opción
                    </option>
                    {CALIDAD_TITULAR_OPCIONES.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="tipoServicio" className={labelCls}>
                      Servicio que solicita
                    </label>
                    <select
                      id="tipoServicio"
                      value={draft.tipoServicio}
                      onChange={(e) => actualizar('tipoServicio', e.target.value)}
                      className={selectCls}
                    >
                      <option value="" disabled>
                        Selecciona
                      </option>
                      {TIPO_SERVICIO_OPCIONES.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="tipoConexion" className={labelCls}>
                      Tipo de conexión
                    </label>
                    <select
                      id="tipoConexion"
                      value={draft.tipoConexion}
                      onChange={(e) => actualizar('tipoConexion', e.target.value)}
                      className={selectCls}
                    >
                      <option value="" disabled>
                        Selecciona
                      </option>
                      {TIPO_CONEXION_OPCIONES.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {paso === 4 && (
              <div className="space-y-3">
                {huboDraftGuardado && (
                  <p className="rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700">
                    Por seguridad del navegador, los documentos no quedan guardados si recargás
                    la página: adjuntalos de nuevo aquí.
                  </p>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cedulaFrente" className={labelCls}>
                      Foto de cédula (frente)
                    </label>
                    <input
                      id="cedulaFrente"
                      type="file"
                      accept={ACCEPT_FOTO_IDENTIFICACION}
                      onChange={handleFileChange(
                        setCedulaFrente,
                        setErrorArchivoCedulaFrente,
                        extensionFotoIdentificacionPermitida,
                        MENSAJE_FORMATO_FOTO_NO_PERMITIDO,
                      )}
                      className="mt-1 w-full text-xs text-primary-700 file:mr-3 file:rounded-full file:border-0 file:bg-primary-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
                    />
                    {errorArchivoCedulaFrente && (
                      <p className="mt-1 text-xs text-red-500">{errorArchivoCedulaFrente}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="cedulaDorso" className={labelCls}>
                      Foto de cédula (dorso)
                    </label>
                    <input
                      id="cedulaDorso"
                      type="file"
                      accept={ACCEPT_FOTO_IDENTIFICACION}
                      onChange={handleFileChange(
                        setCedulaDorso,
                        setErrorArchivoCedulaDorso,
                        extensionFotoIdentificacionPermitida,
                        MENSAJE_FORMATO_FOTO_NO_PERMITIDO,
                      )}
                      className="mt-1 w-full text-xs text-primary-700 file:mr-3 file:rounded-full file:border-0 file:bg-primary-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
                    />
                    {errorArchivoCedulaDorso && (
                      <p className="mt-1 text-xs text-red-500">{errorArchivoCedulaDorso}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="permisosMunicipales" className={labelCls}>
                      Permisos municipales
                    </label>
                    <input
                      id="permisosMunicipales"
                      type="file"
                      accept={ACCEPT_ARCHIVOS_PERMITIDOS}
                      onChange={handleFileChange(setPermisosMunicipales, setErrorArchivoPermisos)}
                      className="mt-1 w-full text-xs text-primary-700 file:mr-3 file:rounded-full file:border-0 file:bg-primary-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
                    />
                    {errorArchivoPermisos && (
                      <p className="mt-1 text-xs text-red-500">{errorArchivoPermisos}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="cartaSolicitud" className={labelCls}>
                      Carta de solicitud
                    </label>
                    <input
                      id="cartaSolicitud"
                      type="file"
                      accept={ACCEPT_ARCHIVOS_PERMITIDOS}
                      onChange={handleFileChange(setCartaSolicitud, setErrorArchivoCarta)}
                      className="mt-1 w-full text-xs text-primary-700 file:mr-3 file:rounded-full file:border-0 file:bg-primary-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
                    />
                    {errorArchivoCarta && (
                      <p className="mt-1 text-xs text-red-500">{errorArchivoCarta}</p>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-primary-500">
                  Cédula: imágenes o PDF. Permisos y carta: imágenes, Word, Excel, PowerPoint o
                  PDF.
                </p>
                <div>
                  <label htmlFor="observaciones" className={labelCls}>
                    Observaciones (opcional)
                  </label>
                  <textarea
                    id="observaciones"
                    rows={2}
                    value={draft.observaciones}
                    onChange={(e) => actualizar('observaciones', e.target.value)}
                    className={inputCls}
                  />
                </div>
                {errorSubmit && (
                  <p className="rounded-lg bg-red-50 p-2 text-xs font-medium text-red-600">
                    {errorSubmit}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Navegación: Atrás / Siguiente (o Enviar en el último paso) */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={irAtras}
              disabled={paso === 0}
              className="rounded-full border border-primary-200 px-5 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Atrás
            </button>
            {paso < TOTAL_PASOS - 1 ? (
              <button
                type="button"
                onClick={irSiguiente}
                disabled={!pasoActualValido}
                className="rounded-full bg-primary-700 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!paso4Valido || enviando}
                className="rounded-full bg-primary-700 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default Afiliacion
