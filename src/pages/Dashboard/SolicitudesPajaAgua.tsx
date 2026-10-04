import ErrorState from '../../components/ui/ErrorState'
import Cargando from '../../components/ui/Cargando'
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  obtenerSolicitudesPajaAgua,
  cambiarEstadoSolicitudPajaAgua,
  type SolicitudPajaAgua,
} from '../../components/Services/solicitudes.service'
import {
  generarPdfSolicitud,
  descargarPdfSolicitud,
  type DatosDocumentoSolicitud,
} from '../../lib/generarPdfSolicitud'
import { descargarArchivo, extensionDesdeUrl } from '../../lib/descargarArchivo'
import Toast from '../../components/ui/Toast'
import BarraFiltrosSolicitudes from '../../components/Dashboard/BarraFiltrosSolicitudes'
import PaginadorSolicitudes from '../../components/Dashboard/PaginadorSolicitudes'
import {
  useFiltrosSolicitudes,
  type FiltroEstado,
} from '../../lib/useFiltrosSolicitudes'
import Modal from '../../components/ui/Modal'
import Table from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import BadgeEstado from '../../components/ui/BadgeEstado'
import Button from '../../components/ui/Button'

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


// Mínimo de caracteres del motivo al rechazar — debe coincidir con
// MIN_MOTIVO_RECHAZO_PAJA_AGUA del backend.
const MIN_MOTIVO = 10

// Estados disponibles en el filtro de la barra de herramientas.
const ESTADOS_FILTRO: FiltroEstado[] = [
  { valor: 'Pendiente', etiqueta: 'Pendiente' },
  { valor: 'En proceso', etiqueta: 'En proceso' },
  { valor: 'Aprobada', etiqueta: 'Aprobada' },
  { valor: 'Rechazada', etiqueta: 'Rechazada' },
  { valor: 'Completada', etiqueta: 'Completada' },
]

function formatearFecha(fecha: string): string {
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
}

function SolicitudesPajaAgua() {
  const [solicitudes, setSolicitudes] = useState<SolicitudPajaAgua[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [detalle, setDetalle] = useState<SolicitudPajaAgua | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [gestionando, setGestionando] = useState(false)
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null)

  const filtros = useFiltrosSolicitudes(solicitudes, {
    estados: ESTADOS_FILTRO,
    camposBusqueda: (s) => [
      s.codigo_solicitud,
      s.nombre_solicitante,
      s.identificacion,
      s.correo,
      s.distrito,
      s.canton,
    ],
    estadoDe: (s) => s.estado,
    fechaDe: (s) => s.fecha_solicitud,
  })

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
  }, [cargar])

  const abrirDetalle = (s: SolicitudPajaAgua) => {
    setMotivoRechazo(s.motivo_rechazo ?? '')
    setDetalle(s)
  }

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
        <h1 className="text-titulo-pagina font-semibold text-primary-900">Paja de Agua</h1>
        <p className="mt-1 text-sm text-primary-500">
          Solicitudes de disponibilidad de servicio registradas desde el sitio público
        </p>
      </div>

      {error && <ErrorState mensaje={error} onReintentar={cargar} />}

      {!cargando && solicitudes.length > 0 && (
        <BarraFiltrosSolicitudes
          busca={filtros.busqueda}
          manejarBusqueda={filtros.cambiarBusqueda}
          placeholder="Buscar por código, nombre, cédula o correo…"
          orden={filtros.orden}
          cambiarOrden={filtros.cambiarOrden}
          filtroEstado={filtros.filtroEstado}
          cambiarEstado={filtros.cambiarEstado}
          estados={ESTADOS_FILTRO}
        />
      )}

      {cargando ? (
        <Cargando texto="Cargando solicitudes…" />
      ) : solicitudes.length === 0 ? (
        <EmptyState
          titulo="No hay solicitudes registradas de este tipo."
          descripcion="Las solicitudes de paja de agua enviadas desde el sitio público aparecerán aquí."
        />
      ) : filtros.filtradas.length === 0 ? (
        <EmptyState
          titulo="Ninguna solicitud coincide con la búsqueda o los filtros."
          descripcion="Probá con otro término, cambiá el estado o limpiá la búsqueda."
        />
      ) : (
        <Table cabecera={['Código', 'Solicitante', 'Estado', 'Fecha', 'Acciones']} pie={<><PaginadorSolicitudes
            total={filtros.filtradas.length}
            primeraFila={filtros.primeraFila}
            porPagina={filtros.porPagina}
            paginaActual={filtros.paginaActual}
            totalPaginas={filtros.totalPaginas}
            numerosPagina={filtros.numerosPagina}
            busca={filtros.busqueda}
            etiqueta="solicitudes"
            irPagina={filtros.irPagina}
          /></>}>
              {filtros.filasVisibles.map((s) => (
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
                    <Button
                      variant="secondary" size="sm"
                      type="button"
                      onClick={() => abrirDetalle(s)}>
                      Ver / gestionar
                    </Button>
                  </td>
                </tr>
              ))}
            </Table>
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
          <span className="text-primary-500">No adjuntado</span>
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
  motivoRechazo,
  setMotivoRechazo,
  gestionando,
  onCerrar,
  onGestionar,
}: {
  solicitud: SolicitudPajaAgua
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
    setGenerandoDocumento(true)
    try {
      const blob = await generarPdfSolicitud(aDatosDocumento(solicitud))
      descargarPdfSolicitud(blob, solicitud.codigo_solicitud)
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
    <Modal size="2xl">
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
              <dt className="text-xs font-medium uppercase text-error-600">Motivo de rechazo</dt>
              <dd className="mt-0.5 text-error-700">{solicitud.motivo_rechazo}</dd>
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
              <div className="flex gap-2">
                <Button
                  variant="secondary" size="sm"
                  type="button"
                  onClick={manejarDescargarDocumento}
                  disabled={generandoDocumento}>
                  {generandoDocumento ? 'Generando…' : 'Descargar documento (PDF)'}
                </Button>
              </div>
            </div>
          </>
        )}

        {esFinal ? (
          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              type="button"
              onClick={onCerrar}>
              Cerrar
            </Button>
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
                  <p className="text-xs text-advertencia-700">
                    Escribe al menos {MIN_MOTIVO} caracteres para poder rechazar (llevas{' '}
                    {motivoRechazo.trim().length}).
                  </p>
                )}
              </>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {solicitud.estado !== 'En proceso' && (
                <Button
                  variant="info"
                  type="button"
                  onClick={() => onGestionar('En proceso')}
                  disabled={gestionando}>
                  {gestionando ? 'Guardando...' : 'Marcar en proceso'}
                </Button>
              )}
              <Button
                variant="success"
                type="button"
                onClick={() => onGestionar('Aprobada')}
                disabled={gestionando}>
                {gestionando ? 'Guardando...' : 'Aprobar'}
              </Button>
              <Button
                variant="danger"
                type="button"
                onClick={manejarClicRechazar}
                disabled={gestionando || (mostrarMotivo && !motivoValido)}>
                {gestionando ? 'Guardando...' : 'Rechazar'}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={onCerrar}
                disabled={gestionando}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
</Modal>
  )
}

export default SolicitudesPajaAgua
