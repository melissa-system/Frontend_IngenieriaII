import { useState } from 'react'
import Modal, { ModalAcciones, ModalTitulo } from '../ui/Modal'
import Button from '../ui/Button'
import Alerta from '../ui/Alerta'
import BadgeEstado from '../ui/BadgeEstado'
import SolicitarMaterialesForm from './SolicitarMaterialesForm'
import {
  cancelarSolicitudMaterial,
  type SolicitudMaterial,
} from '../Services/solicitudesMaterial.service'

// Trabajo unificado (avería o labor) tal como lo arma el panel del fontanero.
export interface DatosTrabajo {
  origen: 'averia' | 'labor'
  id: number
  codigo: string
  tipoEtiqueta: string
  descripcion: string
  estado: string
  fecha: string
  gestionIniciada: string | null
  gestionFinalizada: string | null
  devueltaRevision: boolean
  motivoRevision: string | null
  reportanteNombre?: string | null
  reportanteCedula?: string | null
  abonadoNombre?: string | null
  abonadoNumero?: string | null
  abonadoCedula?: string | null
  abonadoTelefono?: string | null
  direccion?: string | null
  numeroNis?: string | null
}

function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—'
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
}

function nombreMaterial(detalle: SolicitudMaterial['detalles'][number]): string {
  return detalle.articulo?.nombre ?? detalle.descripcion_libre ?? 'Material'
}

function ListaMateriales({ solicitud }: { solicitud: SolicitudMaterial }) {
  return (
    <ul className="divide-y divide-primary-100 rounded-lg border border-primary-200 bg-white">
      {solicitud.detalles.map((detalle) => (
        <li
          key={detalle.id}
          className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
        >
          <span className="min-w-0">
            <span className="block truncate font-medium text-primary-800">
              {nombreMaterial(detalle)}
            </span>
            <span className="text-xs text-primary-400">
              {detalle.articulo ? 'Del inventario' : 'No inventariado'}
              {detalle.unidad ? ` · ${detalle.unidad}` : ''}
            </span>
          </span>
          <span className="flex-none font-semibold text-primary-900">
            {detalle.cantidad}
          </span>
        </li>
      ))}
    </ul>
  )
}

function DetalleTrabajoModal({
  trabajo,
  solicitudes,
  onClose,
  onSolicitudCreada,
  onSolicitudCancelada,
}: {
  trabajo: DatosTrabajo
  solicitudes: SolicitudMaterial[]
  onClose: () => void
  onSolicitudCreada: (solicitud: SolicitudMaterial) => void
  onSolicitudCancelada: (solicitud: SolicitudMaterial) => void
}) {
  const [mostrarSolicitud, setMostrarSolicitud] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState('')

  const pendiente =
    solicitudes.find((s) => s.estado === 'Pendiente') ?? null
  const ordenarPorFecha = (a: SolicitudMaterial, b: SolicitudMaterial) =>
    new Date(b.fecha_creacion).getTime() -
    new Date(a.fecha_creacion).getTime()
  // Materiales ya aprobados por la administración: van arriba de todo.
  const aprobadas = [...solicitudes]
    .filter((s) => s.estado === 'Aprobada')
    .sort(ordenarPorFecha)
  // Pedidos que no siguen en curso (rechazados o cancelados): historial.
  const anteriores = [...solicitudes]
    .filter((s) => s.estado === 'Rechazada' || s.estado === 'Cancelada')
    .sort(ordenarPorFecha)

  const esAveria = trabajo.origen === 'averia'

  async function cancelar() {
    if (!pendiente || cancelando) return
    setCancelando(true)
    setError('')
    try {
      const actualizada = await cancelarSolicitudMaterial(pendiente.id)
      onSolicitudCancelada(actualizada)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cancelar la solicitud.',
      )
    } finally {
      setCancelando(false)
    }
  }

  return (
    <Modal size="2xl" onCerrar={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <ModalTitulo>{trabajo.codigo}</ModalTitulo>
          <p className="mt-0.5 text-sm text-primary-500">
            {esAveria ? 'Avería' : 'Labor'} · {trabajo.tipoEtiqueta}
          </p>
        </div>
        <BadgeEstado estado={trabajo.estado} />
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase text-primary-400">
            Fecha
          </dt>
          <dd className="mt-0.5 text-primary-800">
            {formatearFecha(trabajo.fecha)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-primary-400">
            Gestión
          </dt>
          <dd className="mt-0.5 text-primary-800">
            {trabajo.gestionIniciada
              ? `Iniciada ${formatearFecha(trabajo.gestionIniciada)}`
              : 'Sin iniciar'}
            {trabajo.gestionFinalizada
              ? ` · Terminada ${formatearFecha(trabajo.gestionFinalizada)}`
              : ''}
          </dd>
        </div>

        {esAveria ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">
              Reportante
            </dt>
            <dd className="mt-0.5 text-primary-800">
              {trabajo.reportanteNombre ?? '—'}
              {trabajo.reportanteCedula
                ? ` — Cédula: ${trabajo.reportanteCedula}`
                : ''}
            </dd>
          </div>
        ) : (
          <>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-primary-400">
                Abonado
              </dt>
              <dd className="mt-0.5 text-primary-800">
                {trabajo.abonadoNombre ?? '—'}
                {trabajo.abonadoNumero ? ` (${trabajo.abonadoNumero})` : ''}
                {trabajo.abonadoCedula
                  ? ` — Cédula: ${trabajo.abonadoCedula}`
                  : ''}
                {trabajo.abonadoTelefono
                  ? ` · Tel.: ${trabajo.abonadoTelefono}`
                  : ''}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-primary-400">
                Dirección
              </dt>
              <dd className="mt-0.5 text-primary-800">
                {trabajo.direccion || '—'}
              </dd>
            </div>
            {trabajo.numeroNis && (
              <div>
                <dt className="text-xs font-medium uppercase text-primary-400">
                  NIS
                </dt>
                <dd className="mt-0.5 text-primary-800">{trabajo.numeroNis}</dd>
              </div>
            )}
          </>
        )}

        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-primary-400">
            Descripción
          </dt>
          <dd className="mt-0.5 whitespace-pre-line break-words text-primary-800">
            {trabajo.descripcion}
          </dd>
        </div>

        {trabajo.devueltaRevision && trabajo.motivoRevision && (
          <div className="sm:col-span-2">
            <Alerta tipo="advertencia">
              Devuelta por revisión: {trabajo.motivoRevision}
            </Alerta>
          </div>
        )}
      </dl>

      {/* Materiales para el trabajo */}
      <div className="mt-6 border-t border-primary-100 pt-4">
        <h3 className="text-sm font-semibold text-primary-900">
          Materiales para esta reparación
        </h3>

        {/* 1. Materiales ya aprobados (arriba, siempre visibles) */}
        {aprobadas.length > 0 && (
          <div className="mt-3 space-y-2">
            {aprobadas.map((solicitud) => (
              <div
                key={solicitud.id}
                className="rounded-xl border border-exito-200 bg-exito-50 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary-900">
                    Materiales aprobados · {solicitud.codigo_solicitud_material}
                  </p>
                  <span className="text-xs text-primary-500">
                    {formatearFecha(
                      solicitud.fecha_revision ?? solicitud.fecha_creacion,
                    )}
                  </span>
                </div>
                <div className="mt-2">
                  <ListaMateriales solicitud={solicitud} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Solicitud pendiente o pestañita para pedir materiales */}
        {pendiente ? (
          <div className="mt-3 space-y-2 rounded-xl border border-advertencia-200 bg-advertencia-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary-900">
                Solicitud {pendiente.codigo_solicitud_material}
              </p>
              <BadgeEstado estado={pendiente.estado} />
            </div>
            <p className="text-xs text-primary-600">
              Esperando aprobación de la administración. No podés iniciar el
              trabajo hasta que respondan.
            </p>
            <ListaMateriales solicitud={pendiente} />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={cancelar}
                disabled={cancelando}
              >
                {cancelando ? 'Cancelando…' : 'Cancelar solicitud'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setMostrarSolicitud((v) => !v)}
              aria-expanded={mostrarSolicitud}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-primary-200 bg-primary-50/60 px-3 py-2.5 text-left transition-colors hover:bg-primary-50"
            >
              <span className="text-sm font-semibold text-primary-900">
                Solicitar materiales
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-primary-500">
                {mostrarSolicitud ? 'Ocultar' : 'Abrir'}
                <svg
                  className={`h-4 w-4 transition-transform ${
                    mostrarSolicitud ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </span>
            </button>

            {mostrarSolicitud && (
              <div className="mt-3 rounded-xl border border-primary-100 bg-white p-3">
                <SolicitarMaterialesForm
                  averiaId={esAveria ? trabajo.id : undefined}
                  laborId={esAveria ? undefined : trabajo.id}
                  onCreada={(solicitud) => {
                    setMostrarSolicitud(false)
                    onSolicitudCreada(solicitud)
                  }}
                  onCancelar={() => setMostrarSolicitud(false)}
                />
              </div>
            )}
          </div>
        )}

        {/* 3. Historial de pedidos rechazados o cancelados */}
        {anteriores.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-primary-400">
              Pedidos anteriores
            </p>
            {anteriores.map((solicitud) => (
              <div
                key={solicitud.id}
                className="rounded-xl border border-primary-100 bg-primary-50/40 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-primary-800">
                    {solicitud.codigo_solicitud_material} ·{' '}
                    {formatearFecha(solicitud.fecha_creacion)}
                  </p>
                  <BadgeEstado estado={solicitud.estado} />
                </div>
                {solicitud.motivo_rechazo && (
                  <p className="mt-1 text-xs text-error-700">
                    Motivo del rechazo: {solicitud.motivo_rechazo}
                  </p>
                )}
                <div className="mt-2">
                  <ListaMateriales solicitud={solicitud} />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <Alerta tipo="error" className="mt-3">
            {error}
          </Alerta>
        )}
      </div>

      {/* Al abrir la pestaña del formulario, sus botones son los únicos
          (Enviar solicitud / Cancelar). */}
      {!mostrarSolicitud && (
        <ModalAcciones>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </ModalAcciones>
      )}
    </Modal>
  )
}

export default DetalleTrabajoModal
