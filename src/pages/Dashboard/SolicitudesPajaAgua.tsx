import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  obtenerSolicitudesPajaAgua,
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
  Aprobada: 'bg-green-100 text-green-700',
  Rechazada: 'bg-red-100 text-red-700',
  Completada: 'bg-blue-100 text-blue-700',
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">Paja de Agua</h1>
          <p className="mt-1 text-sm text-primary-500">
            Solicitudes de disponibilidad de servicio registradas desde el sitio público
          </p>
        </div>
        <button
          type="button"
          onClick={cargar}
          className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
      )}

      {cargando ? (
        <p className="text-sm text-primary-400">Cargando solicitudes…</p>
      ) : solicitudes.length === 0 ? (
        <EmptyState
          titulo="No hay solicitudes registradas de este tipo."
          descripcion="Las solicitudes de paja de agua enviadas desde el sitio público aparecerán aquí."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-primary-100 text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Código</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Solicitante</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Ubicación</th>
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
                    <div className="font-medium text-primary-800">{s.nombre_solicitante}</div>
                    <div className="text-xs text-primary-400">{s.identificacion}</div>
                  </td>
                  <td className="px-4 py-3 text-primary-600">
                    {s.canton && s.distrito ? (
                      <>
                        {s.distrito}, {s.canton}
                      </>
                    ) : (
                      <span className="text-primary-300">Sin desglose</span>
                    )}
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
                      onClick={() => setDetalle(s)}
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
          onCerrar={() => setDetalle(null)}
        />
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

// Modal de solo lectura: mostrar toda la información para que la junta
// directiva pueda revisar la solicitud (aprobar/rechazar es el Paso 2 del
// flujo, todavía no construido — ver conversación con Meli).
function ModalDetalle({
  solicitud,
  configuracion,
  onCerrar,
}: {
  solicitud: SolicitudPajaAgua
  configuracion: Configuracion | null
  onCerrar: () => void
}) {
  const [generandoDocumento, setGenerandoDocumento] = useState(false)

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

          <Campo
            etiqueta="Ubicación"
            valor={
              solicitud.provincia
                ? `${solicitud.distrito}, ${solicitud.canton}, ${solicitud.provincia}`
                : 'Sin desglose (solicitud anterior a este cambio)'
            }
            colSpan2
          />
          <Campo etiqueta="Dirección exacta" valor={solicitud.direccion} colSpan2 />
          <Campo etiqueta="Número de plano" valor={solicitud.numero_plano} />

          <Campo etiqueta="Naturaleza del inmueble" valor={solicitud.naturaleza_inmueble ?? '—'} />
          <Campo etiqueta="Calidad del titular" valor={solicitud.calidad_titular ?? '—'} />
          <Campo etiqueta="Servicio solicitado" valor={solicitud.tipo_servicio ?? '—'} />
          <Campo etiqueta="Tipo de conexión" valor={solicitud.tipo_conexion ?? '—'} />

          {solicitud.observaciones && (
            <Campo etiqueta="Observaciones" valor={solicitud.observaciones} colSpan2 />
          )}

          <Campo etiqueta="Fecha de solicitud" valor={formatearFecha(solicitud.fecha_solicitud)} />
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
            <EnlaceDocumento etiqueta="Carta de solicitud" url={solicitud.carta_solicitud_path} />
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

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default SolicitudesPajaAgua
