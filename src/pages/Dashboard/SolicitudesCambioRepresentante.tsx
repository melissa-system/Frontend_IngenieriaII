import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
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

const ESTADO_LABELS: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  aprobado: 'Aprobada',
  rechazado: 'Rechazada',
}

const ACCEPT_CEDULA = 'image/jpeg,image/png,image/webp,application/pdf'
const MAX_BYTES = 5 * 1024 * 1024

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

// Selector compartido de la foto/PDF de la cédula del nuevo representante
// (misma validación y estilo que en cambio de medidor).
function InputCopiaCedula({
  id,
  archivo,
  archivoPreview,
  onArchivoChange,
  inputRef,
}: {
  id: string
  archivo: File | null
  archivoPreview: string | null
  onArchivoChange: (evento: ChangeEvent<HTMLInputElement>) => void
  inputRef: RefObject<HTMLInputElement | null>
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-primary-700">
        Foto o PDF de la cédula del nuevo representante (Máx 5MB)
      </label>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={ACCEPT_CEDULA}
        onChange={onArchivoChange}
        required
        className="mt-1 w-full text-sm text-primary-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
      />
      <p className="mt-1 text-xs text-primary-400">
        Se admiten fotos (.jpg, .png, .webp) o el documento en .pdf.
      </p>

      {archivoPreview && (
        <div className="mt-3 flex items-center gap-3">
          <img
            src={archivoPreview}
            alt="Vista previa de la cédula"
            className="h-20 w-20 rounded-lg border border-primary-200 object-cover shadow-sm"
          />
          <span className="text-xs font-medium text-primary-600">{archivo?.name}</span>
        </div>
      )}
      {!archivoPreview && archivo && (
        <div className="mt-2 text-xs font-medium text-primary-700">
          Archivo seleccionado: {archivo.name}
        </div>
      )}
    </div>
  )
}

// Enlace a la cédula adjunta de una solicitud (en listas).
function EnlaceCedula({ url }: { url: string | null }) {
  if (!url) {
    return <span className="text-xs text-primary-400">Sin archivo</span>
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
    >
      Ver cédula
    </a>
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
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null)
  const [cargandoPerfil, setCargandoPerfil] = useState(true)

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaCedula, setNuevaCedula] = useState('')
  const [nuevaDireccion, setNuevaDireccion] = useState('')
  const [nuevoCorreo, setNuevoCorreo] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [solicitudes, setSolicitudes] = useState<SolicitudCambioRepresentante[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const juridico = perfil?.tipo_asociacion === 'abonado' ? perfil.juridico ?? null : null
  const esJuridica = !!juridico

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

  const onArchivoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setArchivo(null)
      setArchivoPreview(null)
      return
    }
    if (file.size > MAX_BYTES) {
      setError('La foto o PDF de la cédula no puede superar los 5 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setArchivo(null)
      setArchivoPreview(null)
      return
    }
    setError('')
    setArchivo(file)
    if (file.type.startsWith('image/')) {
      setArchivoPreview(URL.createObjectURL(file))
    } else {
      setArchivoPreview(null)
    }
  }

  const limpiarFormulario = () => {
    setNuevoNombre('')
    setNuevaCedula('')
    setNuevaDireccion('')
    setNuevoCorreo('')
    setJustificacion('')
    setArchivo(null)
    setArchivoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    if (!archivo) {
      setError('Debes adjuntar la foto o PDF de la cédula del nuevo representante.')
      return
    }
    setEnviando(true)
    try {
      await crearSolicitudCambioRepresentante({
        representanteNuevoNombre: nuevoNombre,
        representanteNuevoCedula: nuevaCedula,
        representanteNuevoDireccion: nuevaDireccion,
        representanteNuevoCorreo: nuevoCorreo,
        justificacion,
        copiaCedula: archivo,
      })
      setMensaje('Solicitud registrada correctamente. Te notificaremos por correo el resultado.')
      limpiarFormulario()
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6">
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
          className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-primary-900">Nueva solicitud</h2>
          <p className="mt-1 text-sm text-primary-500">
            Indicá los datos del nuevo representante legal y adjuntá una copia de su cédula.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Representante actual
              </label>
              <input
                type="text"
                value={cargandoPerfil ? 'Cargando…' : juridico?.nombre_representante_legal ?? '-'}
                readOnly
                disabled={cargandoPerfil}
                className="mt-1 w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Cédula del representante actual
              </label>
              <input
                type="text"
                value={cargandoPerfil ? 'Cargando…' : juridico?.cedula_representante ?? '-'}
                readOnly
                disabled={cargandoPerfil}
                className="mt-1 w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-primary-400">
                Se registra automáticamente como el representante anterior.
              </p>
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
                onChange={(e) => setNuevaCedula(e.target.value)}
                required
                placeholder="Ej: 1-2345-6789"
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="nuevaDireccion" className="block text-sm font-medium text-primary-700">
                Dirección del nuevo representante
              </label>
              <input
                id="nuevaDireccion"
                type="text"
                value={nuevaDireccion}
                onChange={(e) => setNuevaDireccion(e.target.value)}
                required
                placeholder="Dirección física del nuevo representante"
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
              <p className="mt-1 text-xs text-primary-400">
                Se usa para notificarlo del resultado de la solicitud.
              </p>
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
                placeholder="Explicá brevemente el motivo del cambio de representante"
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <InputCopiaCedula
                id="copiaCedulaAbonado"
                archivo={archivo}
                archivoPreview={archivoPreview}
                onArchivoChange={onArchivoChange}
                inputRef={fileInputRef}
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

          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              disabled={tieneAbierta || enviando}
              className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? 'Subiendo solicitud…' : 'Enviar solicitud'}
            </button>
            {tieneAbierta && (
              <p className="text-xs font-medium text-yellow-700">
                Ya tenés una solicitud en trámite; esperá a que se resuelva antes de crear otra.
              </p>
            )}
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
  const [nuevaDireccion, setNuevaDireccion] = useState('')
  const [nuevoCorreo, setNuevoCorreo] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cargandoAbonados, setCargandoAbonados] = useState(true)

  const [solicitudes, setSolicitudes] = useState<SolicitudCambioRepresentante[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [detalle, setDetalle] = useState<SolicitudCambioRepresentante | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [gestionando, setGestionando] = useState(false)

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

  const onArchivoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setArchivo(null)
      setArchivoPreview(null)
      return
    }
    if (file.size > MAX_BYTES) {
      setError('La foto o PDF de la cédula no puede superar los 5 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setArchivo(null)
      setArchivoPreview(null)
      return
    }
    setError('')
    setArchivo(file)
    if (file.type.startsWith('image/')) {
      setArchivoPreview(URL.createObjectURL(file))
    } else {
      setArchivoPreview(null)
    }
  }

  const limpiarFormulario = () => {
    setAbonadoSel('')
    setBusqueda('')
    setNuevoNombre('')
    setNuevaCedula('')
    setNuevaDireccion('')
    setNuevoCorreo('')
    setJustificacion('')
    setArchivo(null)
    setArchivoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    if (!abonadoElegido || abonadoElegido.estado !== 'Activo') {
      setError('Seleccioná un abonado activo para la solicitud.')
      return
    }
    if (!archivo) {
      setError('Debes adjuntar la foto o PDF de la cédula del nuevo representante.')
      return
    }
    setEnviando(true)
    try {
      await crearSolicitudCambioRepresentante({
        idAbonado: Number(abonadoElegido.id),
        representanteNuevoNombre: nuevoNombre,
        representanteNuevoCedula: nuevaCedula,
        representanteNuevoDireccion: nuevaDireccion,
        representanteNuevoCorreo: nuevoCorreo,
        justificacion,
        copiaCedula: archivo,
      })
      setMensaje('Solicitud registrada correctamente.')
      limpiarFormulario()
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  const gestionar = async (estado: 'en_proceso' | 'aprobado' | 'rechazado') => {
    if (!detalle) return
    setGestionando(true)
    setError('')
    setMensaje('')
    try {
      await cambiarEstadoSolicitudCambioRepresentante(detalle.id, {
        estado,
        motivoRechazo: estado === 'rechazado' ? motivoRechazo : undefined,
      })
      setMensaje(
        estado === 'aprobado'
          ? `Solicitud ${detalle.codigo_solicitud} aprobada. El representante del abonado se actualizó y se notificó por correo.`
          : `Solicitud ${detalle.codigo_solicitud} actualizada a "${ESTADO_LABELS[estado]}".`,
      )
      setDetalle(null)
      setMotivoRechazo('')
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la solicitud.')
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
                <div className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm shadow-sm">
                  <div>
                    <p className="font-medium text-primary-900">{nombreVisible(abonadoElegido)}</p>
                    <p className="text-xs text-primary-500">
                      Representante actual:{' '}
                      {abonadoElegido.nombre_representante_legal || '—'}
                      {abonadoElegido.cedula_representante &&
                        ` · ${abonadoElegido.cedula_representante}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAbonadoSel('')
                      setBusqueda('')
                    }}
                    className="rounded-md border border-primary-200 bg-white px-2 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
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
              onChange={(e) => setNuevaCedula(e.target.value)}
              required
              placeholder="Ej: 1-2345-6789"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="nuevaDireccion" className="block text-sm font-medium text-primary-700">
              Dirección del nuevo representante
            </label>
            <input
              id="nuevaDireccion"
              type="text"
              value={nuevaDireccion}
              onChange={(e) => setNuevaDireccion(e.target.value)}
              required
              placeholder="Dirección física del nuevo representante"
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
            <InputCopiaCedula
              id="copiaCedulaAdmin"
              archivo={archivo}
              archivoPreview={archivoPreview}
              onArchivoChange={onArchivoChange}
              inputRef={fileInputRef}
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

        <div className="mt-5">
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? 'Subiendo solicitud…' : 'Registrar solicitud'}
          </button>
        </div>
      </form>

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
            <dd className="mt-2 text-xs text-primary-400">Dirección</dd>
            <dd className="text-primary-800">{solicitud.representante_nuevo_direccion}</dd>
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

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onCerrar}
                disabled={gestionando}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onGestionar('en_proceso')}
                disabled={gestionando || solicitud.estado === 'en_proceso'}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Marcar en proceso
              </button>
              <button
                type="button"
                onClick={() => onGestionar('aprobado')}
                disabled={gestionando}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                Aprobar
              </button>
              <button
                type="button"
                onClick={() => onGestionar('rechazado')}
                disabled={gestionando || motivoRechazo.trim() === ''}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SolicitudesCambioRepresentante