import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { MOCK_ABONADOS, MOCK_AVERIAS_ADMIN, MOCK_SOLICITUDES, MOCK_INVENTARIO, MOCK_SOLICITUDES_POR_TIPO, MOCK_AVERIAS_POR_TIPO } from '../../lib/mockData'

const COLORS = ['#073763', '#13416b', '#395f82', '#6a87a1', '#9cafc1']

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-primary-500">{title}</p>
      <p className="mt-1 font-heading text-3xl font-semibold text-primary-900">{value}</p>
      <p className="mt-1 text-xs text-primary-400">{subtitle}</p>
    </div>
  )
}

function DashboardHome() {
  const totalAbonados = MOCK_ABONADOS.length
  const activos = MOCK_ABONADOS.filter((a) => a.estado === 'Activo').length
  const solicitudesPendientes = MOCK_SOLICITUDES.filter((s) => s.estado === 'Pendiente').length
  const averiasPendientes = MOCK_AVERIAS_ADMIN.filter((a) => a.estado === 'Pendiente' || a.estado === 'En progreso').length
  const stockBajo = MOCK_INVENTARIO.filter((i) => i.stock <= i.stockMinimo).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-primary-900">
          Panel de control
        </h1>
        <p className="mt-1 text-sm text-primary-500">
          Resumen general del sistema SIAPB
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Abonados" value={String(totalAbonados)} subtitle={`${activos} activos · ${totalAbonados - activos} inactivos`} />
        <StatCard title="Solicitudes Pendientes" value={String(solicitudesPendientes)} subtitle="Esperan aprobación" />
        <StatCard title="Averías Activas" value={String(averiasPendientes)} subtitle="Pendientes o en progreso" />
        <StatCard title="Stock Bajo" value={String(stockBajo)} subtitle="Items por reabastecer" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-heading text-lg font-semibold text-primary-900">
            Solicitudes por Tipo
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={MOCK_SOLICITUDES_POR_TIPO} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e6ebef" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#395f82' }} />
              <YAxis type="category" dataKey="tipo" tick={{ fontSize: 11, fill: '#395f82' }} width={130} />
              <Tooltip formatter={(value) => [`${value} solicitudes`, 'Cantidad']} />
              <Bar dataKey="cantidad" fill="#073763" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-heading text-lg font-semibold text-primary-900">
            Averías por Tipo
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
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {MOCK_AVERIAS_POR_TIPO.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
