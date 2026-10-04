import EmptyState from '../../components/ui/EmptyState'
import { Notificar } from '../../components/ui/ToastProvider'
import { useMemo, useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts'
import {
  obtenerEstadisticasAverias,
  type EstadisticasAveriasBackend,
} from '../../components/Services/averias.service'
import {
  obtenerEstadisticasAbonados,
  nombreVisible,
  type EstadisticasAbonadosBackend,
} from '../../components/Services/abonados.service'
import {
  obtenerEstadisticasSolicitudes,
  type EstadisticasSolicitudesBackend,
} from '../../components/Services/solicitudes.service'
import {
  generarPdfReporteEstadistico,
  descargarPdfReporte,
  type ParametrosReportePdf,
} from '../../lib/generarPdfReporteEstadistico'
import {
  construirCsvReporte,
  motivoNoExportable,
  nombreArchivoReporte,
  puedeVerReportes,
  validarRangoFechas,
} from '../../lib/exportacionReportes'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'

const MODULES = ['Averías', 'Abonados', 'Solicitudes'] as const
type ModuleName = (typeof MODULES)[number]

const RANGE_OPTIONS = [
  { value: 'historico', label: 'Histórico (todos)' },
  { value: 'mensual', label: 'Este mes' },
  { value: 'trimestral', label: 'Este trimestre' },
  { value: 'anual', label: 'Este año' },
  { value: 'personalizado', label: 'Personalizado' },
] as const
type RangeValue = (typeof RANGE_OPTIONS)[number]['value']

const COLORS = ['#073763', '#13416b', '#395f82', '#6a87a1', '#9cafc1']

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// Agrupa una lista de fechas (YYYY-MM-...) por mes, ordenadas cronológicamente,
// con etiquetas legibles tipo "Ene 26". Se calcula en el cliente a partir de
// los registros que devuelve el backend.
function agruparPorMes(fechas: (string | undefined)[]): { mes: string; cantidad: number }[] {
  const buckets = new Map<string, number>()
  for (const fecha of fechas) {
    if (!fecha) continue
    const anio = Number(fecha.slice(0, 4))
    const mes = Number(fecha.slice(5, 7))
    if (Number.isNaN(anio) || Number.isNaN(mes)) continue
    const clave = `${anio}-${mes}`
    buckets.set(clave, (buckets.get(clave) ?? 0) + 1)
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([clave, cantidad]) => ({
      mes: `${MESES_CORTO[Number(clave.slice(5, 7)) - 1]} ${clave.slice(2, 4)}`,
      cantidad,
    }))
}

function getRange(range: RangeValue, desdeCustom: string, hastaCustom: string) {
  if (range === 'historico') return null
  if (range === 'personalizado') {
    if (!desdeCustom || !hastaCustom) return null
    return { desde: desdeCustom, hasta: hastaCustom }
  }
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  if (range === 'mensual') return { desde: `${y}-${m}-01`, hasta: `${y}-${m}-${d}` }
  if (range === 'trimestral') {
    const inicio = Math.floor(now.getMonth() / 3) * 3 + 1
    return { desde: `${y}-${String(inicio).padStart(2, '0')}-01`, hasta: `${y}-${m}-${d}` }
  }
  return { desde: `${y}-01-01`, hasta: `${y}-${m}-${d}` } // anual
}

interface FiltroModulo {
  tipoLabel: string
  tipoOpciones: string[]
  estadoLabel: string
  estadoOpciones: string[]
}

// Valores exactos que entiende el backend (tipo_averia para averías,
// tipo_abonado / estado para abonados y las etiquetas normalizadas de
// solicitudes) — el endpoint filtra contra estos mismos strings.
const FILTROS_MODULO: Record<ModuleName, FiltroModulo> = {
  Averías: {
    tipoLabel: 'Tipo de avería',
    tipoOpciones: [
      'Fuga de agua',
      'Tubería rota',
      'Falta de presión / sin agua',
      'Contador dañado',
      'Fuga en la vía pública',
      'Otro',
    ],
    estadoLabel: 'Estado',
    estadoOpciones: ['Pendiente', 'En proceso', 'Finalizado'],
  },
  Abonados: {
    tipoLabel: 'Tipo de abonado',
    tipoOpciones: ['Física', 'Jurídica'],
    estadoLabel: 'Estado',
    estadoOpciones: ['Activo', 'Inactivo'],
  },
  Solicitudes: {
    tipoLabel: 'Tipo de solicitud',
    tipoOpciones: [
      'Paja de agua',
      'Cambio de propietario',
      'Cambio de representante',
      'Cambio de medidor',
      'Otro',
    ],
    estadoLabel: 'Estado',
    estadoOpciones: ['Pendiente', 'En proceso', 'Aprobada', 'Rechazada', 'Completada'],
  },
}

interface StatsBackend {
  averias: EstadisticasAveriasBackend | null
  abonados: EstadisticasAbonadosBackend | null
  solicitudes: EstadisticasSolicitudesBackend | null
}

interface Column {
  key: string
  label: string
}

interface ReportData {
  total: number
  barData: { name: string; cantidad: number }[]
  barLabel: string
  pieData: { name: string; cantidad: number }[]
  pieLabel: string
  evolucionMensual: { mes: string; cantidad: number }[]
  columns: Column[]
  rows: Record<string, string>[]
  fechaAplica: boolean
}

function buildReport(mod: ModuleName, stats: StatsBackend): ReportData {
  if (mod === 'Averías') {
    const s = stats.averias ?? {
      total: 0,
      porTipo: [],
      porEstado: [],
      registros: [],
    }
    return {
      total: s.total,
      barData: s.porTipo.map((t) => ({ name: t.tipo, cantidad: t.total })),
      barLabel: 'Averías por tipo',
      pieData: s.porEstado.map((e) => ({ name: e.estado, cantidad: e.total })),
      pieLabel: 'Averías por estado',
      columns: [
        { key: 'codigo', label: 'Código' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'reportadoPor', label: 'Reportado por' },
        { key: 'estado', label: 'Estado' },
        { key: 'fecha', label: 'Fecha' },
      ],
      rows: s.registros.map((a) => ({
        codigo: a.codigo_averia || '—',
        tipo: a.tipo_averia,
        reportadoPor: `${a.nombre_reportante} ${a.apellido1_reportante || ''}`.trim(),
        estado: a.estado,
        fecha: a.fecha_reporte ? a.fecha_reporte.slice(0, 10) : '—',
      })),
      evolucionMensual: agruparPorMes(s.registros.map((a) => a.fecha_reporte)),
      fechaAplica: true,
    }
  }

  if (mod === 'Abonados') {
    const s = stats.abonados ?? {
      total: 0,
      porTipo: [],
      porEstado: [],
      registros: [],
    }
    return {
      total: s.total,
      barData: s.porTipo.map((t) => ({ name: t.tipo, cantidad: t.total })),
      barLabel: 'Abonados por tipo',
      pieData: s.porEstado.map((e) => ({ name: e.estado, cantidad: e.total })),
      pieLabel: 'Abonados por estado',
      columns: [
        { key: 'cedula', label: 'Cédula' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'estado', label: 'Estado' },
        { key: 'fechaRegistro', label: 'Registro' },
      ],
      rows: s.registros.map((a) => ({
        cedula: a.cedula,
        nombre: nombreVisible(a),
        tipo: a.tipo_abonado,
        estado: a.estado,
        fechaRegistro: a.fecha_registro ? a.fecha_registro.slice(0, 10) : '—',
      })),
      evolucionMensual: agruparPorMes(s.registros.map((a) => a.fecha_registro)),
      fechaAplica: true,
    }
  }

  // Solicitudes (último módulo disponible)
  const s = stats.solicitudes ?? {
    total: 0,
    porTipo: [],
    porEstado: [],
    registros: [],
  }
  return {
    total: s.total,
    barData: s.porTipo.map((t) => ({ name: t.tipo, cantidad: t.total })),
    barLabel: 'Solicitudes por tipo',
    pieData: s.porEstado.map((e) => ({ name: e.estado, cantidad: e.total })),
    pieLabel: 'Solicitudes por estado',
    columns: [
      { key: 'codigo', label: 'Código' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'solicitante', label: 'Solicitante' },
      { key: 'estado', label: 'Estado' },
      { key: 'fecha', label: 'Fecha' },
    ],
    rows: s.registros.map((sl) => ({
      codigo: sl.codigo,
      tipo: sl.tipo,
      solicitante: sl.solicitante,
      estado: sl.estado,
      fecha: sl.fecha,
    })),
    evolucionMensual: agruparPorMes(s.registros.map((sl) => sl.fecha)),
    fechaAplica: true,
  }
}

interface ViewBoxPolar {
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
}

function esViewBoxPolar(viewBox: unknown): viewBox is ViewBoxPolar {
  return typeof viewBox === 'object' && viewBox !== null && 'innerRadius' in viewBox
}

// Etiqueta de cada aro del gráfico radial. La etiqueta por defecto de
// recharts gira junto con el arco y el número queda acostado; esta se ubica
// al inicio del aro pero se dibuja derecha, como el resto del texto.
function EtiquetaAroRadial({ value, viewBox }: { value?: unknown; viewBox?: unknown }) {
  if (!esViewBoxPolar(viewBox) || value === undefined || value === null) return null
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle } = viewBox
  const radio = (innerRadius + outerRadius) / 2
  const recorrido = endAngle - startAngle
  // Se separa ~12 px del extremo del aro (más grados en los aros internos,
  // que son más cortos) para que el número no se salga del arco.
  const separacion = ((12 / Math.max(radio, 1)) * 180) / Math.PI
  const angulo = startAngle + Math.sign(recorrido) * Math.min(Math.abs(recorrido) / 2, separacion)
  const rad = (-angulo * Math.PI) / 180
  return (
    <text
      x={cx + radio * Math.cos(rad)}
      y={cy + radio * Math.sin(rad)}
      fill="#ffffff"
      fontSize={11}
      fontWeight={700}
      textAnchor="middle"
      dominantBaseline="central"
    >
      {String(value)}
    </text>
  )
}

function Reportes() {
  const { rolEfectivo } = useAuth()
  const [modulo, setModulo] = useState<ModuleName>('Averías')
  const [rango, setRango] = useState<RangeValue>('historico')
  const [desdeCustom, setDesdeCustom] = useState('')
  const [hastaCustom, setHastaCustom] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('Todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos')
  const [estadisticasAverias, setEstadisticasAverias] = useState<EstadisticasAveriasBackend | null>(null)
  const [estadisticasAbonados, setEstadisticasAbonados] = useState<EstadisticasAbonadosBackend | null>(null)
  const [estadisticasSolicitudes, setEstadisticasSolicitudes] = useState<EstadisticasSolicitudesBackend | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generandoPdf, setGenerandoPdf] = useState(false)

  const rangoResuelto = useMemo(
    () => getRange(rango, desdeCustom, hastaCustom),
    [rango, desdeCustom, hastaCustom],
  )

  // Un rango personalizado incompleto o invertido no se consulta ni se
  // exporta: antes caía en silencio al histórico y el documento quedaba
  // rotulado con un período distinto al de los datos.
  const errorRango = useMemo(
    () => validarRangoFechas(rango, desdeCustom, hastaCustom),
    [rango, desdeCustom, hastaCustom],
  )

  // Al cambiar de módulo se resetean los filtros: cada módulo tiene sus
  // propias opciones de tipo/estado y un valor heredado no existiría.
  useEffect(() => {
    setFiltroTipo('Todos')
    setFiltroEstado('Todos')
  }, [modulo])

  useEffect(() => {
    let cancelado = false
    setError(null)

    if (errorRango) {
      setLoading(false)
      if (modulo === 'Averías') setEstadisticasAverias(null)
      else if (modulo === 'Abonados') setEstadisticasAbonados(null)
      else setEstadisticasSolicitudes(null)
      return
    }

    setLoading(true)

    const params: {
      fechaInicio?: string
      fechaFin?: string
      tipo?: string
      estado?: string
    } = {}
    if (rangoResuelto?.desde) params.fechaInicio = rangoResuelto.desde
    if (rangoResuelto?.hasta) params.fechaFin = rangoResuelto.hasta
    if (filtroTipo && filtroTipo !== 'Todos') params.tipo = filtroTipo
    if (filtroEstado && filtroEstado !== 'Todos') params.estado = filtroEstado

    // Mismo contrato de filtros (rango/tipo/estado) para los tres módulos:
    // el backend aplica los mismos y devuelve total/conteos/registros.
    const promesa =
      modulo === 'Averías'
        ? obtenerEstadisticasAverias(params)
        : modulo === 'Abonados'
          ? obtenerEstadisticasAbonados(params)
          : obtenerEstadisticasSolicitudes(params)

    promesa
      .then((data) => {
        if (cancelado) return
        if (modulo === 'Averías') {
          setEstadisticasAverias(data as EstadisticasAveriasBackend)
        } else if (modulo === 'Abonados') {
          setEstadisticasAbonados(data as EstadisticasAbonadosBackend)
        } else {
          setEstadisticasSolicitudes(data as EstadisticasSolicitudesBackend)
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : 'Error al cargar estadísticas.')
        }
      })
      .finally(() => {
        if (!cancelado) {
          setLoading(false)
        }
      })

    return () => {
      cancelado = true
    }
  }, [modulo, rangoResuelto, errorRango, filtroTipo, filtroEstado])

  const stats = useMemo<StatsBackend>(
    () => ({
      averias: estadisticasAverias,
      abonados: estadisticasAbonados,
      solicitudes: estadisticasSolicitudes,
    }),
    [estadisticasAverias, estadisticasAbonados, estadisticasSolicitudes],
  )

  const reporte = useMemo(
    () => buildReport(modulo, stats),
    [modulo, stats],
  )

  // Datos del gráfico radial: mismos conteos que la dona de estados pero con
  // color por segmento y escala contra el total. Cada estado conserva su
  // color de la dona y los aros se ordenan alfabéticamente (del centro hacia
  // afuera) para que coincidan con el orden de la leyenda.
  const radialData = reporte.pieData
    .map((d, i) => ({
      name: d.name,
      value: d.cantidad,
      fill: COLORS[i % COLORS.length],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  // Metadatos del reporte que acompañan tanto el PDF como el CSV.
  function metadatosExportacion() {
    const rangoLabel =
      rango === 'personalizado'
        ? `Personalizado: ${desdeCustom || '—'} a ${hastaCustom || '—'}`
        : (RANGE_OPTIONS.find((o) => o.value === rango)?.label ?? rango)
    const filtrosResumen = [
      `${FILTROS_MODULO[modulo].tipoLabel}: ${filtroTipo === 'Todos' || !filtroTipo ? 'Todos' : filtroTipo}`,
      `${FILTROS_MODULO[modulo].estadoLabel}: ${filtroEstado === 'Todos' || !filtroEstado ? 'Todos' : filtroEstado}`,
    ].join(' · ')
    const fechaGeneracion = new Date().toLocaleString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    return { rangoLabel, filtrosResumen, fechaGeneracion }
  }

  function datosParaPdf(): ParametrosReportePdf {
    const { rangoLabel, filtrosResumen, fechaGeneracion } = metadatosExportacion()
    return {
      modulo,
      rango: rangoLabel,
      filtros: filtrosResumen,
      fechaGeneracion,
      reporte: {
        total: reporte.total,
        barLabel: reporte.barLabel,
        pieLabel: reporte.pieLabel,
        barData: reporte.barData,
        pieData: reporte.pieData,
        evolucionMensual: reporte.evolucionMensual.map((e) => ({
          name: e.mes,
          cantidad: e.cantidad,
        })),
        columns: reporte.columns,
        rows: reporte.rows,
      },
    }
  }

  // Se valida antes de generar cualquier documento: rango correcto, datos ya
  // cargados y al menos un registro que exportar.
  const motivoBloqueo = motivoNoExportable({
    total: reporte.total,
    cargando: loading,
    errorRango,
    errorCarga: error,
  })
  const puedeExportar = puedeVerReportes(rolEfectivo)

  function downloadCSV() {
    if (!puedeExportar || motivoBloqueo) return
    const { rangoLabel, filtrosResumen, fechaGeneracion } = metadatosExportacion()
    const csv = construirCsvReporte(reporte, {
      modulo,
      rangoLabel,
      filtrosResumen,
      fechaGeneracion,
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    descargarPdfReporte(blob, nombreArchivoReporte(modulo, rangoResuelto, 'csv'))
  }

  async function exportPDF() {
    if (!puedeExportar || motivoBloqueo) return
    setGenerandoPdf(true)
    try {
      const blob = await generarPdfReporteEstadistico(datosParaPdf())
      descargarPdfReporte(blob, nombreArchivoReporte(modulo, rangoResuelto, 'pdf'))
    } catch {
      setError('No se pudo generar el PDF. Inténtelo de nuevo.')
    } finally {
      setGenerandoPdf(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Reportes estadísticos"
        descripcion="Datos generados a partir de la información registrada en cada módulo"
        accion={
          <>
{puedeExportar && (
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                type="button"
                onClick={downloadCSV}
                disabled={!!motivoBloqueo}
                title={motivoBloqueo ?? undefined}>
                Exportar CSV
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={exportPDF}
                disabled={generandoPdf || !!motivoBloqueo}
                title={motivoBloqueo ?? undefined}>
                {generandoPdf ? 'Generando PDF...' : 'Exportar PDF'}
              </Button>
            </div>
            {motivoBloqueo && !loading && (
              <p className="text-xs text-primary-500">{motivoBloqueo}</p>
            )}
          </div>
        )}
          </>
        }
      />

      <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700">Módulo</label>
            <select
              value={modulo}
              onChange={(e) => setModulo(e.target.value as ModuleName)}
              className="mt-1 h-10 rounded-full border border-primary-200 px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
            >
              {MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700">Rango</label>
            <select
              value={rango}
              onChange={(e) => setRango(e.target.value as RangeValue)}
              className="mt-1 h-10 rounded-full border border-primary-200 px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
            >
              {RANGE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {rango === 'personalizado' && (
            <div className="flex items-end gap-2">
              <input
                type="date"
                value={desdeCustom}
                max={hastaCustom || undefined}
                onChange={(e) => setDesdeCustom(e.target.value)}
                className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
              />
              <span className="pb-2 text-sm text-primary-400">a</span>
              <input
                type="date"
                value={hastaCustom}
                min={desdeCustom || undefined}
                onChange={(e) => setHastaCustom(e.target.value)}
                className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
              />
            </div>
          )}

          {errorRango && (
            <p className="w-full text-sm font-medium text-red-600">{errorRango}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-primary-700">
              {FILTROS_MODULO[modulo].tipoLabel}
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="mt-1 h-10 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
            >
              <option value="Todos">Todos los tipos</option>
              {FILTROS_MODULO[modulo].tipoOpciones.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700">
              {FILTROS_MODULO[modulo].estadoLabel}
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="mt-1 h-10 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
            >
              <option value="Todos">Todos los estados</option>
              {FILTROS_MODULO[modulo].estadoOpciones.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Notificar mensaje={error} tipo="error" />

      {loading && (
        <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-3 text-center text-xs font-medium text-primary-600">
          Consultando estadísticas en el servidor...
        </div>
      )}

      <div id="report-print" className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-primary-500">Total de registros</p>
            <p className="mt-1 text-3xl font-semibold text-primary-900">{reporte.total}</p>
            <p className="mt-1 text-xs text-primary-400">{modulo}</p>
          </div>
          <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-primary-500">Categoría más común</p>
            <p className="mt-1 text-xl font-semibold text-primary-900">
              {reporte.barData.length > 0
                ? [...reporte.barData].sort((a, b) => b.cantidad - a.cantidad)[0].name
                : 'Sin datos'}
            </p>
            <p className="mt-1 text-xs text-primary-400">{reporte.barLabel}</p>
          </div>
          <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-primary-500">Estados distintos</p>
            <p className="mt-1 text-3xl font-semibold text-primary-900">{reporte.pieData.length}</p>
            <p className="mt-1 text-xs text-primary-400">{reporte.pieLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-primary-900">{reporte.barLabel}</h2>
            {reporte.barData.length === 0 ? (
              <EmptyState compacto titulo="No se encontraron registros para los filtros seleccionados." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={reporte.barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6ebef" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#395f82' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#395f82' }} width={110} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#073763" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-primary-900">{reporte.pieLabel}</h2>
            {reporte.pieData.length === 0 ? (
              <EmptyState compacto titulo="No se encontraron registros para los filtros seleccionados." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 16, right: 16, bottom: 0, left: 16 }}>
                  <Pie
                    data={reporte.pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={48}
                    outerRadius={78}
                    dataKey="cantidad"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {reporte.pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-primary-900">Evolución mensual</h2>
            {reporte.evolucionMensual.length === 0 ? (
              <EmptyState compacto titulo="No se encontraron registros para los filtros seleccionados." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={reporte.evolucionMensual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6ebef" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#395f82' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#395f82' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="cantidad" stroke="#073763" fill="#6a87a1" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-primary-900">Distribución de estados</h2>
            {radialData.length === 0 ? (
              <EmptyState compacto titulo="No se encontraron registros para los filtros seleccionados." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart data={radialData} innerRadius="20%" outerRadius="90%">
                  <PolarAngleAxis type="number" domain={[0, reporte.total]} tick={false} />
                  <RadialBar
                    dataKey="value"
                    background={{ fill: '#eaeff5' }}
                    cornerRadius={6}
                    // Número blanco y en negrita al inicio de cada aro: en el
                    // color por defecto se perdía sobre los aros oscuros.
                    label={EtiquetaAroRadial}
                  >
                    {radialData.map((d, i) => (
                      <Cell key={`radial-${i}`} fill={d.fill} />
                    ))}
                  </RadialBar>
                  <Legend
                    iconSize={12}
                    formatter={(value: string) => {
                      const dato = radialData.find((d) => d.name === value)
                      return dato ? `${value} (${dato.value})` : value
                    }}
                  />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reportes
