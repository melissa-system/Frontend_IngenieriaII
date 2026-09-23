import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  cambiarEstadoSolicitudConexion,
  crearSolicitudConexion,
  obtenerSolicitudesConexion,
  obtenerSolicitudesPajaAguaDisponibles,
  reglasAdjuntos,
  etiquetaFormaPago,
  etiquetaMedioNotificacion,
  etiquetaServicioSolicitado,
  etiquetaTipoTramite,
  FORMA_PAGO_OPCIONES,
  MEDIO_NOTIFICACION_OPCIONES,
  SERVICIO_OPCIONES,
  TIPO_TRAMITE_OPCIONES,
  type AdjuntoConexion,
  type EstadoSolicitud,
  type SolicitudConexion,
  type SolicitudPajaAguaDisponible,
} from '../../components/Services/conexionPajaAgua.service'
import { FileDropZone, validarDocumento } from '../../components/common/FileDropZone'
import { FirmaCanvas } from '../../components/common/FirmaCanvas'
import { extensionDesdeUrl } from '../../lib/descargarArchivo'
import {
  descargarDocumentoConexion,
  generarDocumentoConexion,
} from '../../lib/generarDocumentoConexion'
import Toast, { type TipoToast } from '../../components/Dashboard/Toast'

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

function BadgeEstado({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoColor(estado)}`}
    >
      {ESTADO_LABELS[estado]}
    </span>
  )
}

function formatearFecha(fecha: string): string {
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
}

function EmptyState({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 bg-white py-16 text-center shadow-sm">
      <p className="text-lg font-medium text-primary-700">{titulo}</p>
      <p className="mt-1 text-sm text-primary-400">{descripcion}</p>
    </div>
  )
}

function SolicitudesConexion() {
  const { rolEfectivo } = useAuth()
  const esAbonado = rolEfectivo === 'Abonado'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">Conexión de servicio</h1>
        <p className="mt-1 text-sm text-primary-500">
          {esAbonado
            ? 'Segunda parte del trámite de paja de agua: la Solicitud de conexión de servicio'
            : 'Gestioná las solicitudes de conexión de servicio de los abonados'}
        </p>
      </div>

      {esAbonado ? <VistaAbonado /> : <VistaAdministrador />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista del ABONADO
// ---------------------------------------------------------------------------
function VistaAbonado() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [disponibles, setDisponibles] = useState<SolicitudPajaAguaDisponible[]>([])
  const [misSolicitudes, setMisSolicitudes] = useState<SolicitudConexion[]>([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [toast, setToast] = useState<{ mensaje: string; tipo: TipoToast } | null>(null)

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const [disp, mias] = await Promise.all([
        obtenerSolicitudesPajaAguaDisponibles(),
        obtenerSolicitudesConexion(),
      ])
      setDisponibles(disp)
      setMisSolicitudes(mias)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar tus datos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-primary-500">Cargando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">{error}</p>
      </div>
    )
  }

  if (mostrarFormulario) {
    return (
      <FormularioConexion
        disponibles={disponibles}
        onCancelar={() => setMostrarFormulario(false)}
        onExito={() => {
          setMostrarFormulario(false)
          setToast({ mensaje: 'Solicitud de conexión enviada correctamente.', tipo: 'exito' })
          cargar()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />
      )}

      {disponibles.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
          <div>
            <p className="font-medium text-primary-900">
              Tienes {disponibles.length === 1 ? 'una solicitud' : `${disponibles.length} solicitudes`} de paja de agua aprobada{disponibles.length === 1 ? '' : 's'}
            </p>
            <p className="mt-0.5 text-sm text-primary-500">
              Podés iniciar la Solicitud de conexión de servicio correspondiente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
          >
            Iniciar solicitud
          </button>
        </div>
      )}

      {misSolicitudes.length === 0 && disponibles.length === 0 && (
        <EmptyState
          titulo="Aún no tienes solicitudes de conexión"
          descripcion="Cuando tu solicitud de paja de agua quede aprobada, vas a poder iniciar acá la Solicitud de conexión de servicio."
        />
      )}

      {misSolicitudes.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-primary-100 text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Código</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Trámite</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {misSolicitudes.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-primary-900">{s.codigo_solicitud}</td>
                  <td className="px-4 py-3 text-primary-700">{etiquetaTipoTramite(s.tipo_tramite)}</td>
                  <td className="px-4 py-3 text-primary-500">{formatearFecha(s.fecha_creacion)}</td>
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
  )
}

// ---------------------------------------------------------------------------
// Formulario de creación (Abonado)
// ---------------------------------------------------------------------------
function FormularioConexion({
  disponibles,
  onCancelar,
  onExito,
}: {
  disponibles: SolicitudPajaAguaDisponible[]
  onCancelar: () => void
  onExito: () => void
}) {
  const [idSeleccionado, setIdSeleccionado] = useState(disponibles[0]?.id ?? 0)
  const seleccionada = useMemo(
    () => disponibles.find((d) => d.id === idSeleccionado) ?? disponibles[0],
    [disponibles, idSeleccionado],
  )

  const [medioPrincipal, setMedioPrincipal] = useState('correo')
  const [valorPrincipal, setValorPrincipal] = useState(seleccionada?.correo ?? '')
  const [medioSecundario, setMedioSecundario] = useState('')
  const [valorSecundario, setValorSecundario] = useState('')

  const [folioReal, setFolioReal] = useState('')
  const [planoCatastro, setPlanoCatastro] = useState('')
  const [planoAgrimensura, setPlanoAgrimensura] = useState('')
  const [numeroDisponibilidad, setNumeroDisponibilidad] = useState('')
  const [numeroNis, setNumeroNis] = useState('')

  const [servicio, setServicio] = useState('agua_potable')
  const [tipoTramite, setTipoTramite] = useState('nueva_conexion')
  const [codigoApcCfia, setCodigoApcCfia] = useState('')
  const [formaPago, setFormaPago] = useState('efectivo_previo')

  const [nombreFirmante, setNombreFirmante] = useState(seleccionada?.nombre_solicitante ?? '')
  const [identificacionFirmante, setIdentificacionFirmante] = useState(
    seleccionada?.identificacion ?? '',
  )
  const [firma, setFirma] = useState<File | null>(null)

  const reglas = useMemo(
    () =>
      reglasAdjuntos(
        seleccionada?.naturaleza_inmueble ?? null,
        seleccionada?.calidad_titular ?? null,
        tipoTramite,
      ),
    [seleccionada, tipoTramite],
  )
  const [archivos, setArchivos] = useState<Record<string, File | null>>({})
  const [previews, setPreviews] = useState<Record<string, string | null>>({})
  const [errores, setErrores] = useState<Record<string, string>>({})

  const [enviando, setEnviando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  function manejarArchivo(tipo: string, file: File) {
    const err = validarDocumento(file)
    setErrores((prev) => ({ ...prev, [tipo]: err ?? '' }))
    if (err) return
    setArchivos((prev) => ({ ...prev, [tipo]: file }))
    setPreviews((prev) => ({ ...prev, [tipo]: URL.createObjectURL(file) }))
  }
  function quitarArchivo(tipo: string) {
    setArchivos((prev) => ({ ...prev, [tipo]: null }))
    setPreviews((prev) => ({ ...prev, [tipo]: null }))
  }

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault()
    setErrorGeneral(null)

    if (!seleccionada) return
    if (!firma) {
      setErrorGeneral('Debes firmar la solicitud antes de enviarla.')
      return
    }
    const faltantes = reglas.filter((r) => r.requerido && !archivos[r.tipo])
    if (faltantes.length > 0) {
      setErrorGeneral(
        `Faltan documentos obligatorios: ${faltantes.map((f) => f.etiqueta).join(', ')}`,
      )
      return
    }

    setEnviando(true)
    try {
      await crearSolicitudConexion({
        idSolicitudPajaAgua: seleccionada.id,
        medioNotificacionPrincipal: medioPrincipal,
        valorNotificacionPrincipal: valorPrincipal,
        medioNotificacionSecundario: medioSecundario || undefined,
        valorNotificacionSecundario: valorSecundario || undefined,
        folioReal: folioReal || undefined,
        planoCatastro: planoCatastro || undefined,
        planoAgrimensura: planoAgrimensura || undefined,
        numeroDisponibilidad,
        numeroNis: numeroNis || undefined,
        servicioSolicitado: servicio,
        tipoTramite,
        codigoApcCfia: codigoApcCfia || undefined,
        formaPago,
        nombreFirmante,
        identificacionFirmante,
        firma,
        adjuntos: reglas
          .filter((r) => archivos[r.tipo])
          .map((r) => ({ tipo: r.tipo, etiqueta: r.etiqueta, archivo: archivos[r.tipo]! })),
      })
      onExito()
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  if (!seleccionada) return null

  return (
    <form onSubmit={manejarEnvio} className="space-y-6">
      {disponibles.length > 1 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-primary-700">
            Solicitud de paja de agua correspondiente
          </label>
          <select
            value={idSeleccionado}
            onChange={(e) => setIdSeleccionado(Number(e.target.value))}
            className="h-10 w-full rounded-full border border-primary-200 bg-white px-4 text-sm text-primary-900 focus:border-primary-500 focus:outline-none sm:w-96"
          >
            {disponibles.map((d) => (
              <option key={d.id} value={d.id}>
                {d.codigo_solicitud} — {d.nombre_solicitante}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* I y III: datos ya capturados, de solo lectura */}
      <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-5">
        <p className="mb-3 text-xs font-semibold uppercase text-primary-400">
          Datos ya registrados en tu solicitud de paja de agua {seleccionada.codigo_solicitud}
        </p>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-primary-400">
              {seleccionada.tipo_persona === 'juridica' ? 'Razón social' : 'Nombre'}
            </dt>
            <dd className="text-primary-900">{seleccionada.nombre_solicitante}</dd>
          </div>
          <div>
            <dt className="text-xs text-primary-400">Identificación</dt>
            <dd className="text-primary-900">{seleccionada.identificacion}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-primary-400">Ubicación</dt>
            <dd className="text-primary-900">
              {seleccionada.distrito}, {seleccionada.canton}, {seleccionada.provincia}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-primary-400">Naturaleza del inmueble</dt>
            <dd className="text-primary-900">{seleccionada.naturaleza_inmueble ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-primary-400">Calidad del titular</dt>
            <dd className="text-primary-900">{seleccionada.calidad_titular ?? '—'}</dd>
          </div>
        </dl>
      </div>

      {/* II. Medio de notificación */}
      <div>
        <p className="mb-2 text-sm font-semibold text-primary-900">Medio para notificación</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex gap-2">
            <select
              value={medioPrincipal}
              onChange={(e) => setMedioPrincipal(e.target.value)}
              className="h-10 rounded-full border border-primary-200 bg-white px-3 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            >
              {MEDIO_NOTIFICACION_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={valorPrincipal}
              onChange={(e) => setValorPrincipal(e.target.value)}
              placeholder="Medio principal"
              className="h-10 flex-1 rounded-lg border border-primary-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={medioSecundario}
              onChange={(e) => setMedioSecundario(e.target.value)}
              className="h-10 rounded-full border border-primary-200 bg-white px-3 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
            >
              <option value="">Sin medio secundario</option>
              {MEDIO_NOTIFICACION_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={valorSecundario}
              onChange={(e) => setValorSecundario(e.target.value)}
              disabled={!medioSecundario}
              placeholder="Medio secundario (opcional)"
              className="h-10 flex-1 rounded-lg border border-primary-200 px-3 text-sm focus:border-primary-500 focus:outline-none disabled:bg-primary-50"
            />
          </div>
        </div>
      </div>

      {/* III. Información adicional del inmueble */}
      <div>
        <p className="mb-2 text-sm font-semibold text-primary-900">Información del inmueble</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={folioReal}
            onChange={(e) => setFolioReal(e.target.value)}
            placeholder="Folio real / Concesión / Arriendo / Asignación"
            className="h-10 rounded-lg border border-primary-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
          />
          <input
            type="text"
            value={planoCatastro}
            onChange={(e) => setPlanoCatastro(e.target.value)}
            placeholder="Plano catastro"
            className="h-10 rounded-lg border border-primary-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
          />
          <input
            type="text"
            value={planoAgrimensura}
            onChange={(e) => setPlanoAgrimensura(e.target.value)}
            placeholder="Plano de agrimensura"
            className="h-10 rounded-lg border border-primary-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
          />
          <input
            type="text"
            required
            value={numeroDisponibilidad}
            onChange={(e) => setNumeroDisponibilidad(e.target.value)}
            placeholder="Número de disponibilidad *"
            className="h-10 rounded-lg border border-primary-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
          />
          <input
            type="text"
            value={numeroNis}
            onChange={(e) => setNumeroNis(e.target.value)}
            placeholder="Número de NIS (si existe)"
            className="h-10 rounded-lg border border-primary-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>

      {/* IV. Propósito de la solicitud */}
      <div>
        <p className="mb-2 text-sm font-semibold text-primary-900">Propósito de la solicitud</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={servicio}
            onChange={(e) => setServicio(e.target.value)}
            className="h-10 rounded-full border border-primary-200 bg-white px-4 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
          >
            {SERVICIO_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={tipoTramite}
            onChange={(e) => setTipoTramite(e.target.value)}
            className="h-10 rounded-full border border-primary-200 bg-white px-4 text-sm text-primary-900 focus:border-primary-500 focus:outline-none"
          >
            {TIPO_TRAMITE_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {tipoTramite === 'servicio_provisional_proyectos' && (
            <input
              type="text"
              value={codigoApcCfia}
              onChange={(e) => setCodigoApcCfia(e.target.value)}
              placeholder="Código APC / CFIA"
              className="h-10 rounded-lg border border-primary-200 px-3 text-sm focus:border-primary-500 focus:outline-none sm:col-span-2"
            />
          )}
          <select
            value={formaPago}
            onChange={(e) => setFormaPago(e.target.value)}
            className="h-10 rounded-full border border-primary-200 bg-white px-4 text-sm text-primary-900 focus:border-primary-500 focus:outline-none sm:col-span-2"
          >
            {FORMA_PAGO_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VII. Adjuntos dinámicos */}
      <div>
        <p className="mb-2 text-sm font-semibold text-primary-900">Documentos requeridos</p>
        <div className="space-y-4">
          {reglas.map((r) => (
            <FileDropZone
              key={r.tipo}
              label={r.etiqueta}
              obligatorio={r.requerido}
              archivo={archivos[r.tipo] ?? null}
              archivoPreview={previews[r.tipo] ?? null}
              onFileSelect={(file) => manejarArchivo(r.tipo, file)}
              onRemoveFile={() => quitarArchivo(r.tipo)}
              errorArchivo={errores[r.tipo] || undefined}
            />
          ))}
        </div>
      </div>

      {/* V. Firma */}
      <div>
        <p className="mb-2 text-sm font-semibold text-primary-900">Firma del solicitante</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            required
            value={nombreFirmante}
            onChange={(e) => setNombreFirmante(e.target.value)}
            placeholder="Nombre completo"
            className="h-10 rounded-lg border border-primary-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
          />
          <input
            type="text"
            required
            value={identificacionFirmante}
            onChange={(e) => setIdentificacionFirmante(e.target.value)}
            placeholder="Identificación"
            className="h-10 rounded-lg border border-primary-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
        <div className="mt-3">
          <FirmaCanvas onChange={setFirma} />
        </div>
      </div>

      {errorGeneral && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {errorGeneral}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-primary-100 pt-4">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
        >
          {enviando ? 'Enviando...' : 'Enviar solicitud'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando}
          className="rounded-full border border-primary-200 px-5 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Vista del ADMINISTRADOR
// ---------------------------------------------------------------------------
const MIN_MOTIVO = 10

function VistaAdministrador() {
  const [solicitudes, setSolicitudes] = useState<SolicitudConexion[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<SolicitudConexion | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [gestionando, setGestionando] = useState(false)
  const [toast, setToast] = useState<{ mensaje: string; tipo: TipoToast } | null>(null)

  async function cargar() {
    setCargando(true)
    setErrorCarga(null)
    try {
      setSolicitudes(await obtenerSolicitudesConexion())
    } catch (err) {
      setErrorCarga(err instanceof Error ? err.message : 'No se pudieron cargar las solicitudes.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  async function gestionar(estado: 'en_proceso' | 'aprobado' | 'rechazado') {
    if (!detalle) return
    setGestionando(true)
    try {
      await cambiarEstadoSolicitudConexion(detalle.id, {
        estado,
        motivoRechazo: estado === 'rechazado' ? motivoRechazo : undefined,
      })
      setToast({
        mensaje:
          estado === 'aprobado'
            ? 'Solicitud aprobada.'
            : estado === 'rechazado'
              ? 'Solicitud rechazada.'
              : 'Solicitud marcada en proceso.',
        tipo: 'exito',
      })
      setDetalle(null)
      setMotivoRechazo('')
      cargar()
    } catch (err) {
      setToast({
        mensaje: err instanceof Error ? err.message : 'No se pudo actualizar la solicitud.',
        tipo: 'error',
      })
    } finally {
      setGestionando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-primary-500">Cargando solicitudes...</p>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">{errorCarga}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {toast && (
        <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />
      )}

      {solicitudes.length === 0 ? (
        <EmptyState
          titulo="No hay solicitudes de conexión"
          descripcion="Las solicitudes de conexión de servicio que envíen los abonados aparecerán aquí."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-primary-100 text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Código</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Abonado</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Trámite</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-primary-900">{s.codigo_solicitud}</td>
                  <td className="px-4 py-3 text-primary-700">{s.nombre_abonado}</td>
                  <td className="px-4 py-3 text-primary-700">{etiquetaTipoTramite(s.tipo_tramite)}</td>
                  <td className="px-4 py-3 text-primary-500">{formatearFecha(s.fecha_creacion)}</td>
                  <td className="px-4 py-3">
                    <BadgeEstado estado={s.estado} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDetalle(s)}
                      className="rounded-full border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detalle && (
        <ModalDetalle
          solicitud={detalle}
          motivoRechazo={motivoRechazo}
          setMotivoRechazo={setMotivoRechazo}
          gestionando={gestionando}
          onCerrar={() => {
            setDetalle(null)
            setMotivoRechazo('')
          }}
          onGestionar={gestionar}
        />
      )}
    </div>
  )
}

function ModalDetalle({
  solicitud,
  motivoRechazo,
  setMotivoRechazo,
  gestionando,
  onCerrar,
  onGestionar,
}: {
  solicitud: SolicitudConexion
  motivoRechazo: string
  setMotivoRechazo: (valor: string) => void
  gestionando: boolean
  onCerrar: () => void
  onGestionar: (estado: 'en_proceso' | 'aprobado' | 'rechazado') => void
}) {
  const [expandido, setExpandido] = useState(false)
  const [mostrarMotivo, setMostrarMotivo] = useState(false)
  const [generando, setGenerando] = useState(false)

  const esFinal = solicitud.estado === 'aprobado' || solicitud.estado === 'rechazado'
  const motivoValido = motivoRechazo.trim().length >= MIN_MOTIVO

  function manejarClicRechazar() {
    if (!mostrarMotivo) {
      setMostrarMotivo(true)
      return
    }
    if (motivoValido) onGestionar('rechazado')
  }

  async function manejarDescargarDocumento() {
    setGenerando(true)
    try {
      const blob = await generarDocumentoConexion(solicitud)
      descargarDocumentoConexion(blob, solicitud.codigo_solicitud)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">{solicitud.codigo_solicitud}</h3>
            <p className="mt-0.5 text-sm text-primary-500">
              Solicitud de conexión de servicio — {solicitud.solicitud_paja_agua_codigo}
            </p>
          </div>
          <BadgeEstado estado={solicitud.estado} />
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Campo etiqueta="Abonado" valor={solicitud.nombre_abonado} />
          <Campo etiqueta="Cédula" valor={solicitud.cedula} />
          <Campo etiqueta="Trámite" valor={etiquetaTipoTramite(solicitud.tipo_tramite)} />
          <Campo etiqueta="Servicio solicitado" valor={etiquetaServicioSolicitado(solicitud.servicio_solicitado)} />
          <Campo etiqueta="Número de disponibilidad" valor={solicitud.numero_disponibilidad} />

          {solicitud.motivo_rechazo && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-red-500">Motivo de rechazo</dt>
              <dd className="mt-0.5 text-red-700">{solicitud.motivo_rechazo}</dd>
            </div>
          )}
        </dl>

        <button
          type="button"
          onClick={() => setExpandido(!expandido)}
          className="mt-3 text-sm font-semibold text-primary-700 hover:text-primary-900"
        >
          {expandido ? '▲ Leer menos' : '▼ Leer más'}
        </button>

        {expandido && (
          <>
            <dl className="mt-4 grid grid-cols-1 gap-4 border-t border-primary-100 pt-4 text-sm sm:grid-cols-2">
              <Campo
                etiqueta="Medio de notificación principal"
                valor={`${etiquetaMedioNotificacion(solicitud.medio_notificacion_principal)}: ${solicitud.valor_notificacion_principal}`}
                colSpan2
              />
              {solicitud.medio_notificacion_secundario && (
                <Campo
                  etiqueta="Medio de notificación secundario"
                  valor={`${etiquetaMedioNotificacion(solicitud.medio_notificacion_secundario)}: ${solicitud.valor_notificacion_secundario}`}
                  colSpan2
                />
              )}
              <Campo etiqueta="Folio real" valor={solicitud.folio_real ?? '—'} />
              <Campo etiqueta="Plano catastro" valor={solicitud.plano_catastro ?? '—'} />
              <Campo etiqueta="Plano de agrimensura" valor={solicitud.plano_agrimensura ?? '—'} />
              <Campo etiqueta="Número de NIS" valor={solicitud.numero_nis ?? '—'} />
              <Campo etiqueta="Código APC/CFIA" valor={solicitud.codigo_apc_cfia ?? '—'} />
              <Campo etiqueta="Forma de pago" valor={etiquetaFormaPago(solicitud.forma_pago)} />
              <Campo etiqueta="Firmante" valor={solicitud.nombre_firmante} />
              <Campo etiqueta="Identificación del firmante" valor={solicitud.identificacion_firmante} />
            </dl>

            <div className="mt-5 border-t border-primary-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-primary-400">
                Firma capturada
              </p>
              <img
                src={solicitud.firma_path}
                alt="Firma del solicitante"
                className="h-24 rounded-lg border border-primary-100 bg-white"
              />
            </div>

            <div className="mt-5 border-t border-primary-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-primary-400">
                Documentos adjuntos
              </p>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {solicitud.adjuntos.map((a: AdjuntoConexion) => (
                  <div key={a.publicId}>
                    <dt className="text-xs text-primary-400">{a.etiqueta}</dt>
                    <dd>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-700 underline hover:text-primary-900"
                      >
                        Ver documento ({extensionDesdeUrl(a.url)})
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-5 border-t border-primary-100 pt-4">
              <button
                type="button"
                onClick={manejarDescargarDocumento}
                disabled={generando}
                className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-60"
              >
                {generando ? 'Generando…' : 'Descargar documento (Word)'}
              </button>
            </div>
          </>
        )}

        {esFinal ? (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-full bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3 border-t border-primary-100 pt-4">
            {mostrarMotivo && (
              <>
                <label
                  htmlFor="motivoRechazoConexion"
                  className="block text-sm font-medium text-primary-700"
                >
                  Motivo (obligatorio al rechazar)
                </label>
                <textarea
                  id="motivoRechazoConexion"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  rows={3}
                  placeholder="Ej: Documentación incompleta o ilegible..."
                  className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
                {motivoRechazo.trim().length > 0 && !motivoValido && (
                  <p className="text-xs text-amber-600">
                    Escribe al menos {MIN_MOTIVO} caracteres para poder rechazar (llevas{' '}
                    {motivoRechazo.trim().length}).
                  </p>
                )}
              </>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => onGestionar('en_proceso')}
                disabled={gestionando || solicitud.estado === 'en_proceso'}
                className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {gestionando ? 'Guardando...' : 'Marcar en proceso'}
              </button>
              <button
                type="button"
                onClick={() => onGestionar('aprobado')}
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
                onClick={onCerrar}
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
  )
}

function Campo({
  etiqueta,
  valor,
  colSpan2,
}: {
  etiqueta: string
  valor: string
  colSpan2?: boolean
}) {
  return (
    <div className={colSpan2 ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-medium uppercase text-primary-400">{etiqueta}</dt>
      <dd className="mt-0.5 text-primary-900">{valor}</dd>
    </div>
  )
}

export default SolicitudesConexion
