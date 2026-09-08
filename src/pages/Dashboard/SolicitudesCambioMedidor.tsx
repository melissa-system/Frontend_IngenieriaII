import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { nombreVisible, obtenerAbonados, type Abonado } from '../../components/Services/abonados.service'
import {
  cambiarEstadoSolicitudCambioMedidor,
  crearSolicitudCambioMedidor,
  obtenerSolicitudesCambioMedidor,
  MOTIVOS_FALLA_MEDIDOR,
  type SolicitudCambioMedidor,
  type EstadoSolicitud,
  type MotivoFallaMedidor,
} from '../../components/Services/cambioMedidor.service'

const ESTADO_LABELS: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  aprobado: 'Aprobada',
  rechazado: 'Rechazada',
}

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

function SolicitudesCambioMedidor() {
  const { rolEfectivo } = useAuth()
  const esAbonado = rolEfectivo === 'Abonado'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">Cambio de Medidor</h1>
        <p className="mt-1 text-sm text-primary-500">
          {esAbonado
            ? 'Solicitá el cambio o revisión técnica del medidor registrado en tu propiedad'
            : 'Gestioná las solicitudes de cambio o revisión de medidor de los abonados'}
        </p>
      </div>

      {esAbonado ? <VistaAbonado /> : <VistaAdministrador />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista del ABONADO: formulario con motivo, dirección, justificación y
// evidencia fotográfica obligatoria.
// ---------------------------------------------------------------------------
function VistaAbonado() {
  const [motivoFalla, setMotivoFalla] = useState<MotivoFallaMedidor | ''>('')
  const [direccionExacta, setDireccionExacta] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [solicitudes, setSolicitudes] = useState<SolicitudCambioMedidor[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const tieneAbierta = useMemo(
    () =>
      solicitudes.some((s) => s.estado === 'pendiente' || s.estado === 'en_proceso'),
    [solicitudes],
  )

  const cargar = useCallback(async () => {
    try {
      const lista = await obtenerSolicitudesCambioMedidor()
      setSolicitudes(lista)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar tus solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setArchivo(null)
      setArchivoPreview(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La fotografía o documento no puede superar los 5 MB.')
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
    setMotivoFalla('')
    setDireccionExacta('')
    setJustificacion('')
    setArchivo(null)
    setArchivoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (!motivoFalla) {
      setError('Debes seleccionar un motivo de falla.')
      return
    }

    if (!archivo) {
      setError('Debes adjuntar una fotografía o evidencia del medidor.')
      return
    }

    setEnviando(true)
    try {
      await crearSolicitudCambioMedidor({
        motivoFalla,
        direccionExacta,
        justificacion,
        evidencia: archivo,
      })
      setMensaje('Solicitud de cambio de medidor registrada correctamente. Te notificaremos por correo el resultado.')
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
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-primary-900">Nueva solicitud</h2>
        <p className="mt-1 text-sm text-primary-500">
          Completá los datos del problema técnico con tu medidor y adjuntá una fotografía legible.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="motivoFallaAbonado" className="block text-sm font-medium text-primary-700">
              Motivo de la falla
            </label>
            <select
              id="motivoFallaAbonado"
              value={motivoFalla}
              onChange={(e) => setMotivoFalla(e.target.value as MotivoFallaMedidor)}
              required
              className="mt-1 w-full rounded-full border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              {MOTIVOS_FALLA_MEDIDOR.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="direccionExactaAbonado" className="block text-sm font-medium text-primary-700">
              Dirección exacta o señas escritas
            </label>
            <input
              id="direccionExactaAbonado"
              type="text"
              value={direccionExacta}
              onChange={(e) => setDireccionExacta(e.target.value)}
              required
              minLength={15}
              maxLength={255}
              placeholder="Ej: 100 m sur de la escuela, casa blanca con portón negro"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-primary-400">
              Mínimo 15 caracteres para que el personal técnico ubique el medidor.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="justificacionAbonado" className="block text-sm font-medium text-primary-700">
              Detalle técnico o justificación
            </label>
            <textarea
              id="justificacionAbonado"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              required
              minLength={10}
              maxLength={255}
              rows={3}
              placeholder="Describí qué le ocurre al medidor (fuga, números borrosos, rueda detenida, etc.)"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="evidenciaAbonado" className="block text-sm font-medium text-primary-700">
              Fotografía o evidencia del medidor (Máx 5MB)
            </label>
            <input
              ref={fileInputRef}
              id="evidenciaAbonado"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={onFileChange}
              required
              className="mt-1 w-full text-sm text-primary-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
            />
            <p className="mt-1 text-xs text-primary-400">
              Se admiten imágenes (.jpg, .png, .webp) o documentos .pdf.
            </p>

            {archivoPreview && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={archivoPreview}
                  alt="Vista previa de evidencia"
                  className="h-20 w-20 rounded-lg border border-primary-200 object-cover shadow-sm"
                />
                <span className="text-xs text-primary-600 font-medium">
                  {archivo?.name}
                </span>
              </div>
            )}
            {!archivoPreview && archivo && (
              <div className="mt-2 text-xs font-medium text-primary-700">
                Archivo seleccionado: {archivo.name}
              </div>
            )}
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

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-primary-900">Mis solicitudes</h2>

        {cargando ? (
          <p className="text-sm text-primary-400">Cargando solicitudes…</p>
        ) : solicitudes.length === 0 ? (
          <EmptyState
            titulo="Aún no tenés solicitudes de cambio de medidor"
            descripcion="Tus solicitudes aparecerán aquí junto con su estado y seguimiento."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-primary-100 text-sm">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Código</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Motivo</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Dirección</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Evidencia</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {solicitudes.map((s) => (
                  <tr key={s.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-800">{s.codigo_solicitud}</td>
                    <td className="px-4 py-3 font-medium text-primary-800">{s.motivo_falla}</td>
                    <td className="max-w-xs px-4 py-3 text-primary-600 truncate">{s.direccion_exacta}</td>
                    <td className="px-4 py-3">
                      {s.evidencia_url ? (
                        <a
                          href={s.evidencia_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                        >
                          Ver archivo
                        </a>
                      ) : (
                        <span className="text-xs text-primary-400">Sin archivo</span>
                      )}
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
// Vista del ADMINISTRADOR: selección de abonado, formulario de ventanilla,
// tabla completa y modal para gestionar estados y revisar la fotografía.
// ---------------------------------------------------------------------------
function VistaAdministrador() {
  const [abonados, setAbonados] = useState<Abonado[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [abonadoSel, setAbonadoSel] = useState('')
  const [motivoFalla, setMotivoFalla] = useState<MotivoFallaMedidor | ''>('')
  const [direccionExacta, setDireccionExacta] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cargandoAbonados, setCargandoAbonados] = useState(true)

  const [solicitudes, setSolicitudes] = useState<SolicitudCambioMedidor[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [detalle, setDetalle] = useState<SolicitudCambioMedidor | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [gestionando, setGestionando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const lista = await obtenerSolicitudesCambioMedidor()
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

  const abonadosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase().replaceAll('-', '')
    if (!texto) return []
    return abonados.filter((a) => {
      const nombre = nombreVisible(a).toLowerCase()
      const cedula = a.cedula.toLowerCase().replaceAll('-', '')
      return nombre.includes(texto) || cedula.includes(texto)
    })
  }, [abonados, busqueda])

  const abonadoElegido = abonados.find((a) => String(a.id) === abonadoSel)

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setArchivo(null)
      setArchivoPreview(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La fotografía o documento no puede superar los 5 MB.')
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
    setMotivoFalla('')
    setDireccionExacta('')
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

    if (!motivoFalla) {
      setError('Debes seleccionar un motivo de falla.')
      return
    }

    if (!archivo) {
      setError('Debes adjuntar la fotografía o evidencia del medidor.')
      return
    }

    setEnviando(true)
    try {
      await crearSolicitudCambioMedidor({
        idAbonado: Number(abonadoElegido.id),
        motivoFalla,
        direccionExacta,
        justificacion,
        evidencia: archivo,
      })
      setMensaje('Solicitud de cambio de medidor registrada correctamente.')
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
      await cambiarEstadoSolicitudCambioMedidor(detalle.id, {
        estado,
        motivoRechazo: estado === 'rechazado' ? motivoRechazo : undefined,
      })
      setMensaje(
        estado === 'aprobado'
          ? `Solicitud ${detalle.codigo_solicitud} aprobada. Se notificó al abonado por correo.`
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

  const abrirDetalle = (s: SolicitudCambioMedidor) => {
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
          Creá una solicitud de cambio o reparación de medidor para un abonado del sistema.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Abonado
            </label>

            {abonadoElegido ? (
              <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm shadow-sm">
                <div>
                  <p className="font-medium text-primary-900">
                    {nombreVisible(abonadoElegido)}
                  </p>
                  <p className="text-xs text-primary-600">
                    {abonadoElegido.numero_abonado} — Cédula: {abonadoElegido.cedula}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAbonadoSel('')
                    setBusqueda('')
                  }}
                  className="rounded-md border border-primary-200 bg-white px-2.5 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="relative mt-1">
                <input
                  id="busquedaAbonadoMedidor"
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o cédula…"
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
                        No se encontraron abonados con «{busqueda.trim()}».
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
            <label htmlFor="motivoFallaAdmin" className="block text-sm font-medium text-primary-700">
              Motivo de la falla
            </label>
            <select
              id="motivoFallaAdmin"
              value={motivoFalla}
              onChange={(e) => setMotivoFalla(e.target.value as MotivoFallaMedidor)}
              required
              className="mt-1 w-full rounded-full border border-primary-200 px-4 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              {MOTIVOS_FALLA_MEDIDOR.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="direccionExactaAdmin" className="block text-sm font-medium text-primary-700">
              Dirección exacta o señas escritas
            </label>
            <input
              id="direccionExactaAdmin"
              type="text"
              value={direccionExacta}
              onChange={(e) => setDireccionExacta(e.target.value)}
              required
              minLength={15}
              maxLength={255}
              placeholder="Ubicación detallada del medidor para el personal técnico"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="justificacionAdmin" className="block text-sm font-medium text-primary-700">
              Detalle técnico o justificación
            </label>
            <textarea
              id="justificacionAdmin"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              required
              minLength={10}
              maxLength={255}
              rows={3}
              placeholder="Motivo de la solicitud reportado por ventanilla"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="evidenciaAdmin" className="block text-sm font-medium text-primary-700">
              Fotografía o evidencia del medidor (Máx 5MB)
            </label>
            <input
              ref={fileInputRef}
              id="evidenciaAdmin"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={onFileChange}
              required
              className="mt-1 w-full text-sm text-primary-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
            />
            {archivoPreview && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={archivoPreview}
                  alt="Vista previa de evidencia"
                  className="h-20 w-20 rounded-lg border border-primary-200 object-cover shadow-sm"
                />
                <span className="text-xs text-primary-600 font-medium">
                  {archivo?.name}
                </span>
              </div>
            )}
            {!archivoPreview && archivo && (
              <div className="mt-2 text-xs font-medium text-primary-700">
                Archivo seleccionado: {archivo.name}
              </div>
            )}
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
            titulo="No hay solicitudes de cambio de medidor"
            descripcion="Las solicitudes registradas aparecerán aquí."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-primary-100 text-sm">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Código</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Abonado</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Motivo</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Evidencia</th>
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
                    <td className="px-4 py-3 font-medium text-primary-800">{s.motivo_falla}</td>
                    <td className="px-4 py-3">
                      {s.evidencia_url ? (
                        <a
                          href={s.evidencia_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                        >
                          Ver archivo
                        </a>
                      ) : (
                        <span className="text-xs text-primary-400">Sin archivo</span>
                      )}
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

// ---------------------------------------------------------------------------
// Modal de detalle y resolución de cambio de medidor con vista de evidencia
// ---------------------------------------------------------------------------
function ModalDetalle({
  solicitud,
  motivoRechazo,
  setMotivoRechazo,
  gestionando,
  onCerrar,
  onGestionar,
}: {
  solicitud: SolicitudCambioMedidor
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
              Solicitud de cambio o revisión de medidor
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
              {solicitud.cedula && (
                <span className="ml-2 text-xs text-primary-500">— Cédula: {solicitud.cedula}</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-primary-400">Motivo de falla</dt>
            <dd className="mt-0.5 font-semibold text-primary-900">{solicitud.motivo_falla}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-primary-400">Fecha de creación</dt>
            <dd className="mt-0.5 text-primary-800">{formatearFecha(solicitud.fecha_creacion)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">Dirección exacta</dt>
            <dd className="mt-0.5 text-primary-800">{solicitud.direccion_exacta}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">Detalle o justificación</dt>
            <dd className="mt-0.5 text-primary-800">{solicitud.justificacion}</dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">Evidencia fotográfica</dt>
            <dd className="mt-1">
              {solicitud.evidencia_url ? (
                <div className="space-y-2">
                  <a
                    href={solicitud.evidencia_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-block overflow-hidden rounded-lg border border-primary-200"
                  >
                    <img
                      src={solicitud.evidencia_url}
                      alt="Evidencia del medidor"
                      className="max-h-48 w-auto rounded-lg object-contain transition-transform group-hover:scale-105"
                      onError={(e) => {
                        // Si es PDF o no se puede cargar imagen directa
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline">
                        Abrir archivo en tamaño completo ↗
                      </span>
                    </div>
                  </a>
                </div>
              ) : (
                <p className="text-xs text-primary-400">No se adjuntó evidencia.</p>
              )}
            </dd>
          </div>

          {solicitud.motivo_rechazo && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-red-500">Motivo de rechazo</dt>
              <dd className="mt-0.5 text-red-700">{solicitud.motivo_rechazo}</dd>
            </div>
          )}
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
            <label htmlFor="motivoRechazoMedidor" className="block text-sm font-medium text-primary-700">
              Motivo (obligatorio al rechazar)
            </label>
            <textarea
              id="motivoRechazoMedidor"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows={3}
              placeholder="Ej: La fotografía adjunta no corresponde al medidor o no se aprecia el daño"
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

export default SolicitudesCambioMedidor