import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  MOCK_ABONADOS,
  MOCK_AVERIAS_ADMIN,
  MOCK_SOLICITUDES,
  MOCK_INVENTARIO,
  MOCK_SOLICITUDES_POR_TIPO,
  MOCK_AVERIAS_POR_TIPO,
} from '../../lib/mockData'

type Rango = 'este-mes' | 'este-trimestre' | 'este-ano' | 'personalizado'

const COLORS = ['#073763', '#13416b', '#395f82', '#6a87a1', '#9cafc1']

function getRange(rango: Rango): { desde: string; hasta: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')

  if (rango === 'este-mes') {
    return { desde: `${y}-${m}-01`, hasta: `${y}-${m}-${d}` }
  }
  if (rango === 'este-trimestre') {
    const trimestreInicio = Math.floor((now.getMonth()) / 3) * 3 + 1
    const mi = String(trimestreInicio).padStart(2, '0')
    return { desde: `${y}-${mi}-01`, hasta: `${y}-${m}-${d}` }
  }
  if (rango === 'este-ano') {
    return { desde: `${y}-01-01`, hasta: `${y}-${m}-${d}` }
  }
  return { desde: `${y}-${m}-01`, hasta: `${y}-${m}-${d}` }
}

function fechaEnRango(fecha: string, desde: string, hasta: string): boolean {
  return fecha >= desde && fecha <= hasta
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-primary-500">{title}</p>
      <p className="mt-1 text-3xl font-semibold text-primary-900">{value}</p>
      <p className="mt-1 text-xs text-primary-400">{subtitle}</p>
    </div>
  )
}

function AlertCard({
  icon,
  color,
  mensaje,
  count,
  to,
}: {
  icon: string
  color: string
  mensaje: string
  count: number
  to: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-primary-100 bg-white p-4 shadow-sm transition-colors hover:bg-primary-50"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${color}`}>
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-primary-900">{mensaje}</p>
        <p className="text-xs text-primary-500">
          {count} {count === 1 ? 'elemento' : 'elementos'} requieren atenci&oacute;n
        </p>
      </div>
      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${color.replace('bg-', 'bg-').replace('text-', '')}`}>
        {count}
      </span>
    </Link>
  )
}

function DashboardHome() {
  const [rango, setRango] = useState<Rango>('este-mes')
  const [desdeCustom, setDesdeCustom] = useState('')
  const [hastaCustom, setHastaCustom] = useState('')

  const { desde, hasta } = useMemo(() => {
    if (rango === 'personalizado' && desdeCustom && hastaCustom) {
      return { desde: desdeCustom, hasta: hastaCustom }
    }
    return getRange(rango)
  }, [rango, desdeCustom, hastaCustom])

  const abonadosFiltrados = useMemo(
    () => MOCK_ABONADOS.filter((a) => fechaEnRango(a.fechaRegistro, desde, hasta)),
    [desde, hasta],
  )

  const solicitudesFiltradas = useMemo(
    () => MOCK_SOLICITUDES.filter((s) => fechaEnRango(s.fecha, desde, hasta)),
    [desde, hasta],
  )

  const averiasFiltradas = useMemo(
    () => MOCK_AVERIAS_ADMIN.filter((a) => fechaEnRango(a.fecha, desde, hasta)),
    [desde, hasta],
  )

  const totalAbonados = abonadosFiltrados.length
  const activos = abonadosFiltrados.filter((a) => a.estado === 'Activo').length
  const solicitudesPendientes = solicitudesFiltradas.filter((s) => s.estado === 'Pendiente').length
  const averiasActivas = averiasFiltradas.filter(
    (a) => a.estado === 'Pendiente' || a.estado === 'En progreso',
  ).length
  const stockBajo = MOCK_INVENTARIO.filter((i) => i.stock <= i.stockMinimo).length

  const averiasSinAsignar = MOCK_AVERIAS_ADMIN.filter(
    (a) => a.estado === 'Pendiente' && !a.fontaneroAsignado,
  ).length

  const solicitudesSinNotificar = MOCK_SOLICITUDES.filter(
    (s) => s.estado === 'Pendiente' && !s.notificado,
  ).length

  const stockCritico = MOCK_INVENTARIO.filter((i) => i.stock <= Math.floor(i.stockMinimo / 2)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">
            Panel de control
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            Resumen general del sistema SIAPB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={rango}
            onChange={(e) => setRango(e.target.value as Rango)}
            className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="este-mes">Este mes</option>
            <option value="este-trimestre">Este trimestre</option>
            <option value="este-ano">Este a&ntilde;o</option>
            <option value="personalizado">Personalizado</option>
          </select>

          {rango === 'personalizado' && (
            <>
              <input
                type="date"
                value={desdeCustom}
                onChange={(e) => setDesdeCustom(e.target.value)}
                className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
              />
              <span className="text-sm text-primary-400">a</span>
              <input
                type="date"
                value={hastaCustom}
                onChange={(e) => setHastaCustom(e.target.value)}
                className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
              />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Abonados"
          value={String(totalAbonados)}
          subtitle={`${activos} activos · ${totalAbonados - activos} inactivos`}
        />
        <StatCard
          title="Solicitudes Pendientes"
          value={String(solicitudesPendientes)}
          subtitle="Esperan aprobaci&oacute;n"
        />
        <StatCard
          title="Aver&iacute;as Activas"
          value={String(averiasActivas)}
          subtitle="Pendientes o en progreso"
        />
        <StatCard
          title="Stock Bajo"
          value={String(stockBajo)}
          subtitle="Items por reabastecer"
        />
      </div>

      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
        <h2 className="text-base font-semibold text-yellow-800">
          Alertas r&aacute;pidas
        </h2>
        <p className="mb-4 mt-1 text-sm text-yellow-600">
          Elementos que requieren atenci&oacute;n inmediata
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AlertCard
            icon="&#128680;"
            color="bg-red-100 text-red-600"
            mensaje="Aver&iacute;as sin asignar"
            count={averiasSinAsignar}
            to="/dashboard/averias"
          />
          <AlertCard
            icon="&#128196;"
            color="bg-yellow-100 text-yellow-600"
            mensaje="Solicitudes sin notificar"
            count={solicitudesSinNotificar}
            to="/dashboard/solicitudes"
          />
          <AlertCard
            icon="&#128230;"
            color="bg-orange-100 text-orange-600"
            mensaje="Stock cr&iacute;tico"
            count={stockCritico}
            to="/dashboard/inventario"
          />
          <AlertCard
            icon="&#128737;"
            color="bg-blue-100 text-blue-600"
            mensaje="Abonados inactivos"
            count={MOCK_ABONADOS.filter((a) => a.estado === 'Inactivo').length}
            to="/dashboard/abonados"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-primary-900">
            Solicitudes por Tipo
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={MOCK_SOLICITUDES_POR_TIPO} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e6ebef" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#395f82' }} />
              <YAxis
                type="category"
                dataKey="tipo"
                tick={{ fontSize: 11, fill: '#395f82' }}
                width={130}
              />
              <Tooltip
                formatter={(value) => [`${value} solicitudes`, 'Cantidad']}
              />
              <Bar dataKey="cantidad" fill="#073763" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-primary-900">
            Aver&iacute;as por Tipo
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={MOCK_AVERIAS_POR_TIPO}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {MOCK_AVERIAS_POR_TIPO.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome