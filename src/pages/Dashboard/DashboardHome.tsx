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

function StatCard({
  title,
  value,
  subtitle,
  to,
}: {
  title: string
  value: string
  subtitle: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-primary-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
    >
      <p className="text-sm font-medium text-primary-500">{title}</p>
      <p className="mt-1 text-3xl font-semibold text-primary-900">{value}</p>
      <p className="mt-1 text-xs text-primary-400">{subtitle}</p>
    </Link>
  )
}

// Íconos outline, mismo estilo que el landing (ver diseños/iconos.md):
// viewBox 24x24, stroke="currentColor", trazos redondeados.
function IconAveria() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.732 0-2.813-1.874-1.948-3.374L10.7 4.7c.866-1.5 3.032-1.5 3.898 0l7.005 12.125ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

function IconSolicitud() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function IconStock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  )
}

function IconAbonado() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function AlertCard({
  icon,
  color,
  mensaje,
  count,
  to,
}: {
  icon: React.ReactNode
  color: string
  mensaje: string
  count: number
  to: string
}) {
  return (
    <Link
      to={to}
      className="flex h-24 items-center gap-3 rounded-xl border border-primary-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
    >
      <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-full ${color}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-primary-900">{mensaje}</p>
        <p className="line-clamp-1 text-xs text-primary-500">
          {count} {count === 1 ? 'elemento' : 'elementos'} requieren atenci&oacute;n
        </p>
      </div>
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white">
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

  const alertasActivas = useMemo(
    () =>
      [
        {
          key: 'averias',
          icon: <IconAveria />,
          color: 'bg-red-100 text-red-600',
          mensaje: 'Averías sin asignar',
          count: averiasSinAsignar,
          to: '/dashboard/averias',
        },
        {
          key: 'solicitudes',
          icon: <IconSolicitud />,
          color: 'bg-yellow-100 text-yellow-600',
          mensaje: 'Solicitudes sin notificar',
          count: solicitudesSinNotificar,
          to: '/dashboard/solicitudes',
        },
        {
          key: 'stock',
          icon: <IconStock />,
          color: 'bg-orange-100 text-orange-600',
          mensaje: 'Stock crítico',
          count: stockCritico,
          to: '/dashboard/inventario',
        },
        {
          key: 'abonados',
          icon: <IconAbonado />,
          color: 'bg-blue-100 text-blue-600',
          mensaje: 'Abonados inactivos',
          count: MOCK_ABONADOS.filter((a) => a.estado === 'Inactivo').length,
          to: '/dashboard/abonados',
        },
      ].filter((a) => a.count > 0),
    [averiasSinAsignar, solicitudesSinNotificar, stockCritico],
  )

  const totalAveriasPorTipo = useMemo(
    () => MOCK_AVERIAS_POR_TIPO.reduce((sum, d) => sum + d.value, 0),
    [],
  )

  return (
    <div className="space-y-6">
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
          className="h-10 rounded-full border border-primary-200 px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Abonados"
          value={String(totalAbonados)}
          subtitle={`${activos} activos · ${totalAbonados - activos} inactivos`}
          to="/dashboard/abonados"
        />
        <StatCard
          title="Solicitudes Pendientes"
          value={String(solicitudesPendientes)}
          subtitle="Esperan aprobaci&oacute;n"
          to="/dashboard/solicitudes"
        />
        <StatCard
          title="Aver&iacute;as Activas"
          value={String(averiasActivas)}
          subtitle="Pendientes o en progreso"
          to="/dashboard/averias"
        />
        <StatCard
          title="Stock Bajo"
          value={String(stockBajo)}
          subtitle="Items por reabastecer"
          to="/dashboard/inventario"
        />
      </div>

      {alertasActivas.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
          <h2 className="text-base font-semibold text-yellow-800">
            Alertas r&aacute;pidas
          </h2>
          <p className="mb-4 mt-1 text-sm text-yellow-600">
            Elementos que requieren atenci&oacute;n inmediata
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {alertasActivas.map((a) => (
              <div key={a.key} className="w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(25%-0.5625rem)]">
                <AlertCard icon={a.icon} color={a.color} mensaje={a.mensaje} count={a.count} to={a.to} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-primary-900">
            Solicitudes por Tipo
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={MOCK_SOLICITUDES_POR_TIPO}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e6ebef" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#395f82' }} />
              <YAxis
                type="category"
                dataKey="tipo"
                tick={{ fontSize: 11, fill: '#395f82' }}
                width={110}
              />
              <Tooltip
                formatter={(value) => [`${value} solicitudes`, 'Cantidad']}
              />
              <Bar dataKey="cantidad" fill="#073763" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-hidden rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-primary-900">
            Aver&iacute;as por Tipo
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
              <Pie
                data={MOCK_AVERIAS_POR_TIPO}
                cx="50%"
                cy="46%"
                innerRadius={65}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  const RADIAN = Math.PI / 180
                  const angle = midAngle ?? 0
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
                  const x = cx + radius * Math.cos(-angle * RADIAN)
                  const y = cy + radius * Math.sin(-angle * RADIAN)
                  const pct = (percent ?? 0) * 100
                  if (pct < 6) return null
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#fff"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={11}
                      fontWeight={600}
                    >
                      {pct.toFixed(0)}%
                    </text>
                  )
                }}
              >
                {MOCK_AVERIAS_POR_TIPO.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const numValue = Number(value) || 0
                  const pct = totalAveriasPorTipo
                    ? Math.round((numValue / totalAveriasPorTipo) * 100)
                    : 0
                  return [`${numValue} (${pct}%)`, name]
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 11, lineHeight: '1.4rem' }}
                formatter={(value: string) => (
                  <span className="text-primary-700">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome