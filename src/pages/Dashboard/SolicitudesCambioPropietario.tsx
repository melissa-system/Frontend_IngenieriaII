import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  nombreVisible,
  obtenerAbonados,
  type Abonado,
} from '../../components/Services/abonados.service'
import {
  obtenerPerfil,
  type PerfilCompleto,
} from '../../components/Services/perfil.service'
import {
  cambiarEstadoSolicitudCambioPropietario,
  crearSolicitudCambioPropietario,
  obtenerSolicitudesCambioPropietario,
  MOTIVOS_TRASPASO,
  type SolicitudCambioPropietario,
  type EstadoSolicitud,
  type MotivoTraspaso,
} from '../../components/Services/cambioPropietario.service'
import { descargarArchivo, extensionDesdeUrl } from '../../lib/descargarArchivo'

const ESTADO_LABELS: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  aprobado: 'Aprobada',
  rechazado: 'Rechazada',
}

const ACCEPT_DOCUMENTO = '.pdf,.jpg,.jpeg,.png'
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatearCedula(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 12)
  if (digitos.length === 0) return ''
  const primer = digitos[0]
  if (primer === '1' || primer === '2') {
    if (digitos.length <= 1) return digitos
    if (digitos.length <= 5) return `${digitos.slice(0, 1)}-${digitos.slice(1)}`
    return `${digitos.slice(0, 1)}-${digitos.slice(1, 5)}-${digitos.slice(5, 9)}`
  }
  if (primer === '3') {
    if (digitos.length <= 1) return digitos
    if (digitos.length <= 4) return `${digitos.slice(0, 1)}-${digitos.slice(1)}`
    return `${digitos.slice(0, 1)}-${digitos.slice(1, 4)}-${digitos.slice(4, 10)}`
  }
  return digitos
}

function formatearTelefono(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8)
  if (digitos.length <= 4) return digitos
  return `${digitos.slice(0, 4)}-${digitos.slice(4)}`
}

function estadoColor(estado: EstadoSolicitud): string {
  switch (estado) {
    case 'pendiente':
      return 'bg-yellow-100 text-yellow-800'
    case 'en_proceso':
      return 'bg-blue-100 text-blue-800'
    case 'aprobado':
      return 'bg-green-100 text-green-800'
    case 'rechazado':
      return 'bg-red-100 text-red-800'
  }
}

function formatearFecha(fecha: string): string {
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
}

function BadgeEstado({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoColor(
        estado,
      )}`}
    >
      {ESTADO_LABELS[estado]}
    </span>
  )
}

function EmptyState({
  titulo,
  descripcion,
}: {
  titulo: string
  descripcion: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 bg-white py-16 text-center shadow-sm">
      <p className="text-lg font-medium text-primary-700">{titulo}</p>
      <p className="mt-1 text-sm text-primary-400">{descripcion}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente Drag-and-Drop / Selector de Archivos con vista previa inmediata
// ---------------------------------------------------------------------------
function FileDropZone({
  archivo,
  archivoPreview,
  onFileSelect,
  onRemoveFile,
  errorArchivo,
}: {
  archivo: File | null
  archivoPreview: string | null
  onFileSelect: (file: File) => void
  onRemoveFile: () => void
  errorArchivo?: string
}) {
  const [arrastrando, setArrastrando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setArrastrando(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setArrastrando(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setArrastrando(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const pesoEnMB = archivo ? (archivo.size / (1024 * 1024)).toFixed(2) : '0'

  return (
    <div>
      <label className="block text-sm font-medium text-primary-700">
        Documento legal de respaldo (Escritura pública o certificación) *
      </label>
      <p className="mt-0.5 text-xs text-primary-500">
        Subí la escritura de traspaso o certificación de propiedad en formato PDF o imagen (.jpg, .jpeg, .png). Máximo 5 MB.
      </p>

      {!archivo ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            arrastrando
              ? 'border-primary-500 bg-primary-50'
              : errorArchivo
              ? 'border-red-300 bg-red-50/50 hover:bg-red-50'
              : 'border-primary-200 bg-gray-50/50 hover:bg-primary-50/40'
          }`}
        >
          <svg
            className="h-10 w-10 text-primary-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-sm font-medium text-primary-700">
            Arrastrá y soltá el archivo aquí o{' '}
            <span className="text-primary-600 underline">examiná tus archivos</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">PDF, JPG o PNG hasta 5 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_DOCUMENTO}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50/40 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            {archivoPreview ? (
              <img
                src={archivoPreview}
                alt="Vista previa"
                className="h-16 w-16 rounded-lg border border-primary-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 shadow-sm">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h-2v1h2v1.5h-2v1.5h3v1.5h-4.5V8h4.5v3.5zm4 5h-1.5V8h2.5c1.1 0 2 .9 2 2v3c0 1.1-.9 2-2 2h-1zm4-3.5h-2v2h-1.5V8H18c1.1 0 2 .9 2 2v1.5c0 1.1-.9 2-2 2z" />
                </svg>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-primary-900 line-clamp-1">
                {archivo.name}
              </p>
              <p className="text-xs text-primary-500">{pesoEnMB} MB</p>
              <span className="mt-1 inline-flex items-center rounded bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                Listo para enviar
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemoveFile}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-50"
          >
            Descartar archivo
          </button>
        </div>
      )}

      {errorArchivo && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{errorArchivo}</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal de Confirmación con código de seguimiento SOL-PRO-YYYY-XXXX
// ---------------------------------------------------------------------------
function ModalConfirmacion({
  codigo,
  onCerrar,
}: {
  codigo: string
  onCerrar: () => void
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

        <h3 className="mt-4 text-xl font-bold text-primary-900">
          ¡Solicitud Registrada con Éxito!
        </h3>
        <p className="mt-2 text-sm text-primary-600">
          Tu trámite de <strong>Cambio de Propietario (Cesión de Derechos)</strong> ha sido recibido por la administración de la ASADA.
        </p>

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

// ---------------------------------------------------------------------------
// Componente Principal
// ---------------------------------------------------------------------------
export default function SolicitudesCambioPropietario() {
  const { rolEfectivo } = useAuth()
  const esAbonado = rolEfectivo === 'Abonado'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Cambio de Propietario
        </h1>
        <p className="mt-1 text-sm text-primary-500">
          {esAbonado
            ? 'Trámite de cesión de derechos de paja de agua hacia un nuevo propietario'
            : 'Gestión y resolución de solicitudes de cesión de derechos de paja de agua'}
        </p>
      </div>

      {esAbonado ? <VistaAbonado /> : <VistaAdministrador />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista del Abonado
// ---------------------------------------------------------------------------
function VistaAbonado() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null)
  const [cargandoPerfil, setCargandoPerfil] = useState(true)

  // Datos del nuevo propietario
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [cedulaNueva, setCedulaNueva] = useState('')
  const [telefonoNuevo, setTelefonoNuevo] = useState('')
  const [correoNuevo, setCorreoNuevo] = useState('')
  const [motivoTraspaso, setMotivoTraspaso] = useState<MotivoTraspaso | ''>('')
  const [justificacion, setJustificacion] = useState('')

  // Archivo
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null)
  const [errorArchivo, setErrorArchivo] = useState('')

  // Estado
  const [solicitudes, setSolicitudes] = useState<SolicitudCambioPropietario[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const lista = await obtenerSolicitudesCambioPropietario()
      setSolicitudes(lista)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar tus solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    obtenerPerfil()
      .then(setPerfil)
      .catch(() => setError('No se pudo cargar la información de tu perfil.'))
      .finally(() => setCargandoPerfil(false))
    cargar()
  }, [cargar])

  const nombreTitular = useMemo(() => {
    const partes = [perfil?.nombre, perfil?.apellido1, perfil?.apellido2].filter(Boolean)
    if (partes.length > 0) return partes.join(' ')
    return perfil?.nombre || user?.nombre || 'No disponible'
  }, [perfil, user])

  const cedulaTitular = perfil?.cedula || 'No disponible'
  const numeroAbonadoTitular = user?.vinculos?.abonado?.id
    ? `ABN-${String(user.vinculos.abonado.id).padStart(4, '0')}`
    : 'Activo'

  const tieneAbierta = useMemo(
    () =>
      solicitudes.some((s) => s.estado === 'pendiente' || s.estado === 'en_proceso'),
    [solicitudes],
  )

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_BYTES) {
      setErrorArchivo('El archivo no puede superar los 5 MB.')
      setArchivo(null)
      setArchivoPreview(null)
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      setErrorArchivo('Formato inválido. Solo se admiten archivos .pdf, .jpg, .jpeg o .png.')
      setArchivo(null)
      setArchivoPreview(null)
      return
    }
    setErrorArchivo('')
    setArchivo(file)
    if (file.type.startsWith('image/')) {
      setArchivoPreview(URL.createObjectURL(file))
    } else {
      setArchivoPreview(null)
    }
  }

  const handleRemoveFile = () => {
    setArchivo(null)
    setArchivoPreview(null)
    setErrorArchivo('')
  }

  const limpiarFormulario = () => {
    setNombreNuevo('')
    setCedulaNueva('')
    setTelefonoNuevo('')
    setCorreoNuevo('')
    setMotivoTraspaso('')
    setJustificacion('')
    setArchivo(null)
    setArchivoPreview(null)
    setErrorArchivo('')
  }

  // Validación reactiva para habilitar el botón
  const formularioValido = useMemo(() => {
    return (
      nombreNuevo.trim().length >= 5 &&
      cedulaNueva.trim().length >= 9 &&
      telefonoNuevo.trim().length >= 8 &&
      CORREO_REGEX.test(correoNuevo.trim()) &&
      motivoTraspaso !== '' &&
      justificacion.trim().length >= 10 &&
      justificacion.trim().length <= 255 &&
      archivo !== null &&
      !tieneAbierta
    )
  }, [
    nombreNuevo,
    cedulaNueva,
    telefonoNuevo,
    correoNuevo,
    motivoTraspaso,
    justificacion,
    archivo,
    tieneAbierta,
  ])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formularioValido || !archivo || !motivoTraspaso) return

    setEnviando(true)
    try {
      const resp = await crearSolicitudCambioPropietario({
        nombreNuevoPropietario: nombreNuevo.trim(),
        cedulaNuevoPropietario: cedulaNueva.trim(),
        telefonoNuevoPropietario: telefonoNuevo.trim(),
        correoNuevoPropietario: correoNuevo.trim(),
        motivoTraspaso: motivoTraspaso as MotivoTraspaso,
        justificacion: justificacion.trim(),
        documentoSoporte: archivo,
      })
      setCodigoGenerado(resp.codigo_solicitud)
      limpiarFormulario()
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6">
      {codigoGenerado && (
        <ModalConfirmacion
          codigo={codigoGenerado}
          onCerrar={() => setCodigoGenerado(null)}
        />
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {tieneAbierta && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Actualmente tenés una solicitud de cambio de propietario en proceso. No podés crear otra hasta que sea resuelta.
        </div>
      )}

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm space-y-6"
      >
        <div className="border-b border-primary-100 pb-4">
          <h2 className="text-lg font-semibold text-primary-900">
            Formulario de Traspaso de Paja de Agua
          </h2>
          <p className="text-xs text-primary-500 mt-1">
            Los datos del titular actual se toman de tu cuenta. Completá la información del nuevo propietario y adjuntá el documento legal correspondiente.
          </p>
        </div>

        {/* Sección 1: Datos del Titular Actual (Solo lectura) */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-700">
            1. Titular Actual Registrado
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-500">
                Nombre del Titular
              </label>
              <input
                type="text"
                disabled
                value={cargandoPerfil ? 'Cargando…' : nombreTitular}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">
                Cédula del Titular
              </label>
              <input
                type="text"
                disabled
                value={cargandoPerfil ? 'Cargando…' : cedulaTitular}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">
                Número de Abonado
              </label>
              <input
                type="text"
                disabled
                value={cargandoPerfil ? 'Cargando…' : numeroAbonadoTitular}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Datos del Nuevo Propietario (Cesionario) */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-700">
            2. Datos del Nuevo Propietario (Cesionario)
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                disabled={tieneAbierta}
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                placeholder="Ej. Roberto Fernández Gómez"
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
              {nombreNuevo.length > 0 && nombreNuevo.trim().length < 5 && (
                <p className="mt-1 text-xs text-red-500">Mínimo 5 caracteres</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700">
                Cédula de Identidad *
              </label>
              <input
                type="text"
                required
                disabled={tieneAbierta}
                value={cedulaNueva}
                onChange={(e) => setCedulaNueva(formatearCedula(e.target.value))}
                placeholder="1-2345-6789 o 3-101-123456"
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
              {cedulaNueva.length > 0 && cedulaNueva.trim().length < 9 && (
                <p className="mt-1 text-xs text-red-500">Ingresá una identificación válida</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700">
                Teléfono de Contacto *
              </label>
              <input
                type="tel"
                required
                disabled={tieneAbierta}
                value={telefonoNuevo}
                onChange={(e) => setTelefonoNuevo(formatearTelefono(e.target.value))}
                placeholder="8888-8888"
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                disabled={tieneAbierta}
                value={correoNuevo}
                onChange={(e) => setCorreoNuevo(e.target.value)}
                placeholder="nuevo.titular@correo.com"
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
              {correoNuevo.length > 0 && !CORREO_REGEX.test(correoNuevo.trim()) && (
                <p className="mt-1 text-xs text-red-500">Formato de correo no válido</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-primary-700">
                Motivo del Traspaso *
              </label>
              <select
                required
                disabled={tieneAbierta}
                value={motivoTraspaso}
                onChange={(e) => setMotivoTraspaso(e.target.value as MotivoTraspaso)}
                className="mt-1 w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="">-- Seleccioná un motivo --</option>
                {MOTIVOS_TRASPASO.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-primary-700">
                  Justificación del Traspaso *
                </label>
                <span className="text-xs text-gray-400">
                  {justificacion.trim().length} / 255 (mínimo 10)
                </span>
              </div>
              <textarea
                required
                disabled={tieneAbierta}
                rows={3}
                value={justificacion}
                maxLength={255}
                onChange={(e) => setJustificacion(e.target.value)}
                placeholder="Explicá brevemente las razones legales del traspaso..."
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
              {justificacion.length > 0 && justificacion.trim().length < 10 && (
                <p className="mt-1 text-xs text-red-500">
                  La justificación debe tener al menos 10 caracteres.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sección 3: Subida de Documento con Drag-and-Drop */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-700 mb-2">
            3. Documentación de Respaldo
          </h3>
          <FileDropZone
            archivo={archivo}
            archivoPreview={archivoPreview}
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
            errorArchivo={errorArchivo}
          />
        </div>

        {/* Botón de envío */}
        <div className="flex justify-end pt-4 border-t border-primary-100">
          <button
            type="submit"
            disabled={!formularioValido || enviando}
            className="rounded-full bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? 'Enviando solicitud…' : 'Enviar Solicitud de Traspaso'}
          </button>
        </div>
      </form>

      {/* Historial de Solicitudes del Abonado */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-primary-900">
          Mis Solicitudes de Cambio de Propietario
        </h2>

        {cargando ? (
          <div className="py-12 text-center text-sm text-primary-500">
            Cargando solicitudes…
          </div>
        ) : solicitudes.length === 0 ? (
          <EmptyState
            titulo="Sin solicitudes registradas"
            descripcion="Cuando generes una solicitud de cambio de propietario aparecerá en este listado."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-primary-800">
              <thead className="bg-primary-50 text-xs font-semibold uppercase text-primary-600">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nuevo Propietario</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {solicitudes.map((s) => (
                  <tr key={s.id} className="hover:bg-primary-50/40">
                    <td className="px-4 py-3 font-mono font-medium text-primary-900">
                      {s.codigo_solicitud}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary-900">
                        {s.nombre_nuevo_propietario}
                      </p>
                      <p className="text-xs text-primary-500">
                        {s.cedula_nuevo_propietario}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-primary-700">
                      {s.motivo_traspaso}
                    </td>
                    <td className="px-4 py-3">
                      {s.documento_soporte_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            descargarArchivo(
                              s.documento_soporte_url!,
                              `documento-soporte${extensionDesdeUrl(
                                s.documento_soporte_url!,
                              )}`,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                        >
                          Ver documento
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Sin archivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-primary-500">
                      {formatearFecha(s.fecha_creacion)}
                    </td>
                    <td className="px-4 py-3">
                      <BadgeEstado estado={s.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista del Administrador (Atención en Ventanilla y Gestión)
// ---------------------------------------------------------------------------
function VistaAdministrador() {
  const [solicitudes, setSolicitudes] = useState<SolicitudCambioPropietario[]>([])
  const [abonados, setAbonados] = useState<Abonado[]>([])
  const [cargando, setCargando] = useState(true)
  const [cargandoAbonados, setCargandoAbonados] = useState(true)

  // Búsqueda typeahead de abonados
  const [busqueda, setBusqueda] = useState('')
  const [abonadoElegido, setAbonadoElegido] = useState<Abonado | null>(null)

  // Datos formulario ventanilla
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [cedulaNueva, setCedulaNueva] = useState('')
  const [telefonoNuevo, setTelefonoNuevo] = useState('')
  const [correoNuevo, setCorreoNuevo] = useState('')
  const [motivoTraspaso, setMotivoTraspaso] = useState<MotivoTraspaso | ''>('')
  const [justificacion, setJustificacion] = useState('')

  // Archivo
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null)
  const [errorArchivo, setErrorArchivo] = useState('')

  // Gestión de estado modal
  const [detalle, setDetalle] = useState<SolicitudCambioPropietario | null>(null)
  // Mínimo de caracteres del motivo al rechazar. Un "no" o un "." no le
  // sirven al abonado, que recibe este texto por correo como única
  // explicación del rechazo.
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const MIN_MOTIVO = 10
  const motivoValido = motivoRechazo.trim().length >= MIN_MOTIVO
  const [gestionando, setGestionando] = useState(false)

  // Notificaciones
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const lista = await obtenerSolicitudesCambioPropietario()
      setSolicitudes(lista)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
    obtenerAbonados()
      .then(setAbonados)
      .catch(() => setError('No se pudieron cargar los abonados del sistema.'))
      .finally(() => setCargandoAbonados(false))
  }, [cargar])

  const abonadosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return []
    return abonados.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        a.cedula.toLowerCase().includes(q) ||
        a.numero_abonado.toLowerCase().includes(q),
    )
  }, [busqueda, abonados])

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_BYTES) {
      setErrorArchivo('El archivo no puede superar los 5 MB.')
      setArchivo(null)
      setArchivoPreview(null)
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      setErrorArchivo('Formato inválido. Solo se admiten archivos .pdf, .jpg, .jpeg o .png.')
      setArchivo(null)
      setArchivoPreview(null)
      return
    }
    setErrorArchivo('')
    setArchivo(file)
    if (file.type.startsWith('image/')) {
      setArchivoPreview(URL.createObjectURL(file))
    } else {
      setArchivoPreview(null)
    }
  }

  const handleRemoveFile = () => {
    setArchivo(null)
    setArchivoPreview(null)
    setErrorArchivo('')
  }

  const limpiarFormulario = () => {
    setAbonadoElegido(null)
    setBusqueda('')
    setNombreNuevo('')
    setCedulaNueva('')
    setTelefonoNuevo('')
    setCorreoNuevo('')
    setMotivoTraspaso('')
    setJustificacion('')
    setArchivo(null)
    setArchivoPreview(null)
    setErrorArchivo('')
  }

  const formularioValido = useMemo(() => {
    return (
      abonadoElegido !== null &&
      abonadoElegido.estado === 'Activo' &&
      nombreNuevo.trim().length >= 5 &&
      cedulaNueva.trim().length >= 9 &&
      telefonoNuevo.trim().length >= 8 &&
      CORREO_REGEX.test(correoNuevo.trim()) &&
      motivoTraspaso !== '' &&
      justificacion.trim().length >= 10 &&
      justificacion.trim().length <= 255 &&
      archivo !== null
    )
  }, [
    abonadoElegido,
    nombreNuevo,
    cedulaNueva,
    telefonoNuevo,
    correoNuevo,
    motivoTraspaso,
    justificacion,
    archivo,
  ])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (!formularioValido || !abonadoElegido || !archivo || !motivoTraspaso) return

    setEnviando(true)
    try {
      const resp = await crearSolicitudCambioPropietario({
        idAbonado: Number(abonadoElegido.id),
        nombreNuevoPropietario: nombreNuevo.trim(),
        cedulaNuevoPropietario: cedulaNueva.trim(),
        telefonoNuevoPropietario: telefonoNuevo.trim(),
        correoNuevoPropietario: correoNuevo.trim(),
        motivoTraspaso: motivoTraspaso as MotivoTraspaso,
        justificacion: justificacion.trim(),
        documentoSoporte: archivo,
      })
      setCodigoGenerado(resp.codigo_solicitud)
      setMensaje(`Solicitud ${resp.codigo_solicitud} registrada correctamente en ventanilla.`)
      limpiarFormulario()
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  const gestionar = async (nuevoEstado: 'en_proceso' | 'aprobado' | 'rechazado') => {
    if (!detalle) return
    setGestionando(true)
    setError('')
    setMensaje('')

    try {
      await cambiarEstadoSolicitudCambioPropietario(detalle.id, {
        estado: nuevoEstado,
        motivoRechazo: nuevoEstado === 'rechazado' ? motivoRechazo : undefined,
      })
      setMensaje(
        nuevoEstado === 'aprobado'
          ? `Solicitud ${detalle.codigo_solicitud} aprobada exitosamente. Se traspasaron los datos y se notificó al nuevo propietario.`
          : `Solicitud ${detalle.codigo_solicitud} actualizada a "${ESTADO_LABELS[nuevoEstado]}".`,
      )
      setDetalle(null)
      setMotivoRechazo('')
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.')
    } finally {
      setGestionando(false)
    }
  }

  return (
    <div className="space-y-8">
      {codigoGenerado && (
        <ModalConfirmacion
          codigo={codigoGenerado}
          onCerrar={() => setCodigoGenerado(null)}
        />
      )}

      {mensaje && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Formulario Ventanilla Asistida */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm space-y-6"
      >
        <div className="border-b border-primary-100 pb-4">
          <h2 className="text-lg font-semibold text-primary-900">
            Atención en Ventanilla: Trámite de Cambio de Propietario
          </h2>
          <p className="text-xs text-primary-500 mt-1">
            Buscá al abonado titular en el sistema, ingresá los datos del cesionario y adjuntá el documento legal de respaldo.
          </p>
        </div>

        {/* Buscador Typeahead */}
        <div>
          <label className="block text-sm font-medium text-primary-700">
            Abonado Titular Actual *
          </label>
          {abonadoElegido ? (
            <div className="mt-1.5 flex items-center justify-between rounded-xl border border-green-200 bg-green-50/60 p-3 shadow-sm">
              <div>
                <p className="text-sm font-bold text-primary-900">
                  {nombreVisible(abonadoElegido)}
                </p>
                <p className="text-xs text-primary-600">
                  Cédula: {abonadoElegido.cedula} | N° Abonado: {abonadoElegido.numero_abonado} | Estado:{' '}
                  <span className="font-semibold text-green-700">{abonadoElegido.estado}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbonadoElegido(null)}
                className="rounded-md border border-primary-200 bg-white px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative mt-1.5">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escribí el nombre, cédula o número de abonado para buscar..."
                className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
              {busqueda.trim() !== '' && (
                <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-primary-200 bg-white shadow-xl">
                  {cargandoAbonados ? (
                    <li className="px-4 py-3 text-xs text-primary-400">Cargando abonados…</li>
                  ) : abonadosFiltrados.length === 0 ? (
                    <li className="px-4 py-3 text-xs text-primary-400">
                      No se encontraron abonados que coincidan con «{busqueda}».
                    </li>
                  ) : (
                    abonadosFiltrados.map((a) => (
                      <li
                        key={a.id}
                        onClick={() => {
                          setAbonadoElegido(a)
                          setBusqueda('')
                        }}
                        className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition hover:bg-primary-50 ${
                          a.estado !== 'Activo' ? 'opacity-60 bg-gray-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div>
                          <p className="font-medium text-primary-900">{nombreVisible(a)}</p>
                          <p className="text-xs text-primary-500">
                            Cédula: {a.cedula} • N°: {a.numero_abonado}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            a.estado === 'Activo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {a.estado}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Datos Cesionario */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Nombre Completo del Nuevo Propietario *
            </label>
            <input
              type="text"
              required
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="Ej. Maria Elena Solano"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700">
              Cédula de Identidad *
            </label>
            <input
              type="text"
              required
              value={cedulaNueva}
              onChange={(e) => setCedulaNueva(formatearCedula(e.target.value))}
              placeholder="1-2345-6789 o 3-101-123456"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700">
              Teléfono *
            </label>
            <input
              type="tel"
              required
              value={telefonoNuevo}
              onChange={(e) => setTelefonoNuevo(formatearTelefono(e.target.value))}
              placeholder="8888-8888"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              value={correoNuevo}
              onChange={(e) => setCorreoNuevo(e.target.value)}
              placeholder="nuevo.titular@correo.com"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-primary-700">
              Motivo del Traspaso *
            </label>
            <select
              required
              value={motivoTraspaso}
              onChange={(e) => setMotivoTraspaso(e.target.value as MotivoTraspaso)}
              className="mt-1 w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="">-- Seleccioná un motivo --</option>
              {MOTIVOS_TRASPASO.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-primary-700">
                Justificación del Traspaso *
              </label>
              <span className="text-xs text-gray-400">
                {justificacion.trim().length} / 255 (mínimo 10)
              </span>
            </div>
            <textarea
              required
              rows={3}
              maxLength={255}
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder="Descripción del documento o trámite de traspaso formal..."
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Drag and Drop Documento */}
        <FileDropZone
          archivo={archivo}
          archivoPreview={archivoPreview}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          errorArchivo={errorArchivo}
        />

        <div className="flex justify-end pt-4 border-t border-primary-100">
          <button
            type="submit"
            disabled={!formularioValido || enviando}
            className="rounded-full bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? 'Registrando en ventanilla…' : 'Registrar Solicitud'}
          </button>
        </div>
      </form>

      {/* Listado y Gestión de Solicitudes */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-primary-900">
          Todas las Solicitudes de Cambio de Propietario
        </h2>

        {cargando ? (
          <div className="py-12 text-center text-sm text-primary-500">
            Cargando solicitudes…
          </div>
        ) : solicitudes.length === 0 ? (
          <EmptyState
            titulo="Sin solicitudes registradas"
            descripcion="Actualmente no hay trámites de cambio de propietario en el sistema."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-primary-800">
              <thead className="bg-primary-50 text-xs font-semibold uppercase text-primary-600">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Titular Anterior</th>
                  <th className="px-4 py-3">Nuevo Propietario</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {solicitudes.map((s) => (
                  <tr key={s.id} className="hover:bg-primary-50/40">
                    <td className="px-4 py-3 font-mono font-medium text-primary-900">
                      {s.codigo_solicitud}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary-900">{s.nombre_abonado}</p>
                      <p className="text-xs text-primary-500">
                        {s.cedula} • N° {s.numero_abonado}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary-900">
                        {s.nombre_nuevo_propietario}
                      </p>
                      <p className="text-xs text-primary-500">
                        {s.cedula_nuevo_propietario} • {s.telefono_nuevo_propietario}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-primary-700">
                      {s.motivo_traspaso}
                    </td>
                    <td className="px-4 py-3">
                      {s.documento_soporte_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            descargarArchivo(
                              s.documento_soporte_url!,
                              `documento-soporte${extensionDesdeUrl(
                                s.documento_soporte_url!,
                              )}`,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                        >
                          Descargar
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Sin archivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <BadgeEstado estado={s.estado} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setDetalle(s)
                          setMotivoRechazo(s.motivo_rechazo ?? '')
                        }}
                        className="rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 shadow-sm"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle y Gestión */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-primary-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-primary-900">
                  Gestión de Solicitud {detalle.codigo_solicitud}
                </h3>
                <span className="text-xs text-primary-500">
                  Registrada el {formatearFecha(detalle.fecha_creacion)}
                </span>
              </div>
              <BadgeEstado estado={detalle.estado} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Titular Actual
                </p>
                <p className="font-bold text-primary-900">{detalle.nombre_abonado}</p>
                <p className="text-xs text-primary-600">Cédula: {detalle.cedula}</p>
                <p className="text-xs text-primary-600">
                  N° Abonado: {detalle.numero_abonado}
                </p>
              </div>

              <div className="rounded-xl bg-primary-50/50 p-3">
                <p className="text-xs font-semibold uppercase text-primary-700">
                  Nuevo Propietario (Cesionario)
                </p>
                <p className="font-bold text-primary-900">
                  {detalle.nombre_nuevo_propietario}
                </p>
                <p className="text-xs text-primary-600">
                  Cédula: {detalle.cedula_nuevo_propietario}
                </p>
                <p className="text-xs text-primary-600">
                  Tel: {detalle.telefono_nuevo_propietario} | Correo:{' '}
                  {detalle.correo_nuevo_propietario}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Motivo y Justificación
                </p>
                <p className="text-sm font-medium text-primary-900 mt-0.5">
                  <strong>Motivo:</strong> {detalle.motivo_traspaso}
                </p>
                <p className="text-sm text-primary-700 mt-1 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  "{detalle.justificacion}"
                </p>
              </div>

              {detalle.documento_soporte_url && (
                <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 p-3">
                  <span className="text-xs font-semibold text-primary-800">
                    Documento Legal Adjunto
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      descargarArchivo(
                        detalle.documento_soporte_url!,
                        `documento-soporte${extensionDesdeUrl(
                          detalle.documento_soporte_url!,
                        )}`,
                      )
                    }
                    className="rounded-md bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-800"
                  >
                    Ver / Descargar documento
                  </button>
                </div>
              )}
            </div>

            {/* Acciones si la solicitud está abierta */}
            {detalle.estado !== 'aprobado' && detalle.estado !== 'rechazado' ? (
              <div className="space-y-4 border-t border-primary-100 pt-4">
                <div>
                  <label className="block text-xs font-medium text-primary-700">
                    Motivo de resolución / rechazo (obligatorio si rechaza)
                  </label>
                  <textarea
                    rows={2}
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    placeholder="Detallá la justificación de aprobación o rechazo..."
                    className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
 
                  {motivoRechazo.trim().length > 0 && !motivoValido && (
                    <p className="mt-1 text-xs text-amber-600">
                      Escribe al menos {MIN_MOTIVO} caracteres para poder
                      rechazar (llevas {motivoRechazo.trim().length}).
                    </p>
                  )}
                </div>
 
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDetalle(null)}
                    disabled={gestionando}
                    className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  {detalle.estado === 'pendiente' && (
                    <button
                      type="button"
                      disabled={gestionando}
                      onClick={() => gestionar('en_proceso')}
                      className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {gestionando ? 'Guardando...' : 'Poner En Proceso'}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={gestionando || !motivoValido}
                    onClick={() => gestionar('rechazado')}
                    className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {gestionando ? 'Guardando...' : 'Rechazar'}
                  </button>
                  <button
                    type="button"
                    disabled={gestionando}
                    onClick={() => gestionar('aprobado')}
                    className="rounded-full bg-green-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {gestionando ? 'Guardando...' : 'Aprobar Traspaso'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-primary-100 pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetalle(null)}
                  className="rounded-full bg-primary-700 px-5 py-2 text-xs font-semibold text-white hover:bg-primary-800"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
