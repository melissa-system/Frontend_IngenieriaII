import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { nombreVisible, obtenerAbonados, type Abonado } from '../../components/Services/abonados.service'
import { obtenerPerfil, type PerfilCompleto } from '../../components/Services/perfil.service'
import {
  cambiarEstadoSolicitudCambioRepresentante,
  crearSolicitudCambioRepresentante,
  obtenerSolicitudesCambioRepresentante,
  type SolicitudCambioRepresentante,
  type EstadoSolicitud,
} from '../../components/Services/cambioRepresentante.service'
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

// Mismas reglas que valida el backend (clase-validator, DTO de representante).
const IDENTIFICACION_REGEX = /^(\d{1}-\d{4}-\d{4}|\d{1}-\d{3}-\d{6}|\d{11,12})$/
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Formatea la cédula mientras se escribe según el primer dígito:
//   física (1-2345-6789), jurídica (3-101-123456) o DIMEX (11-12 dígitos).
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

// Colores para el distintivo de estado: amarillo (pendiente), azul (en
// proceso), verde (aprobado), rojo (rechazado).
function estadoColor(estado: EstadoSolicitud): string {
  switch (estado) {
    case 'pendiente':
      return 'bg-yellow-100 text-yellow-700'
    case 'en_proceso':
      return 'bg-blue-100 text-blue-700'
    case 'aprobado':
      return 'bg-green-100 text-green-700'
    case 'rechazado':
      return 'bg-red-100 text-red-700'
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
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoColor(estado)}`}
    >
      {ESTADO_LABELS[estado]}
    </span>
  )
}

// Estado vacío compartido (mismo esquema visual que el resto del Dashboard).
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

// Enlace a la cédula adjunta de una solicitud (en listas).
function EnlaceCedula({ url }: { url: string | null }) {
  if (!url) {
    return <span className="text-xs text-primary-400">Sin archivo</span>
  }
  return (
    <button
      type="button"
      onClick={() => descargarArchivo(url, `copia-cedula${extensionDesdeUrl(url)}`)}
      className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
    >
      Descargar cédula
    </button>
  )
}

function SolicitudesCambioRepresentante() {
  const { rolEfectivo } = useAuth()
  const esAbonado = rolEfectivo === 'Abonado'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">Cambio de Representante</h1>
        <p className="mt-1 text-sm text-primary-500">
          {esAbonado
            ? 'Solicitá el cambio del representante legal registrado en tu cuenta'
            : 'Gestioná las solicitudes de cambio de representante legal de los abonados'}
        </p>
      </div>

      {esAbonado ? (
        <VistaAbonado />
      ) : (
        <VistaAdministrador />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista del ABONADO: un formulario para crear su solicitud y la tabla con sus
// propias solicitudes. Solo los abonados jurídicos tienen representante legal.
// ---------------------------------------------------------------------------
function VistaAbonado() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null)
  const [cargandoPerfil, setCargandoPerfil] = useState(true)

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaCedula, setNuevaCedula] = useState('')
  const [nuevoCorreo, setNuevoCorreo] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null)
  const [errorArchivo, setErrorArchivo] = useState('')

  const [solicitudes, setSolicitudes] = useState<SolicitudCambioRepresentante[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const enviandoRef = useRef(false)
  const [error, setError] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null)

  const juridico = perfil?.tipo_asociacion === 'abonado' ? perfil.juridico ?? null : null
  const esJuridica = !!juridico

  const numeroAbonado = user?.vinculos?.abonado?.id
    ? `ABN-${String(user.vinculos.abonado.id).padStart(4, '0')}`
    : 'Activo'

  const tieneAbierta = useMemo(
    () =>
      solicitudes.some((s) => s.estado === 'pendiente' || s.estado === 'en_proceso'),
    [solicitudes],
  )

  const cargar = useCallback(async () => {
    try {
      const lista = await obtenerSolicitudesCambioRepresentante()
      setSolicitudes(lista)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar tus solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    // El representante actual se lee del perfil (GET /auth/perfil expone los
    // datos jurídicos para un abonado logueado; /abonados/:id es de gestión).
    obtenerPerfil()
      .then(setPerfil)
      .catch(() => setError('No se pudo cargar la información del representante.'))
      .finally(() => setCargandoPerfil(false))
    cargar()
  }, [cargar])

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
    setNuevoNombre('')
    setNuevaCedula('')
    setNuevoCorreo('')
    setJustificacion('')
    setArchivo(null)
    setArchivoPreview(null)
    setErrorArchivo('')
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (enviandoRef.current) return
    const nombre = nuevoNombre.trim()
    const cedula = nuevaCedula.trim()
    const correo = nuevoCorreo.trim()
    const just = justificacion.trim()
    if (!nombre) {
      setError('El nombre del nuevo representante es obligatorio.')
      return
    }
    if (!IDENTIFICACION_REGEX.test(cedula)) {
      setError(
        'Formato de cédula inválido. Usa cédula (1-2345-6789), cédula jurídica (3-101-123456) o DIMEX (11-12 dígitos).',
      )
      return
    }
    if (correo && !CORREO_REGEX.test(correo)) {
      setError('El correo del nuevo representante no es válido.')
      return
    }
    if (just.length < 10) {
      setError('La justificación debe tener al menos 10 caracteres.')
      return
    }
    if (!archivo) {
      setError('Debes adjuntar la foto o PDF de la cédula del nuevo representante.')
      return
    }

    enviandoRef.current = true
    setEnviando(true)
    try {
      const resp = await crearSolicitudCambioRepresentante({
        representanteNuevoNombre: nombre,
        representanteNuevoCedula: cedula,
        representanteNuevoCorreo: correo,
        justificacion: just,
        copiaCedula: archivo,
      })
      setCodigoGenerado(resp.codigo_solicitud)
      limpiarFormulario()
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la solicitud.')
    } finally {
      enviandoRef.current = false
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
              Tu trámite de <strong>Cambio de Representante Legal</strong> ha sido
              recibido por la administración de la ASADA.
            </>
          }
        />
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!esJuridica ? (
        !cargandoPerfil && (
          <EmptyState
            titulo="Solo los abonados jurídicos pueden solicitar un cambio de representante"
            descripcion="Tu cuenta no tiene un representante legal registrado. Si esto es un error, contactá las oficinas de la ASADA."
          />
        )
      ) : (
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm space-y-6"
        >
          <div className="border-b border-primary-100 pb-4">
            <h2 className="text-lg font-semibold text-primary-900">
              Formulario de Cambio de Representante Legal
            </h2>
            <p className="text-xs text-primary-500 mt-1">
              Los datos del representante actual se toman de tu cuenta. Completá la
              información del nuevo representante y adjuntá una copia de su cédula.
            </p>
          </div>

          {/* Sección 1: Datos del Representante Actual (Solo lectura) */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-700">
              1. Representante Actual Registrado
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Nombre del Representante
                </label>
                <input
                  type="text"
                  disabled
                  value={cargandoPerfil ? 'Cargando…' : (juridico?.nombre_representante_legal ?? '-')}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Cédula del Representante
                </label>
                <input
                  type="text"
                  disabled
                  value={cargandoPerfil ? 'Cargando…' : (juridico?.cedula_representante ?? '-')}
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
                  value={cargandoPerfil ? 'Cargando…' : numeroAbonado}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-inner"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-primary-400">
              Al aprobarse la solicitud, estos datos quedan registrados automáticamente como el representante anterior.
            </p>
          </div>

          {/* Sección 2: Datos del Nuevo Representante */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-700">
              2. Datos del Nuevo Representante
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nuevoNombre" className="block text-sm font-medium text-primary-700">
                  Nombre Completo *
                </label>
                <input
                  id="nuevoNombre"
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  required
                  disabled={tieneAbierta}
                  placeholder="Nombre completo del nuevo representante"
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none disabled:bg-gray-100"
                />
                {nuevoNombre.length > 0 && nuevoNombre.trim().length < 5 && (
                  <p className="mt-1 text-xs text-red-500">Mínimo 5 caracteres</p>
                )}
              </div>
              <div>
                <label htmlFor="nuevaCedula" className="block text-sm font-medium text-primary-700">
                  Cédula de Identidad *
                </label>
                <input
                  id="nuevaCedula"
                  type="text"
                  value={nuevaCedula}
                  onChange={(e) => setNuevaCedula(formatearCedula(e.target.value))}
                  required
                  disabled={tieneAbierta}
                  placeholder="Ej: 1-2345-6789 o 3-101-123456"
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none disabled:bg-gray-100"
                />
                {nuevaCedula.length > 0 && !IDENTIFICACION_REGEX.test(nuevaCedula.trim()) && (
                  <p className="mt-1 text-xs text-red-500">
                    Ingresá una identificación válida (física, jurídica o DIMEX)
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="nuevoCorreo" className="block text-sm font-medium text-primary-700">
                  Correo Electrónico
                </label>
                <input
                  id="nuevoCorreo"
                  type="email"
                  value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)}
                  disabled={tieneAbierta}
                  placeholder="correo@ejemplo.com (opcional)"
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none disabled:bg-gray-100"
                />
                <p className="mt-1 text-xs text-primary-400">
                  Se usa para notificarlo del resultado de la solicitud.
                </p>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="justificacion" className="block text-sm font-medium text-primary-700">
                    Justificación del Cambio *
                  </label>
                  <span className="text-xs text-gray-400">
                    {justificacion.trim().length} / 255 (mínimo 10)
                  </span>
                </div>
                <textarea
                  id="justificacion"
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  required
                  disabled={tieneAbierta}
                  rows={3}
                  maxLength={255}
                  placeholder="Explicá brevemente el motivo del cambio de representante"
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none disabled:bg-gray-100"
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
              label="Copia de la cédula del nuevo representante"
              ayuda="Se admiten fotos (.jpg, .jpeg, .png) o el documento en .pdf. Máximo 5 MB."
              obligatorio
            />
          </div>

          {tieneAbierta && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Actualmente tenés una solicitud de cambio de representante en proceso. No podés crear otra hasta que sea resuelta.
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-primary-100">
            <button
              type="submit"
              disabled={tieneAbierta || enviando}
              className="rounded-full bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? 'Enviando solicitud…' : 'Enviar Solicitud'}
            </button>
            <button
              type="button"
              onClick={() => {
                limpiarFormulario()
                setError('')
              }}
              className="rounded-full border border-primary-200 px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-primary-900">Mis solicitudes</h2>

        {cargando ? (
          <p className="text-sm text-primary-400">Cargando solicitudes…</p>
        ) : solicitudes.length === 0 ? (
          <EmptyState
            titulo="Aún no tenés solicitudes de cambio de representante"
            descripcion="Tus solicitudes aparecerán aquí junto con su estado."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-primary-100 text-sm">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Código</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Nuevo representante</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Cédula adjunta</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {solicitudes.map((s) => (
                  <tr key={s.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-800">{s.codigo_solicitud}</td>
                    <td className="px-4 py-3 text-primary-600">{s.representante_nuevo_nombre}</td>
                    <td className="px-4 py-3">
                      <EnlaceCedula url={s.copia_cedula_url} />
                    </td>
                    <td className="px-4 py-3">
                      <BadgeEstado estado={s.estado} />
                      {s.motivo_rechazo && (
                        <p className="mt-1 text-xs text-red-500">{s.motivo_rechazo}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-primary-500">
                      {formatearFecha(s.fecha_creacion)}
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
// Vista del ADMINISTRADOR: formulario para crear solicitudes para un abonado
// jurídico, la lista completa y el modal de detalle para aprobar/rechazar.
// ---------------------------------------------------------------------------
function VistaAdministrador() {
  const [abonados, setAbonados] = useState<Abonado[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [abonadoSel, setAbonadoSel] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaCedula, setNuevaCedula] = useState('')
  const [nuevoCorreo, setNuevoCorreo] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null)
  const [errorArchivo, setErrorArchivo] = useState('')
  const [cargandoAbonados, setCargandoAbonados] = useState(true)

  const [solicitudes, setSolicitudes] = useState<SolicitudCambioRepresentante[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const enviandoRef = useRef(false)
  const [error, setError] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null)

  const [detalle, setDetalle] = useState<SolicitudCambioRepresentante | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [gestionando, setGestionando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  // Alterna entre ver el listado y generar una solicitud nueva, en vez de
  // mostrar ambas cosas apiladas en la misma pantalla.
  const [vista, setVista] = useState<'lista' | 'crear'>('lista')

  const cargar = useCallback(async () => {
    try {
      const lista = await obtenerSolicitudesCambioRepresentante()
      setSolicitudes(lista)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    obtenerAbonados()
      .then(setAbonados)
      .catch(() => setError('No se pudieron cargar los abonados.'))
      .finally(() => setCargandoAbonados(false))
    cargar()
  }, [cargar])

  // Búsqueda client-side por nombre o cédula (sin nº de abonado). La cédula
  // se compara ignorando los guiones, para que "1-2222-3333" y "122223333"
  // den el mismo resultado. Solo abonados jurídicos (tienen representante).
  const abonadosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase().replaceAll('-', '')
    if (!texto) return []
    return abonados
      .filter((a) => a.tipo_abonado === 'Jurídica')
      .filter((a) => {
        const nombre = nombreVisible(a).toLowerCase()
        const cedula = a.cedula.toLowerCase().replaceAll('-', '')
        return nombre.includes(texto) || cedula.includes(texto)
      })
  }, [abonados, busqueda])

  const abonadoElegido = abonados.find((a) => String(a.id) === abonadoSel)

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
    setAbonadoSel('')
    setBusqueda('')
    setNuevoNombre('')
    setNuevaCedula('')
    setNuevoCorreo('')
    setJustificacion('')
    setArchivo(null)
    setArchivoPreview(null)
    setErrorArchivo('')
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (enviandoRef.current) return
    if (!abonadoElegido || abonadoElegido.estado !== 'Activo') {
      setError('Seleccioná un abonado activo para la solicitud.')
      return
    }
    const nombre = nuevoNombre.trim()
    const cedula = nuevaCedula.trim()
    const correo = nuevoCorreo.trim()
    const just = justificacion.trim()
    if (!nombre) {
      setError('El nombre del nuevo representante es obligatorio.')
      return
    }
    if (!IDENTIFICACION_REGEX.test(cedula)) {
      setError(
        'Formato de cédula inválido. Usa cédula (1-2345-6789), cédula jurídica (3-101-123456) o DIMEX (11-12 dígitos).',
      )
      return
    }
    if (correo && !CORREO_REGEX.test(correo)) {
      setError('El correo del nuevo representante no es válido.')
      return
    }
    if (just.length < 10) {
      setError('La justificación debe tener al menos 10 caracteres.')
      return
    }
    if (!archivo) {
      setError('Debes adjuntar la foto o PDF de la cédula del nuevo representante.')
      return
    }

    enviandoRef.current = true
    setEnviando(true)
    try {
      const resp = await crearSolicitudCambioRepresentante({
        idAbonado: Number(abonadoElegido.id),
        representanteNuevoNombre: nombre,
        representanteNuevoCedula: cedula,
        representanteNuevoCorreo: correo,
        justificacion: just,
        copiaCedula: archivo,
      })
      setCodigoGenerado(resp.codigo_solicitud)
      limpiarFormulario()
      await cargar()
      setVista('lista')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la solicitud.')
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  // Resultado de gestionar una solicitud desde el modal. Va separado de
  // mensaje/error, que son del formulario de ventanilla: ese formulario se ve
  // donde la persona está escribiendo, pero el modal se cierra y la deja
  // viendo la lista, así que su resultado se muestra como toast flotante.
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null)

  const gestionar = async (estado: 'en_proceso' | 'aprobado' | 'rechazado') => {
    if (!detalle) return
    setGestionando(true)
    setToast(null)
    try {
      await cambiarEstadoSolicitudCambioRepresentante(detalle.id, {
        estado,
        motivoRechazo: estado === 'rechazado' ? motivoRechazo : undefined,
      })
      setToast({
        tipo: 'exito',
        mensaje:
          estado === 'aprobado'
            ? `Solicitud ${detalle.codigo_solicitud} aprobada. El representante del abonado se actualizó y se notificó por correo.`
            : `Solicitud ${detalle.codigo_solicitud} actualizada a "${ESTADO_LABELS[estado]}".`,
      })
      setDetalle(null)
      setMotivoRechazo('')
      await cargar()
    } catch (err) {
      setToast({ tipo: 'error', mensaje: err instanceof Error ? err.message : 'No se pudo actualizar la solicitud.' })
    } finally {
      setGestionando(false)
    }
  }

  const abrirDetalle = (s: SolicitudCambioRepresentante) => {
    setMotivoRechazo(s.motivo_rechazo ?? '')
    setDetalle(s)
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
              Tu trámite de <strong>Cambio de Representante Legal</strong> ha sido
              recibido por la administración de la ASADA.
            </>
          }
        />
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="inline-flex w-full max-w-sm rounded-lg border border-primary-200 bg-primary-50 p-1">
        <button
          type="button"
          onClick={() => setVista('lista')}
          className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${
            vista === 'lista'
              ? 'bg-primary-700 text-white shadow'
              : 'text-primary-700 hover:text-primary-900'
          }`}
        >
          Solicitudes registradas
        </button>
        <button
          type="button"
          onClick={() => setVista('crear')}
          className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${
            vista === 'crear'
              ? 'bg-primary-700 text-white shadow'
              : 'text-primary-700 hover:text-primary-900'
          }`}
        >
          Generar solicitud
        </button>
      </div>

      {vista === 'crear' && (
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-primary-900">Generar solicitud</h2>
        <p className="mt-1 text-sm text-primary-500">
          Creá una solicitud de cambio de representante legal para un abonado jurídico.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Abonado (jurídico)
            </label>

            {abonadoElegido ? (
              <div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm shadow-sm">
                  <p className="font-medium text-primary-900">{nombreVisible(abonadoElegido)}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setAbonadoSel('')
                      setBusqueda('')
                    }}
                    className="shrink-0 rounded-md border border-primary-200 bg-white px-2.5 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative mt-1">
                <input
                  id="busquedaAbonado"
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar abonado jurídico por nombre o cédula…"
                  className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
                {busqueda.trim() !== '' && (
                  <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-primary-200 bg-white shadow-lg">
                    {cargandoAbonados ? (
                      <li className="px-3 py-2 text-sm text-primary-400">
                        Cargando abonados…
                      </li>
                    ) : abonadosFiltrados.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-primary-400">
                        No se encontraron abonados jurídicos con «{busqueda.trim()}».
                      </li>
                    ) : (
                      abonadosFiltrados.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setAbonadoSel(String(a.id))
                              setBusqueda('')
                            }}
                            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50"
                          >
                            <span className="font-medium text-primary-800">{nombreVisible(a)}</span>
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-primary-400">{a.cedula}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  a.estado === 'Activo'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {a.estado}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="nuevoNombre" className="block text-sm font-medium text-primary-700">
              Nombre del nuevo representante
            </label>
            <input
              id="nuevoNombre"
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              required
              placeholder="Nombre completo del nuevo representante"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="nuevaCedula" className="block text-sm font-medium text-primary-700">
              Cédula del nuevo representante
            </label>
            <input
              id="nuevaCedula"
              type="text"
              value={nuevaCedula}
              onChange={(e) => setNuevaCedula(formatearCedula(e.target.value))}
              required
              placeholder="Ej: 1-2345-6789"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="nuevoCorreo" className="block text-sm font-medium text-primary-700">
              Correo del nuevo representante
            </label>
            <input
              id="nuevoCorreo"
              type="email"
              value={nuevoCorreo}
              onChange={(e) => setNuevoCorreo(e.target.value)}
              placeholder="correo@ejemplo.com (opcional)"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="justificacion" className="block text-sm font-medium text-primary-700">
              Justificación
            </label>
            <textarea
              id="justificacion"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              required
              rows={3}
              placeholder="Motivo del cambio de representante"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <FileDropZone
              archivo={archivo}
              archivoPreview={archivoPreview}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              errorArchivo={errorArchivo}
              label="Copia de la cédula del nuevo representante"
              ayuda="Se admiten fotos (.jpg, .jpeg, .png) o el documento en .pdf. Máximo 5 MB."
              obligatorio
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
        {mensaje && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
            {mensaje}
          </p>
        )}

        <div className="mt-5 flex justify-center gap-3">
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? 'Subiendo solicitud…' : 'Registrar solicitud'}
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
      )}

      {vista === 'lista' && (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-primary-900">Solicitudes registradas</h2>

        {cargando ? (
          <p className="text-sm text-primary-400">Cargando solicitudes…</p>
        ) : solicitudes.length === 0 ? (
          <EmptyState
            titulo="No hay solicitudes de cambio de representante"
            descripcion="Las solicitudes registradas aparecerán aquí."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-primary-100 text-sm">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Código</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Abonado</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Nuevo representante</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Cédula adjunta</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {solicitudes.map((s) => (
                  <tr key={s.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-800">{s.codigo_solicitud}</td>
                    <td className="px-4 py-3 text-primary-600">
                      <div className="font-medium text-primary-800">{s.nombre_abonado}</div>
                      <div className="text-xs text-primary-400">{s.numero_abonado}</div>
                    </td>
                    <td className="px-4 py-3 text-primary-600">{s.representante_nuevo_nombre}</td>
                    <td className="px-4 py-3">
                      <EnlaceCedula url={s.copia_cedula_url} />
                    </td>
                    <td className="px-4 py-3">
                      <BadgeEstado estado={s.estado} />
                    </td>
                    <td className="px-4 py-3 text-primary-500">
                      {formatearFecha(s.fecha_creacion)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => abrirDetalle(s)}
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
      )}

      {detalle && (
        <ModalDetalle
          solicitud={detalle}
          motivoRechazo={motivoRechazo}
          setMotivoRechazo={setMotivoRechazo}
          gestionando={gestionando}
          onCerrar={() => setDetalle(null)}
          onGestionar={gestionar}
        />
      )}
      {toast && (
        <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />
      )}
    </div>
  )
}

// Modal de detalle de una solicitud: muestra el representante actual (solo
// lectura), los datos del nuevo representante propuesto con la cédula adjunta,
// y permite aprobar o rechazar. Las solicitudes aprobadas/rechazadas ya no
// admiten cambios (estado final).
function ModalDetalle({
  solicitud,
  motivoRechazo,
  setMotivoRechazo,
  gestionando,
  onCerrar,
  onGestionar,
}: {
  solicitud: SolicitudCambioRepresentante
  motivoRechazo: string
  setMotivoRechazo: (v: string) => void
  gestionando: boolean
  onCerrar: () => void
  onGestionar: (estado: 'en_proceso' | 'aprobado' | 'rechazado') => void
}) {
  const esFinal = solicitud.estado === 'aprobado' || solicitud.estado === 'rechazado'
 
  // Mínimo de caracteres del motivo al rechazar. Un "no" o un "." no le
  // sirven al abonado, que recibe este texto por correo como única
  // explicación del rechazo.
  const MIN_MOTIVO = 10
  const motivoValido = motivoRechazo.trim().length >= MIN_MOTIVO

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              {solicitud.codigo_solicitud}
            </h3>
            <p className="mt-0.5 text-sm text-primary-500">
              Solicitud de cambio de representante
            </p>
          </div>
          <BadgeEstado estado={solicitud.estado} />
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">Abonado</dt>
            <dd className="mt-0.5 text-primary-800">
              {solicitud.nombre_abonado}{' '}
              <span className="text-primary-400">({solicitud.numero_abonado})</span>
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">
              Representante actual
            </dt>
            <dd className="mt-0.5 text-xs text-primary-400">Nombre</dd>
            <dd className="text-primary-800">{solicitud.representante_anterior_nombre || '—'}</dd>
            <dd className="mt-2 text-xs text-primary-400">Cédula</dd>
            <dd className="font-mono text-primary-800">
              {solicitud.representante_anterior_cedula || '—'}
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">
              Nuevo representante propuesto
            </dt>
            <dd className="mt-0.5 text-xs text-primary-400">Nombre</dd>
            <dd className="font-medium text-primary-900">{solicitud.representante_nuevo_nombre}</dd>
            <dd className="mt-2 text-xs text-primary-400">Cédula</dd>
            <dd className="font-mono text-primary-800">{solicitud.representante_nuevo_cedula}</dd>
            <dd className="mt-2 text-xs text-primary-400">Correo</dd>
            <dd className="text-primary-800">{solicitud.representante_nuevo_correo || '—'}</dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">
              Cédula del nuevo representante (adjunto)
            </dt>
            <dd className="mt-0.5">
              <EnlaceCedula url={solicitud.copia_cedula_url} />
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">Justificación</dt>
            <dd className="mt-0.5 text-primary-800">{solicitud.justificacion}</dd>
          </div>

          {solicitud.motivo_rechazo && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-red-500">Motivo de rechazo</dt>
              <dd className="mt-0.5 text-red-700">{solicitud.motivo_rechazo}</dd>
            </div>
          )}

          <div>
            <dt className="text-xs font-medium uppercase text-primary-400">Fecha de creación</dt>
            <dd className="mt-0.5 text-primary-800">{formatearFecha(solicitud.fecha_creacion)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-primary-400">Última actualización</dt>
            <dd className="mt-0.5 text-primary-800">{formatearFecha(solicitud.fecha_actualizacion)}</dd>
          </div>
        </dl>

        {esFinal ? (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3 border-t border-primary-100 pt-4">
            <label htmlFor="motivo" className="block text-sm font-medium text-primary-700">
              Motivo (obligatorio al rechazar)
            </label>
            <textarea
              id="motivo"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows={3}
              placeholder="Ej: la cédula adjunta no coincide con la identificación del nuevo representante"
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
 
            {motivoRechazo.trim().length > 0 && !motivoValido && (
              <p className="text-xs text-amber-600">
                Escribe al menos {MIN_MOTIVO} caracteres para poder rechazar
                (llevas {motivoRechazo.trim().length}).
              </p>
            )}
 
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => onGestionar('en_proceso')}
                disabled={gestionando || solicitud.estado === 'en_proceso'}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {gestionando ? 'Guardando...' : 'Marcar en proceso'}
              </button>
              <button
                type="button"
                onClick={() => onGestionar('aprobado')}
                disabled={gestionando}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {gestionando ? 'Guardando...' : 'Aprobar'}
              </button>
              <button
                type="button"
                onClick={() => onGestionar('rechazado')}
                disabled={gestionando || !motivoValido}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {gestionando ? 'Guardando...' : 'Rechazar'}
              </button>
              <button
                type="button"
                onClick={onCerrar}
                disabled={gestionando}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SolicitudesCambioRepresentante