import { useMemo, useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const MODULES = ['Abonados', 'Solicitudes', 'Inventario', 'Averías'] as const
const RANGE_OPTIONS = ['Mensual', 'Trimestral', 'Anual', 'Personalizado'] as const

function generateSampleData(moduleName: string) {
  // genera datos de ejemplo por mes
  const base = MODULES.indexOf(moduleName as any) + 1
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return months.map((m, i) => ({
    name: m,
    valor: Math.round((i + 1) * base * (Math.random() * 0.6 + 0.7)),
    linea: Math.round((i + 1) * base * (Math.random() * 0.4 + 0.9)),
    pastel: Math.round((Math.random() * 100) + base * 10),
  }))
}

export default function Reportes() {
  const [module, setModule] = useState<string>(MODULES[0])
  const [range, setRange] = useState<string>(RANGE_OPTIONS[0])
  const [customFrom, setCustomFrom] = useState<string>('')
  const [customTo, setCustomTo] = useState<string>('')

  const data = useMemo(() => generateSampleData(module), [module])

  const totals = useMemo(() => {
    const total = data.reduce((s, d) => s + d.valor, 0)
    const prev = Math.round(total * (0.85 + Math.random() * 0.2))
    return { total, prev }
  }, [data])

  function downloadCSV() {
    const headers = ['Periodo', 'Valor', 'Linea', 'Pastel']
    const rows = data.map((d: any) => [d.name, d.valor, d.linea, d.pastel])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${module}-reporte.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    // Usar impresión del navegador para generar PDF sencillo
    window.print()
  }

  const pieColors = ['#4f46e5', '#06b6d4', '#f97316', '#ef4444', '#10b981']

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reportes</h1>

        <div className="flex gap-3">
          <button onClick={downloadCSV} className="rounded bg-primary-700 px-3 py-2 text-white">Exportar CSV</button>
          <button onClick={exportPDF} className="rounded border border-primary-700 px-3 py-2 text-primary-700">Exportar PDF</button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2 rounded border p-4">
          <label className="block text-sm font-medium text-primary-700">Módulo</label>
          <select value={module} onChange={(e) => setModule(e.target.value)} className="mt-2 w-full rounded border px-2 py-1">
            {MODULES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="rounded border p-4">
          <label className="block text-sm font-medium text-primary-700">Rango</label>
          <select value={range} onChange={(e) => setRange(e.target.value)} className="mt-2 w-full rounded border px-2 py-1">
            {RANGE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {range === 'Personalizado' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded border px-2 py-1" />
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded border px-2 py-1" />
            </div>
          )}
        </div>
      </div>

      <div id="report-print">
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="col-span-2 rounded border p-4">
            <h2 className="mb-2 text-lg font-medium">Gráfico combinado</h2>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <ComposedChart data={data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="valor" barSize={20} fill="#4f46e5" />
                  <Line type="monotone" dataKey="linea" stroke="#06b6d4" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded border p-4">
            <h2 className="mb-2 text-lg font-medium">Distribución</h2>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data} dataKey="pastel" nameKey="name" outerRadius={80} fill="#8884d8" label>
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded border p-4">
          <h2 className="mb-3 text-lg font-medium">Resumen</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
            <div className="rounded bg-primary-50 p-3">
              <div className="text-sm text-primary-600">Total periodo</div>
              <div className="mt-1 text-2xl font-semibold">{totals.total}</div>
            </div>
            <div className="rounded bg-primary-50 p-3">
              <div className="text-sm text-primary-600">Periodo anterior</div>
              <div className="mt-1 text-2xl font-semibold">{totals.prev}</div>
            </div>
            <div className="rounded bg-primary-50 p-3">
              <div className="text-sm text-primary-600">Variación</div>
              <div className="mt-1 text-2xl font-semibold">{Math.round(((totals.total - totals.prev) / Math.max(1, totals.prev)) * 100)}%</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-primary-600">
                  <th className="px-3 py-2">Periodo</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Linea</th>
                  <th className="px-3 py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.name} className="border-t">
                    <td className="px-3 py-2">{d.name}</td>
                    <td className="px-3 py-2">{d.valor}</td>
                    <td className="px-3 py-2">{d.linea}</td>
                    <td className="px-3 py-2">{d.valor + d.linea}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t font-semibold">
                <tr>
                  <td className="px-3 py-2">Totales</td>
                  <td className="px-3 py-2">{data.reduce((s, d) => s + d.valor, 0)}</td>
                  <td className="px-3 py-2">{data.reduce((s, d) => s + d.linea, 0)}</td>
                  <td className="px-3 py-2">{data.reduce((s, d) => s + d.valor + d.linea, 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
