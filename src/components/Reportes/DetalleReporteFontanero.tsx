import type { ReactNode } from 'react'
import {
  formatearTiempo,
  ETIQUETA_ACTIVIDAD,
  ETIQUETA_REVISION,
  type ReporteFontanero,
  type EstadoRevision,
} from '../Services/reportesFontanero.service'
import { resolverUrlArchivo } from '../../lib/urlArchivos'

// Colores del sello de revisión (coincide con el panel administrativo).
const CLASE_REVISION: Record<EstadoRevision, string> = {
  Pendiente: 'bg-advertencia-100 text-advertencia-700',
  Aprobado: 'bg-exito-100 text-exito-700',
  Rechazado: 'bg-error-100 text-error-700',
}

function IconActividad() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75"
      />
    </svg>
  )
}

function IconReloj() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-3.5 w-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}

// Dato etiqueta/valor dentro de una tarjetita, para ordenar la información.
function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-primary-100 bg-white px-3.5 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-primary-400">
        {etiqueta}
      </p>
      <div className="mt-0.5 text-sm font-medium text-primary-900">{children}</div>
    </div>
  )
}

// Vista de detalle de un reporte de fontanero, compartida por el panel
// administrativo y la pantalla del propio fontanero. Presentacional: no trae
// datos ni botones de acción, solo ordena y da formato a la información.
function DetalleReporteFontanero({
  reporte,
  mostrarFontanero = false,
}: {
  reporte: ReporteFontanero
  /** En el panel administrativo interesa ver de quién es el reporte. */
  mostrarFontanero?: boolean
}) {
  const materialesTexto = reporte.materiales_texto?.trim()
  const listaMateriales = reporte.materiales ?? []

  return (
    <div className="space-y-5">
      {/* Encabezado: actividad + tiempo, como resumen rápido. */}
      <div className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-primary-50 to-white p-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-primary-700 text-white">
          <IconActividad />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-primary-900">
            {ETIQUETA_ACTIVIDAD[reporte.tipo_actividad]}
          </p>
          <p className="truncate text-xs text-primary-500">
            {reporte.averia?.codigo_averia ??
              (reporte.labor?.codigo_labor
                ? `Labor ${reporte.labor.codigo_labor}`
                : 'Sin trabajo vinculado')}
            {reporte.reintentos > 0 ? ` · Reenviado (${reporte.reintentos})` : ''}
          </p>
        </div>
        <span className="flex flex-none items-center gap-1.5 rounded-full bg-info-100 px-3 py-1 text-xs font-semibold text-info-700">
          <IconReloj />
          {formatearTiempo(reporte.tiempo_minutos)}
        </span>
      </div>

      {/* Datos del reporte, en tarjetitas. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {mostrarFontanero && (
          <Dato etiqueta="Fontanero">{reporte.empleado?.nombre ?? '—'}</Dato>
        )}
        <Dato etiqueta="Fecha del trabajo">{reporte.fecha_trabajo}</Dato>
        <Dato etiqueta="Tiempo empleado">
          {formatearTiempo(reporte.tiempo_minutos)}
        </Dato>
        <Dato etiqueta="Estado de revisión">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${CLASE_REVISION[reporte.estado_revision]}`}
          >
            {ETIQUETA_REVISION[reporte.estado_revision]}
          </span>
        </Dato>
      </div>

      {/* Trabajo realizado */}
      <section>
        <h3 className="text-sm font-semibold text-primary-900">
          Trabajo realizado
        </h3>
        <p className="mt-2 whitespace-pre-line rounded-xl border border-primary-100 bg-white px-3.5 py-3 text-sm leading-relaxed text-primary-700">
          {reporte.descripcion}
        </p>
      </section>

      {/* Materiales utilizados */}
      <section>
        <h3 className="text-sm font-semibold text-primary-900">
          Materiales utilizados
        </h3>
        {materialesTexto ? (
          <p className="mt-2 whitespace-pre-line rounded-xl border border-primary-100 bg-white px-3.5 py-3 text-sm leading-relaxed text-primary-700">
            {materialesTexto}
          </p>
        ) : listaMateriales.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-primary-200 bg-primary-50/50 px-3.5 py-3 text-sm text-primary-400">
            Este trabajo no registró materiales.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-primary-100 overflow-hidden rounded-xl border border-primary-100">
            {listaMateriales.map((material) => (
              <li
                key={material.id}
                className="flex items-center justify-between bg-white px-3.5 py-2.5 text-sm text-primary-700"
              >
                <span className="min-w-0 truncate">
                  {material.nombre_articulo}
                </span>
                <span className="ml-3 flex-none rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                  {material.cantidad}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Evidencia opcional (imagen) */}
      {reporte.evidencia_url && (
        <section>
          <h3 className="text-sm font-semibold text-primary-900">Evidencia</h3>
          <a
            href={resolverUrlArchivo(reporte.evidencia_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block"
            title="Abrir en una pestaña nueva"
          >
            <img
              src={resolverUrlArchivo(reporte.evidencia_url)}
              alt={reporte.evidencia_nombre ?? 'Evidencia del trabajo'}
              className="max-h-56 rounded-xl border border-primary-100 object-cover"
            />
          </a>
          <p className="mt-1 text-xs text-primary-500">
            {reporte.evidencia_nombre ?? 'Imagen adjunta'} — clic para ampliar.
          </p>
        </section>
      )}
    </div>
  )
}

export default DetalleReporteFontanero
