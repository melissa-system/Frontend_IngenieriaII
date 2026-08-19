import { useMemo, useState } from 'react'
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
} from 'recharts'
import {
  MOCK_ABONADOS,
  MOCK_SOLICITUDES,
  MOCK_AVERIAS_ADMIN,
  MOCK_INVENTARIO,
} from '../../lib/mockData'

const MODULES = ['Abonados', 'Solicitudes', 'Averías', 'Inventario'] as const
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

const ESTADO_COLORS: Record<string, string> = {
  Activo: 'bg-green-100 text-green-700',
  Inactivo: 'bg-red-100 text-red-700',
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Aprobada: 'bg-green-100 text-green-700',
  Rechazada: 'bg-red-100 text-red-700',
  Completada: 'bg-blue-100 text-blue-700',
  Asignada: 'bg-blue-100 text-blue-700',
  'En progreso': 'bg-indigo-100 text-indigo-700',
  Resuelta: 'bg-green-100 text-green-700',
  Normal: 'bg-green-100 text-green-700',
  Bajo: 'bg-yellow-100 text-yellow-700',
  Crítico: 'bg-red-100 text-red-700',
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

function enRango(fecha: string, rango: { desde: string; hasta: string } | null) {
  if (!rango) return true
  return fecha >= rango.desde && fecha <= rango.hasta
}

function contarPor<T>(items: T[], getKey: (item: T) => string) {
  const conteo = new Map<string, number>()
  for (const item of items) {
    const key = getKey(item)
    conteo.set(key, (conteo.get(key) ?? 0) + 1)
  }
  return Array.from(conteo.entries()).map(([name, cantidad]) => ({ name, cantidad }))
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
  columns: Column[]
  rows: Record<string, string>[]
  csvHeaders: string[]
  fechaAplica: boolean
}

function buildReport(mod: ModuleName, rango: { desde: string; hasta: string } | null): ReportData {
  if (mod === 'Abonados') {
    const filtrados = MOCK_ABONADOS.filter((a) => enRango(a.fechaRegistro, rango))
    return {
      total: filtrados.length,
      barData: contarPor(filtrados, (a) => a.tipo),
      barLabel: 'Abonados por tipo',
      pieData: contarPor(filtrados, (a) => a.estado),
      pieLabel: 'Abonados por estado',
      columns: [
        { key: 'cedula', label: 'Cédula' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'estado', label: 'Estado' },
        { key: 'fechaRegistro', label: 'Registro' },
      ],
      rows: filtrados.map((a) => ({
        cedula: a.cedula,
        nombre: a.nombre,
        tipo: a.tipo,
        estado: a.estado,
        fechaRegistro: a.fechaRegistro,
      })),
      csvHeaders: ['Cédula', 'Nombre', 'Tipo', 'Estado', 'Registro'],
      fechaAplica: true,
    }
  }

  if (mod === 'Solicitudes') {
    const filtradas = MOCK_SOLICITUDES.filter((s) => enRango(s.fecha, rango))
    return {
      total: filtradas.length,
      barData: contarPor(filtradas, (s) => s.tipo),
      barLabel: 'Solicitudes por tipo',
      pieData: contarPor(filtradas, (s) => s.estado),
      pieLabel: 'Solicitudes por estado',
      columns: [
        { key: 'codigo', label: 'Código' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'solicitante', label: 'Solicitante' },
        { key: 'estado', label: 'Estado' },
        { key: 'fecha', label: 'Fecha' },
      ],
      rows: filtradas.map((s) => ({
        codigo: s.codigo,
        tipo: s.tipo,
        solicitante: s.solicitante,
        estado: s.estado,
        fecha: s.fecha,
      })),
      csvHeaders: ['Código', 'Tipo', 'Solicitante', 'Estado', 'Fecha'],
      fechaAplica: true,
    }
  }

  if (mod === 'Averías') {
    const filtradas = MOCK_AVERIAS_ADMIN.filter((a) => enRango(a.fecha, rango))
    return {
      total: filtradas.length,
      barData: contarPor(filtradas, (a) => a.tipo),
      barLabel: 'Averías por tipo',
      pieData: contarPor(filtradas, (a) => a.estado),
      pieLabel: 'Averías por estado',
      columns: [
        { key: 'tipo', label: 'Tipo' },
        { key: 'reportadoPor', label: 'Reportado por' },
        { key: 'estado', label: 'Estado' },
        { key: 'fecha', label: 'Fecha' },
      ],
      rows: filtradas.map((a) => ({
        tipo: a.tipo,
        reportadoPor: a.reportadoPor,
        estado: a.estado,
        fecha: a.fecha,
      })),
      csvHeaders: ['Tipo', 'Reportado por', 'Estado', 'Fecha'],
      fechaAplica: true,
    }
  }

  // Inventario: es una foto del stock actual, no se filtra por fecha
  const nivel = (stock: number, minimo: number) => {
    if (stock <= Math.floor(minimo / 2)) return 'Crítico'
    if (stock <= minimo) return 'Bajo'
    return 'Normal'
  }
  const conNivel = MOCK_INVENTARIO.map((i) => ({ ...i, nivel: nivel(i.stock, i.stockMinimo) }))
  return {
    total: conNivel.length,
    barData: Object.values(
      conNivel.reduce<Record<string, { name: string; cantidad: number }>>((acc, i) => {
        acc[i.categoria] = acc[i.categoria] ?? { name: i.categoria, cantidad: 0 }
        acc[i.categoria].cantidad += i.stock
        return acc
      }, {}),
    ),
    barLabel: 'Stock por categoría',
    pieData: contarPor(conNivel, (i) => i.nivel),
    pieLabel: 'Items por nivel de stock',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'categoria', label: 'Categoría' },
      { key: 'stock', label: 'Stock' },
      { key: 'stockMinimo', label: 'Mínimo' },
      { key: 'nivel', label: 'Nivel' },
    ],
    rows: conNivel.map((i) => ({
      nombre: i.nombre,
      categoria: i.categoria,
      stock: String(i.stock),
      stockMinimo: String(i.stockMinimo),
      nivel: i.nivel,
    })),
    csvHeaders: ['Nombre', 'Categoría', 'Stock', 'Mínimo', 'Nivel'],
    fechaAplica: false,
  }
}

function Reportes() {
  const [modulo, setModulo] = useState<ModuleName>('Abonados')
  const [rango, setRango] = useState<RangeValue>('historico')
  const [desdeCustom, setDesdeCustom] = useState('')
  const [hastaCustom, setHastaCustom] = useState('')

  const rangoResuelto = useMemo(
    () => getRange(rango, desdeCustom, hastaCustom),
    [rango, desdeCustom, hastaCustom],
  )

  const reporte = useMemo(
    () => buildReport(modulo, reporteAplicaRango(modulo) ? rangoResuelto : null),
    [modulo, rangoResuelto],
  )

  function reporteAplicaRango(mod: ModuleName) {
    return mod !== 'Inventario'
  }

  function downloadCSV() {
    const csv = [
      reporte.csvHeaders,
      ...reporte.rows.map((r) => reporte.columns.map((c) => r[c.key])),
    ]
      .map((r) => r.join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${modulo}-reporte.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">
            Reportes estadísticos
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            Datos generados a partir de la información registrada en cada módulo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadCSV}
            className="rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={exportPDF}
            className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700">Módulo</label>
            <select
              value={modulo}
              onChange={(e) => setModulo(e.target.value as ModuleName)}
              className="mt-1 rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
            >
              {MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {reporte.fechaAplica ? (
            <>
              <div>
                <label className="block text-sm font-medium text-primary-700">Rango</label>
                <select
                  value={rango}
                  onChange={(e) => setRango(e.target.value as RangeValue)}
                  className="mt-1 rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
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
                    onChange={(e) => setDesdeCustom(e.target.value)}
                    className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
                  />
                  <span className="pb-2 text-sm text-primary-400">a</span>
                  <input
                    type="date"
                    value={hastaCustom}
                    onChange={(e) => setHastaCustom(e.target.value)}
                    className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              )}
            </>
          ) : (
            <p className="pb-2 text-sm text-primary-400">
              El inventario muestra el stock actual; no aplica filtro por fecha.
            </p>
          )}
        </div>
      </div>

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
              <p className="py-10 text-center text-sm text-primary-400">
                No hay datos en el rango seleccionado.
              </p>
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
              <p className="py-10 text-center text-sm text-primary-400">
                No hay datos en el rango seleccionado.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={reporte.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
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
        </div>

        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-primary-100 text-sm">
            <thead className="bg-primary-50">
              <tr>
                {reporte.columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left font-medium text-primary-700">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {reporte.rows.length === 0 ? (
                <tr>
                  <td colSpan={reporte.columns.length} className="px-4 py-8 text-center text-primary-400">
                    No hay registros de {modulo.toLowerCase()} en el rango seleccionado.
                  </td>
                </tr>
              ) : (
                reporte.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-primary-50/50">
                    {reporte.columns.map((col) => {
                      const value = row[col.key]
                      const isEstadoCol = ['estado', 'nivel'].includes(col.key)
                      return (
                        <td key={col.key} className="px-4 py-3 text-primary-700">
                          {isEstadoCol ? (
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                ESTADO_COLORS[value] ?? 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {value}
                            </span>
                          ) : (
                            value
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reportes
