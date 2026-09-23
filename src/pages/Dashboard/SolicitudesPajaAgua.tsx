import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  obtenerSolicitudesPajaAgua,
  cambiarEstadoSolicitudPajaAgua,
  type SolicitudPajaAgua,
} from '../../components/Services/solicitudes.service'
import {
  obtenerConfiguracion,
  type Configuracion,
} from '../../components/Services/configuracion.service'
import {
  generarDocumentoSolicitud,
  descargarDocumentoSolicitud,
  type DatosDocumentoSolicitud,
} from '../../lib/generarDocumentoSolicitud'
import { descargarArchivo, extensionDesdeUrl } from '../../lib/descargarArchivo'
import Toast from '../../components/Dashboard/Toast'

// Traduce una fila de la tabla (forma de SolicitudPajaAgua) a la forma
// común que espera el generador de documentos — la misma función que usa
// el wizard público justo después de enviar la solicitud.
function aDatosDocumento(s: SolicitudPajaAgua): DatosDocumentoSolicitud {
  return {
    codigoSolicitud: s.codigo_solicitud,
    fecha: s.fecha_solicitud,
    tipoPersona: s.tipo_persona,
    nombreSolicitante: s.nombre_solicitante,
    identificacion: s.identificacion,
    nombreRepresentante: s.nombre_representante,
    cedulaRepresentante: s.cedula_representante,
    telefono: s.telefono,
    telefonoSecundario: s.telefono_secundario,
    correo: s.correo,
    provincia: s.provincia,
    canton: s.canton,
    distrito: s.distrito,
    direccion: s.direccion,
    numeroPlano: s.numero_plano,
    naturalezaInmueble: s.naturaleza_inmueble,
    calidadTitular: s.calidad_titular,
    tipoServicio: s.tipo_servicio,
    tipoConexion: s.tipo_conexion,
    observaciones: s.observaciones,
  }
}

type Estado = SolicitudPajaAgua['estado']

const ESTADO_COLOR: Record<Estado, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  'En proceso': 'bg-blue-100 text-blue-700',
  Aprobada: 'bg-green-100 text-green-700',
  Rechazada: 'bg-red-100 text-red-700',
  Completada: 'bg-indigo-100 text-indigo-700',
}

// Colores de acento para las tarjetas de resumen y las pestañas de filtro
// (mismo mapeo semántico que ESTADO_COLOR, pero pensado para fondos sólidos
// de tarjeta en vez de badges).
const ESTADO_ACENTO: Record<Estado, string> = {
  Pendiente: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  'En proceso': 'border-blue-200 bg-blue-50 text-blue-700',
  Aprobada: 'border-green-200 bg-green-50 text-green-700',
  Rechazada: 'border-red-200 bg-red-50 text-red-700',
  Completada: 'border-indigo-200 bg-indigo-50 text-indigo-700',
}

const ESTADOS: Estado[] = ['Pendiente', 'En proceso', 'Aprobada', 'Rechazada', 'Completada']

// Mínimo de caracteres del motivo al rechazar — debe coincidir con
// MIN_MOTIVO_RECHAZO_PAJA_AGUA del backend.
const MIN_MOTIVO = 10

// Ignora tildes y mayúsculas para que la búsqueda encuentre "Jose" al
// escribir "josé" y viceversa (mismo criterio que AveriasAdmin.tsx).
function normalizarBusqueda(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function BadgeEstado({ estado }: { estado: Estado }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLOR[estado]}`}
    >
      {estado}
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

function SolicitudesPajaAgua() {
  const [solicitudes, setSolicitudes] = useState<SolicitudPajaAgua[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [detalle, setDetalle] = useState<SolicitudPajaAgua | null>(null)
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [gestionando, setGestionando] = useState(false)
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null)

  const [filtroEstado, setFiltroEstado] = useState<Estado | 'Todas'>('Todas')
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const lista = await obtenerSolicitudesPajaAgua()
      setSolicitudes(lista)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
    // Datos reales de la ASADA (dirección/teléfono/correo) para el
    // documento generado — ruta pública, no hace falta re-manejar errores
    // de sesión acá: si falla, simplemente no se ofrece el documento.
    obtenerConfiguracion()
      .then(setConfiguracion)
      .catch(() => setConfiguracion(null))
  }, [cargar])

  const abrirDetalle = (s: SolicitudPajaAgua) => {
    setMotivoRechazo(s.motivo_rechazo ?? '')
    setDetalle(s)
  }

  // Conteo por estado para las tarjetas de resumen y las pestañas de
  // filtro — se calcula sobre TODAS las solicitudes, sin aplicar la
  // búsqueda de texto, para que los números no "salten" al escribir.
  const conteos = useMemo(() => {
    const base: Record<Estado, number> = {
      Pendiente: 0,
      'En proceso': 0,
      Aprobada: 0,
      Rechazada: 0,
      Completada: 0,
    }
    for (const s of solicitudes) base[s.estado] += 1
    return base
  }, [solicitudes])

  const solicitudesFiltradas = useMemo(() => {
    let resultado =
      filtroEstado === 'Todas' ? solicitudes : solicitudes.filter((s) => s.estado === filtroEstado)

    const q = normalizarBusqueda(busqueda)
    if (q) {
      resultado = resultado.filter((s) => {
        const campos = [
          s.codigo_solicitud,
          s.nombre_solicitante,
          s.identificacion,
          s.correo,
          s.distrito,
          s.canton,
        ]
        return campos.some((c) => normalizarBusqueda(c).includes(q))
      })
    }
    return resultado
  }, [solicitudes, filtroEstado, busqueda])

  const gestionar = async (estado: 'En proceso' | 'Aprobada' | 'Rechazada') => {
    if (!detalle) return
    setGestionando(true)
    setToast(null)
    try {
      await cambiarEstadoSolicitudPajaAgua(detalle.id, {
        estado,
        motivoRechazo: estado === 'Rechazada' ? motivoRechazo : undefined,
      })
      setToast({
        tipo: 'exito',
        mensaje:
          estado === 'Aprobada'
            ? `Solicitud ${detalle.codigo_solicitud} aprobada. Se notificó al solicitante por correo con los próximos pasos.`
            : `Solicitud ${detalle.codigo_solicitud} actualizada a "${estado}".`,
      })
      setDetalle(null)
      setMotivoRechazo('')
      await cargar()
    } catch (err) {
      setToast({
        tipo: 'error',
        mensaje: err instanceof Error ? err.message : 'No se pudo actualizar la solicitud.',
      })
    } finally {
      setGestionando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">Paja de Agua</h1>
        <p className="mt-1 text-sm text-primary-500">
          Solicitudes de disponibilidad de servicio registradas desde el sitio público
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
      )}

      {!cargando && solicitudes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <button
            type="button"
            onClick={() => setFiltroEstado('Todas')}
            className={`rounded-xl border p-3 text-left shadow-sm transition-colors ${
              filtroEstado === 'Todas'
                ? 'border-primary-700 bg-primary-700 text-white'
                : 'border-primary-100 bg-white hover:bg-primary-50'
            }`}
          >
            <p
              className={`text-xs font-medium uppercase ${
                filtroEstado === 'Todas' ? 'text-primary-100' : 'text-primary-400'
              }`}
            >
              Todas
            </p>
            <p className="mt-1 text-2xl font-semibold">{solicitudes.length}</p>
          </button>
          {ESTADOS.map((estado) => (
            <button
              key={estado}
              type="button"
              onClick={() => setFiltroEstado(estado)}
              className={`rounded-xl border p-3 text-left shadow-sm transition-colors ${
                filtroEstado === estado
                  ? `${ESTADO_ACENTO[estado]} ring-1 ring-inset ring-current`
                  : 'border-primary-100 bg-white hover:bg-primary-50'
              }`}
            >
              <p className="text-xs font-medium uppercase text-primary-400">{estado}</p>
              <p className="mt-1 text-2xl font-semibold text-primary-900">{conteos[estado]}</p>
            </button>
          ))}
        </div>
      )}

      {!cargando && solicitudes.length > 0 && (
        <div className="relative w-full sm:w-96">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar por código, nombre, cédula o correo…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-primary-200 py-2.5 pl-10 pr-9 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              title="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-primary-300 hover:bg-primary-100 hover:text-primary-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {cargando ? (
        <p className="text-sm text-primary-400">Cargando solicitudes…</p>
      ) : solicitudes.length === 0 ? (
        <EmptyState
          titulo="No hay solicitudes registradas de este tipo."
          descripcion="Las solicitudes de paja de agua enviadas desde el sitio público aparecerán aquí."
        />
      ) : solicitudesFiltradas.length === 0 ? (
        <EmptyState
          titulo="Ninguna solicitud coincide con el filtro."
          descripcion="Probá con otro estado o limpiá la búsqueda."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-primary-100 text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Código</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Solicitante</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {solicitudesFiltradas.map((s) => (
                <tr key={s.id} className="hover:bg-primary-50/50">
                  <td className="px-4 py-3 font-medium text-primary-800">{s.codigo_solicitud}</td>
                  <td className="px-4 py-3 text-primary-600">
                    <div className="font-medium text-primary-800">{s.nombre_solicitante}</div>
                    <div className="text-xs text-primary-400">{s.identificacion}</div>
                  </td>
                  <td className="px-4 py-3">
                    <BadgeEstado estado={s.estado} />
                  </td>
                  <td className="px-4 py-3 text-primary-500">
                    {formatearFecha(s.fecha_solicitud)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => abrirDetalle(s)}
                      className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50"
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
          configuracion={configuracion}
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

// Fila dt/dd reutilizable para el modal de detalle.
function Campo({
  etiqueta,
  valor,
  colSpan2,
}: {
  etiqueta: string
  valor: ReactNode
  colSpan2?: boolean
}) {
  return (
    <div className={colSpan2 ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-medium uppercase text-primary-400">{etiqueta}</dt>
      <dd className="mt-0.5 text-primary-800">{valor}</dd>
    </div>
  )
}

function EnlaceDocumento({ etiqueta, url }: { etiqueta: string; url: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-primary-400">{etiqueta}</dt>
      <dd className="mt-0.5">
        {url ? (
          <button
            type="button"
            onClick={() => {
              const nombreArchivo = etiqueta
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .toLowerCase()
              descargarArchivo(url, `${nombreArchivo}${extensionDesdeUrl(url)}`)
            }}
            className="font-medium text-primary-700 hover:underline"
          >
            Descargar →
          </button>
        ) : (
          <span className="text-primary-300">No adjuntado</span>
        )}
      </dd>
    </div>
  )
}

// Modal de detalle + gestión: muestra toda la información de la solicitud y,
// si todavía no está en un estado final, permite Marcar en proceso / Aprobar
// / Rechazar (al aprobar, el backend crea/vincula el Abonado y notifica por
// correo los próximos pasos).
function ModalDetalle({
  solicitud,
  configuracion,
  motivoRechazo,
  setMotivoRechazo,
  gestionando,
  onCerrar,
  onGestionar,
}: {
  solicitud: SolicitudPajaAgua
  configuracion: Configuracion | null
  motivoRechazo: string
  setMotivoRechazo: (valor: string) => void
  gestionando: boolean
  onCerrar: () => void
  onGestionar: (estado: 'En proceso' | 'Aprobada' | 'Rechazada') => void
}) {
  const [generandoDocumento, setGenerandoDocumento] = useState(false)
  const [mostrarMotivo, setMostrarMotivo] = useState(false)
  const [expandido, setExpandido] = useState(false)

  const esFinal =
    solicitud.estado === 'Aprobada' ||
    solicitud.estado === 'Rechazada' ||
    solicitud.estado === 'Completada'
  const motivoValido = motivoRechazo.trim().length >= MIN_MOTIVO

  async function manejarDescargarDocumento() {
    if (!configuracion) return
    setGenerandoDocumento(true)
    try {
      const blob = await generarDocumentoSolicitud(aDatosDocumento(solicitud), configuracion)
      descargarDocumentoSolicitud(blob, solicitud.codigo_solicitud)
    } finally {
      setGenerandoDocumento(false)
    }
  }

  // Primer clic en "Rechazar" solo despliega el campo de motivo; el segundo
  // (ya con motivo válido) confirma el rechazo.
  function manejarClicRechazar() {
    if (!mostrarMotivo) {
      setMostrarMotivo(true)
      return
    }
    if (motivoValido) onGestionar('Rechazada')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              {solicitud.codigo_solicitud}
            </h3>
            <p className="mt-0.5 text-sm text-primary-500">
              Solicitud de disponibilidad de servicio (Paja de Agua)
            </p>
          </div>
          <BadgeEstado estado={solicitud.estado} />
        </div>

        {/* Vista previa: siempre visible, sin necesidad de expandir */}
        <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Campo
            etiqueta={solicitud.tipo_persona === 'juridica' ? 'Razón social' : 'Nombre'}
            valor={solicitud.nombre_solicitante}
            colSpan2
          />
          <Campo etiqueta="Identificación" valor={solicitud.identificacion} />
          <Campo
            etiqueta="Tipo de persona"
            valor={solicitud.tipo_persona === 'juridica' ? 'Jurídica' : 'Física'}
          />
          <Campo
            etiqueta="Ubicación"
            valor={
              solicitud.provincia
                ? `${solicitud.distrito}, ${solicitud.canton}, ${solicitud.provincia}`
                : 'Sin desglose (solicitud anterior a este cambio)'
            }
            colSpan2
          />
          <Campo etiqueta="Fecha de solicitud" valor={formatearFecha(solicitud.fecha_solicitud)} />

          {solicitud.motivo_rechazo && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-red-500">Motivo de rechazo</dt>
              <dd className="mt-0.5 text-red-700">{solicitud.motivo_rechazo}</dd>
            </div>
          )}

          {solicitud.abonado && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-primary-400">Abonado vinculado</dt>
              <dd className="mt-0.5 text-primary-800">{solicitud.abonado.numero_abonado}</dd>
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
              {solicitud.nombre_representante && (
                <>
                  <Campo etiqueta="Representante legal" valor={solicitud.nombre_representante} />
                  <Campo
                    etiqueta="Cédula del representante"
                    valor={solicitud.cedula_representante ?? '—'}
                  />
                </>
              )}

              <Campo etiqueta="Teléfono" valor={solicitud.telefono} />
              <Campo etiqueta="Teléfono secundario" valor={solicitud.telefono_secundario ?? '—'} />
              <Campo etiqueta="Correo" valor={solicitud.correo} colSpan2 />

              <Campo etiqueta="Dirección exacta" valor={solicitud.direccion} colSpan2 />
              <Campo etiqueta="Número de plano" valor={solicitud.numero_plano} />

              <Campo
                etiqueta="Naturaleza del inmueble"
                valor={solicitud.naturaleza_inmueble ?? '—'}
              />
              <Campo etiqueta="Calidad del titular" valor={solicitud.calidad_titular ?? '—'} />
              <Campo etiqueta="Servicio solicitado" valor={solicitud.tipo_servicio ?? '—'} />
              <Campo etiqueta="Tipo de conexión" valor={solicitud.tipo_conexion ?? '—'} />

              {solicitud.observaciones && (
                <Campo etiqueta="Observaciones" valor={solicitud.observaciones} colSpan2 />
              )}
            </dl>

            <div className="mt-5 border-t border-primary-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-primary-400">
                Documentos adjuntos
              </p>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <EnlaceDocumento etiqueta="Cédula (frente)" url={solicitud.cedula_frente_path} />
                <EnlaceDocumento etiqueta="Cédula (dorso)" url={solicitud.cedula_dorso_path} />
                <EnlaceDocumento
                  etiqueta="Permisos municipales"
                  url={solicitud.permisos_municipales_path}
                />
                <EnlaceDocumento
                  etiqueta="Carta de solicitud"
                  url={solicitud.carta_solicitud_path}
                />
              </dl>
            </div>

            <div className="mt-5 border-t border-primary-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-primary-400">
                Documento de solicitud (machote)
              </p>
              {configuracion ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={manejarDescargarDocumento}
                    disabled={generandoDocumento}
                    className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-60"
                  >
                    {generandoDocumento ? 'Generando…' : 'Descargar documento (Word)'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-primary-400">
                  No se pudo cargar la información de la ASADA para generar el documento.
                </p>
              )}
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
                  htmlFor="motivoRechazoPajaAgua"
                  className="block text-sm font-medium text-primary-700"
                >
                  Motivo (obligatorio al rechazar)
                </label>
                <textarea
                  id="motivoRechazoPajaAgua"
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
                onClick={() => onGestionar('En proceso')}
                disabled={gestionando || solicitud.estado === 'En proceso'}
                className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {gestionando ? 'Guardando...' : 'Marcar en proceso'}
              </button>
              <button
                type="button"
                onClick={() => onGestionar('Aprobada')}
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

export default SolicitudesPajaAgua
