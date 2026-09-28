import {
  useCallback,
  useEffect,
  useMemo,
  useState,
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
import {
  FileDropZone,
  validarDocumento,
} from '../../components/common/FileDropZone'
import ModalConfirmacion from '../../components/common/ModalConfirmacion'
import Toast from '../../components/Dashboard/Toast'

const ESTADO_LABELS: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  aprobado: 'Aprobada',
  rechazado: 'Rechazada',
}

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

  // Alterna entre ver el historial y generar una solicitud nueva, en vez de
  // mostrar ambas cosas apiladas en la misma pantalla.
  const [vista, setVista] = useState<'lista' | 'crear'>('lista')

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
    const errorMsg = validarDocumento(file)
    if (errorMsg) {
      setErrorArchivo(errorMsg)
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const nombre = nombreNuevo.trim()
    const cedula = cedulaNueva.trim()
    const telefono = telefonoNuevo.trim()
    const correo = correoNuevo.trim()
    const just = justificacion.trim()
    if (nombre.length < 5) {
      setError('El nombre del nuevo propietario es obligatorio.')
      return
    }
    if (cedula.length < 9) {
      setError('La cédula del nuevo propietario es obligatoria.')
      return
    }
    if (telefono.length < 8) {
      setError('El teléfono de contacto del nuevo propietario es obligatorio.')
      return
    }
    if (!CORREO_REGEX.test(correo)) {
      setError('El correo electrónico del nuevo propietario no es válido.')
      return
    }
    if (motivoTraspaso === '') {
      setError('Seleccioná el motivo del traspaso.')
      return
    }
    if (just.length < 10) {
      setError('La justificación debe tener al menos 10 caracteres.')
      return
    }
    if (!archivo) {
      setError('Debes adjuntar el documento legal de respaldo del traspaso.')
      return
    }

    setEnviando(true)
    try {
      const resp = await crearSolicitudCambioPropietario({
        nombreNuevoPropietario: nombre,
        cedulaNuevoPropietario: cedula,
        telefonoNuevoPropietario: telefono,
        correoNuevoPropietario: correo,
        motivoTraspaso: motivoTraspaso as MotivoTraspaso,
        justificacion: just,
        documentoSoporte: archivo,
      })
      setCodigoGenerado(resp.codigo_solicitud)
      limpiarFormulario()
      await cargar()
      setVista('lista')
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
          titulo="¡Solicitud Registrada con Éxito!"
          descripcion={
            <>
              Tu trámite de <strong>Cambio de Propietario (Cesión de Derechos)</strong> ha sido recibido por la administración de la ASADA.
            </>
          }
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

      <div className="flex gap-6 border-b border-primary-100">
        <button
          type="button"
          onClick={() => setVista('lista')}
          className={`border-b-2 pb-2 text-sm font-semibold transition-colors ${
            vista === 'lista'
              ? 'border-primary-700 text-primary-900'
              : 'border-transparent text-primary-400 hover:text-primary-700'
          }`}
        >
          Mis solicitudes
        </button>
        <button
          type="button"
          onClick={() => setVista('crear')}
          className={`border-b-2 pb-2 text-sm font-semibold transition-colors ${
            vista === 'crear'
              ? 'border-primary-700 text-primary-900'
              : 'border-transparent text-primary-400 hover:text-primary-700'
          }`}
        >
          Nueva solicitud
        </button>
      </div>

      {vista === 'crear' && (
      <>
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
            label="Documento legal de respaldo (Escritura pública o certificación)"
            ayuda="Subí la escritura de traspaso o certificación de propiedad en formato PDF o imagen (.jpg, .jpeg, .png). Máximo 5 MB."
            obligatorio
          />
        </div>

        {/* Botones */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-primary-100">
          <button
            type="submit"
            disabled={tieneAbierta || enviando}
            className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? 'Enviando solicitud…' : 'Enviar Solicitud de Traspaso'}
          </button>
          <button
            type="button"
            onClick={() => {
              limpiarFormulario()
              setError('')
            }}
            className="rounded-lg border border-primary-200 px-5 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            Cancelar
          </button>
        </div>
      </form>
      </>
      )}

      {vista === 'lista' && (
      <>
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
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Código</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Nuevo Propietario</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Motivo</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Documento</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
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
      </>
      )}
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
  // Primer clic en "Rechazar" solo despliega el campo de motivo; el segundo
  // (ya con motivo válido) confirma el rechazo.
  const [mostrarMotivo, setMostrarMotivo] = useState(false)

  // Notificaciones
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null)

  // Alterna entre ver el listado y generar una solicitud nueva, en vez de
  // mostrar ambas cosas apiladas en la misma pantalla.
  const [vista, setVista] = useState<'lista' | 'crear'>('lista')

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
    const errorMsg = validarDocumento(file)
    if (errorMsg) {
      setErrorArchivo(errorMsg)
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (!abonadoElegido || abonadoElegido.estado !== 'Activo') {
      setError('Seleccioná un abonado activo para la solicitud.')
      return
    }
    const nombre = nombreNuevo.trim()
    const cedula = cedulaNueva.trim()
    const telefono = telefonoNuevo.trim()
    const correo = correoNuevo.trim()
    const just = justificacion.trim()
    if (nombre.length < 5) {
      setError('El nombre del nuevo propietario es obligatorio.')
      return
    }
    if (cedula.length < 9) {
      setError('La cédula del nuevo propietario es obligatoria.')
      return
    }
    if (telefono.length < 8) {
      setError('El teléfono de contacto del nuevo propietario es obligatorio.')
      return
    }
    if (!CORREO_REGEX.test(correo)) {
      setError('El correo electrónico del nuevo propietario no es válido.')
      return
    }
    if (motivoTraspaso === '') {
      setError('Seleccioná el motivo del traspaso.')
      return
    }
    if (just.length < 10) {
      setError('La justificación debe tener al menos 10 caracteres.')
      return
    }
    if (!archivo) {
      setError('Debes adjuntar el documento legal de respaldo del traspaso.')
      return
    }

    setEnviando(true)
    try {
      const resp = await crearSolicitudCambioPropietario({
        idAbonado: Number(abonadoElegido.id),
        nombreNuevoPropietario: nombre,
        cedulaNuevoPropietario: cedula,
        telefonoNuevoPropietario: telefono,
        correoNuevoPropietario: correo,
        motivoTraspaso: motivoTraspaso as MotivoTraspaso,
        justificacion: just,
        documentoSoporte: archivo,
      })
      setCodigoGenerado(resp.codigo_solicitud)
      setMensaje(`Solicitud ${resp.codigo_solicitud} registrada correctamente en ventanilla.`)
      limpiarFormulario()
      await cargar()
      setVista('lista')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  // Resultado de gestionar una solicitud desde el modal. Va separado de
  // mensaje/error, que son del formulario de ventanilla: ese formulario se ve
  // donde la persona está escribiendo, pero el modal se cierra y la deja
  // viendo la lista, así que su resultado se muestra como toast flotante.
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null)

  const gestionar = async (nuevoEstado: 'en_proceso' | 'aprobado' | 'rechazado') => {
    if (!detalle) return
    setGestionando(true)
    setToast(null)

    try {
      await cambiarEstadoSolicitudCambioPropietario(detalle.id, {
        estado: nuevoEstado,
        motivoRechazo: nuevoEstado === 'rechazado' ? motivoRechazo : undefined,
      })
      setToast({
        tipo: 'exito',
        mensaje:
          nuevoEstado === 'aprobado'
            ? `Solicitud ${detalle.codigo_solicitud} aprobada exitosamente. Se traspasaron los datos y se notificó al nuevo propietario.`
            : `Solicitud ${detalle.codigo_solicitud} actualizada a "${ESTADO_LABELS[nuevoEstado]}".`,
      })
      setDetalle(null)
      setMotivoRechazo('')
      await cargar()
    } catch (err) {
      setToast({ tipo: 'error', mensaje: err instanceof Error ? err.message : 'No se pudo actualizar el estado.' })
    } finally {
      setGestionando(false)
    }
  }

  // Primer clic en "Rechazar" solo despliega el campo de motivo; el segundo
  // (ya con motivo válido) confirma el rechazo.
  const manejarClicRechazar = () => {
    if (!mostrarMotivo) {
      setMostrarMotivo(true)
      return
    }
    if (motivoValido) gestionar('rechazado')
  }

  return (
    <div className="space-y-8">
      {codigoGenerado && (
        <ModalConfirmacion
          codigo={codigoGenerado}
          onCerrar={() => setCodigoGenerado(null)}
          titulo="¡Solicitud Registrada con Éxito!"
          descripcion={
            <>
              Tu trámite de <strong>Cambio de Propietario (Cesión de Derechos)</strong> ha sido recibido por la administración de la ASADA.
            </>
          }
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

      <div className="flex gap-6 border-b border-primary-100">
        <button
          type="button"
          onClick={() => setVista('lista')}
          className={`border-b-2 pb-2 text-sm font-semibold transition-colors ${
            vista === 'lista'
              ? 'border-primary-700 text-primary-900'
              : 'border-transparent text-primary-400 hover:text-primary-700'
          }`}
        >
          Solicitudes registradas
        </button>
        <button
          type="button"
          onClick={() => setVista('crear')}
          className={`border-b-2 pb-2 text-sm font-semibold transition-colors ${
            vista === 'crear'
              ? 'border-primary-700 text-primary-900'
              : 'border-transparent text-primary-400 hover:text-primary-700'
          }`}
        >
          Generar solicitud
        </button>
      </div>

      {vista === 'crear' && (
      <>
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
          label="Documento legal de respaldo (Escritura pública o certificación)"
          ayuda="Subí la escritura de traspaso o certificación de propiedad en formato PDF o imagen (.jpg, .jpeg, .png). Máximo 5 MB."
          obligatorio
        />

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-primary-100">
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? 'Registrando en ventanilla…' : 'Registrar Solicitud'}
          </button>
          <button
            type="button"
            onClick={() => {
              limpiarFormulario()
              setError('')
              setMensaje('')
            }}
            className="rounded-lg border border-primary-200 px-5 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            Cancelar
          </button>
        </div>
      </form>
      </>
      )}

      {vista === 'lista' && (
      <>
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
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Código</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Titular Anterior</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Nuevo Propietario</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Motivo</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
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
                      <BadgeEstado estado={s.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDetalle(s)
                          setMotivoRechazo(s.motivo_rechazo ?? '')
                          setMostrarMotivo(false)
                        }}
                        className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50"
                      >
                        Ver / gestionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* Modal de Detalle y Gestión */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary-900">
                  {detalle.codigo_solicitud}
                </h3>
                <p className="mt-0.5 text-sm text-primary-500">
                  Solicitud de cambio de propietario
                </p>
              </div>
              <BadgeEstado estado={detalle.estado} />
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase text-primary-400">Abonado</dt>
                <dd className="mt-0.5 text-primary-800">
                  {detalle.nombre_abonado}{' '}
                  <span className="text-primary-400">({detalle.numero_abonado})</span>
                </dd>
                <dd className="mt-1 text-xs text-primary-400">Cédula</dd>
                <dd className="font-mono text-primary-800">{detalle.cedula}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase text-primary-400">
                  Nuevo propietario (cesionario)
                </dt>
                <dd className="mt-0.5 text-xs text-primary-400">Nombre</dd>
                <dd className="font-medium text-primary-900">
                  {detalle.nombre_nuevo_propietario}
                </dd>
                <dd className="mt-2 text-xs text-primary-400">Cédula</dd>
                <dd className="font-mono text-primary-800">
                  {detalle.cedula_nuevo_propietario}
                </dd>
                <dd className="mt-2 text-xs text-primary-400">Contacto</dd>
                <dd className="text-primary-800">
                  {detalle.telefono_nuevo_propietario} • {detalle.correo_nuevo_propietario}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase text-primary-400">Motivo</dt>
                <dd className="mt-0.5 text-primary-800">{detalle.motivo_traspaso}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase text-primary-400">
                  Justificación
                </dt>
                <dd className="mt-0.5 text-primary-800">{detalle.justificacion}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase text-primary-400">
                  Documento de soporte
                </dt>
                <dd className="mt-0.5 text-primary-800">
                  {detalle.documento_soporte_url ? (
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
                      className="font-medium text-primary-700 underline hover:text-primary-800"
                    >
                      Descargar documento adjunto
                    </button>
                  ) : (
                    <span className="text-primary-400">Sin documento adjunto</span>
                  )}
                </dd>
              </div>

              {detalle.motivo_rechazo && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase text-red-500">
                    Motivo de rechazo
                  </dt>
                  <dd className="mt-0.5 text-red-700">{detalle.motivo_rechazo}</dd>
                </div>
              )}

              <div>
                <dt className="text-xs font-medium uppercase text-primary-400">
                  Fecha de creación
                </dt>
                <dd className="mt-0.5 text-primary-800">
                  {formatearFecha(detalle.fecha_creacion)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-primary-400">
                  Última actualización
                </dt>
                <dd className="mt-0.5 text-primary-800">
                  {formatearFecha(detalle.fecha_actualizacion)}
                </dd>
              </div>
            </dl>

            {detalle.estado === 'aprobado' || detalle.estado === 'rechazado' ? (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetalle(null)}
                  className="rounded-full bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-3 border-t border-primary-100 pt-4">
                {mostrarMotivo && (
                  <>
                    <label htmlFor="motivo" className="block text-sm font-medium text-primary-700">
                      Motivo (obligatorio al rechazar)
                    </label>
                    <textarea
                      id="motivo"
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                      rows={3}
                      placeholder="Ej: la documentación de respaldo no acredita la cesión de derechos de la paja de agua"
                      className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />

                    {motivoRechazo.trim().length > 0 && !motivoValido && (
                      <p className="text-xs text-amber-600">
                        Escribe al menos {MIN_MOTIVO} caracteres para poder rechazar
                        (llevas {motivoRechazo.trim().length}).
                      </p>
                    )}
                  </>
                )}

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => gestionar('en_proceso')}
                    disabled={gestionando || detalle.estado === 'en_proceso'}
                    className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {gestionando ? 'Guardando...' : 'Marcar en proceso'}
                  </button>
                  <button
                    type="button"
                    onClick={() => gestionar('aprobado')}
                    disabled={gestionando}
                    className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    {gestionando ? 'Guardando...' : 'Aprobar'}
                  </button>
                  <button
                    type="button"
                    onClick={manejarClicRechazar}
                    disabled={gestionando || (mostrarMotivo && !motivoValido)}
                    className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {gestionando ? 'Guardando...' : 'Rechazar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetalle(null)}
                    disabled={gestionando}
                    className="rounded-full border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {toast && (
        <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />
      )}
    </div>
  )
}