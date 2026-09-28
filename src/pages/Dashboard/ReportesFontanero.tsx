import { useCallback, useEffect, useState } from 'react'
import {
  obtenerReportes,
  formatearTiempo,
  TIPOS_ACTIVIDAD,
  ETIQUETA_ACTIVIDAD,
  type ReporteFontanero,
  type FiltrosReportes,
  type TipoActividad,
} from '../../components/Services/reportesFontanero.service'
import {
  obtenerEmpleados,
  type Empleado,
} from '../../components/Services/empleados.service'

const LIMITE_POR_PAGINA = 25

function ReportesFontanero() {
  const [reportes, setReportes] = useState<ReporteFontanero[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [detalle, setDetalle] = useState<ReporteFontanero | null>(null)

  const [fontaneros, setFontaneros] = useState<Empleado[]>([])
  const [empleadoId, setEmpleadoId] = useState('')
  const [tipoActividad, setTipoActividad] = useState<TipoActividad | ''>('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  // Para el filtro solo interesan los empleados con puesto de fontanero: son
  // los únicos que pueden generar estos reportes.
  useEffect(() => {
    obtenerEmpleados()
      .then((lista) =>
        setFontaneros(lista.filter((e) => e.puesto === 'Fontanero')),
      )
      .catch(() => setFontaneros([]))
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const filtros: FiltrosReportes = { pagina, limite: LIMITE_POR_PAGINA }
      if (empleadoId) filtros.empleadoId = Number(empleadoId)
      if (tipoActividad) filtros.tipoActividad = tipoActividad
      if (desde) filtros.desde = desde
      if (hasta) filtros.hasta = hasta

      const respuesta = await obtenerReportes(filtros)
      setReportes(respuesta.datos)
      setTotal(respuesta.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los reportes.')
      setReportes([])
      setTotal(0)
    } finally {
      setCargando(false)
    }
  }, [pagina, empleadoId, tipoActividad, desde, hasta])

  useEffect(() => {
    void cargar()
  }, [cargar])

  // Al cambiar un filtro se vuelve a la primera página: si el usuario está en
  // la página 3 y filtra algo con 2 resultados, quedaría viendo una vacía.
  const aplicarFiltro = <T,>(setter: (valor: T) => void) => (valor: T) => {
    setter(valor)
    setPagina(1)
  }

  const limpiarFiltros = () => {
    setEmpleadoId('')
    setTipoActividad('')
    setDesde('')
    setHasta('')
    setPagina(1)
  }

  const hayFiltros = Boolean(empleadoId || tipoActividad || desde || hasta)
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA))
  const selectCls =
    'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Reportes de actividad de fontaneros
        </h1>
        <p className="mt-1 text-sm text-primary-600">
          Historial de trabajos realizados, tiempo empleado y materiales
          consumidos en cada intervención.
        </p>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="f-fontanero" className="block text-sm font-medium text-primary-900">
              Fontanero
            </label>
            <select
              id="f-fontanero"
              value={empleadoId}
              onChange={(e) => aplicarFiltro(setEmpleadoId)(e.target.value)}
              className={selectCls}
            >
              <option value="">Todos</option>
              {fontaneros.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="f-actividad" className="block text-sm font-medium text-primary-900">
              Tipo de actividad
            </label>
            <select
              id="f-actividad"
              value={tipoActividad}
              onChange={(e) =>
                aplicarFiltro(setTipoActividad)(e.target.value as TipoActividad | '')
              }
              className={selectCls}
            >
              <option value="">Todas</option>
              {TIPOS_ACTIVIDAD.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETA_ACTIVIDAD[tipo]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="f-desde" className="block text-sm font-medium text-primary-900">
              Desde
            </label>
            <input
              id="f-desde"
              type="date"
              value={desde}
              onChange={(e) => aplicarFiltro(setDesde)(e.target.value)}
              className={selectCls}
            />
          </div>

          <div>
            <label htmlFor="f-hasta" className="block text-sm font-medium text-primary-900">
              Hasta
            </label>
            <input
              id="f-hasta"
              type="date"
              value={hasta}
              onChange={(e) => aplicarFiltro(setHasta)(e.target.value)}
              className={selectCls}
            />
          </div>
        </div>

        {hayFiltros && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">Fontanero</th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">Fecha</th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">Actividad</th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">Tiempo</th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">Materiales</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cargando ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-primary-500">
                  Cargando reportes...
                </td>
              </tr>
            ) : reportes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-primary-500">
                  {hayFiltros
                    ? 'No hay reportes que coincidan con los filtros.'
                    : 'Todavía no hay reportes de actividad registrados.'}
                </td>
              </tr>
            ) : (
              reportes.map((reporte) => (
                <tr key={reporte.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-primary-700">
                    {reporte.empleado?.nombre ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-primary-700">
                    {reporte.fecha_trabajo}
                  </td>
                  <td className="px-4 py-3 text-primary-700">
                    {ETIQUETA_ACTIVIDAD[reporte.tipo_actividad]}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-primary-700">
                    {formatearTiempo(reporte.tiempo_minutos)}
                  </td>
                  <td className="px-4 py-3 text-primary-700">
                    {reporte.materiales.length === 0
                      ? '—'
                      : `${reporte.materiales.length} material${reporte.materiales.length === 1 ? '' : 'es'}`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDetalle(reporte)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-primary-600">
            {total} reporte{total === 1 ? '' : 's'} · página {pagina} de {totalPaginas}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1 || cargando}
              className="rounded-full border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas || cargando}
              className="rounded-full border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Detalle */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <h2 className="text-lg font-semibold text-primary-900">
              Reporte #{detalle.id}
            </h2>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="font-medium text-primary-900">Fontanero:</dt>
                <dd className="text-primary-700">{detalle.empleado?.nombre ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-primary-900">Fecha del trabajo:</dt>
                <dd className="text-primary-700">{detalle.fecha_trabajo}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-primary-900">Tipo de actividad:</dt>
                <dd className="text-primary-700">
                  {ETIQUETA_ACTIVIDAD[detalle.tipo_actividad]}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-primary-900">Tiempo empleado:</dt>
                <dd className="text-primary-700">
                  {formatearTiempo(detalle.tiempo_minutos)}
                </dd>
              </div>
              {detalle.averia?.codigo_averia && (
                <div className="flex gap-2">
                  <dt className="font-medium text-primary-900">Avería relacionada:</dt>
                  <dd className="text-primary-700">{detalle.averia.codigo_averia}</dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-primary-900">Trabajo realizado:</dt>
                <dd className="mt-1 whitespace-pre-line text-primary-700">
                  {detalle.descripcion}
                </dd>
              </div>
            </dl>

            <h3 className="mt-5 text-sm font-semibold text-primary-900">
              Materiales utilizados
            </h3>
            {detalle.materiales.length === 0 ? (
              <p className="mt-1 text-sm text-primary-500">
                Este trabajo no consumió materiales del inventario.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-gray-200 rounded-lg border border-gray-200">
                {detalle.materiales.map((material) => (
                  <li
                    key={material.id}
                    className="flex justify-between px-3 py-2 text-sm text-primary-700"
                  >
                    <span>{material.nombre_articulo}</span>
                    <span className="font-medium">{material.cantidad}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetalle(null)}
                className="rounded-full bg-primary-700 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportesFontanero
