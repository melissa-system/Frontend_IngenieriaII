import { useEffect, useState, type FormEvent } from 'react'
import {
  crearReporte,
  obtenerMisReportes,
  formatearTiempo,
  TIPOS_ACTIVIDAD,
  ETIQUETA_ACTIVIDAD,
  type ReporteFontanero,
  type TipoActividad,
} from '../../components/Services/reportesFontanero.service'
import {
  obtenerArticulos,
  type Articulo,
} from '../../components/Services/inventario.service'

// Fila del selector de materiales. articuloId vacío = fila recién agregada,
// todavía sin elegir.
interface FilaMaterial {
  articuloId: string
  cantidad: string
}

const MINIMO_DESCRIPCION = 10

function hoyISO(): string {
  // Fecha local en formato YYYY-MM-DD. Se arma a mano y no con toISOString(),
  // que convierte a UTC y en Costa Rica (UTC-6) devuelve el día anterior
  // durante las últimas 6 horas del día.
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${ahora.getFullYear()}-${mes}-${dia}`
}

function ReporteActividad() {
  const [tipoActividad, setTipoActividad] = useState<TipoActividad>('reparacion')
  const [descripcion, setDescripcion] = useState('')
  const [fechaTrabajo, setFechaTrabajo] = useState(hoyISO())
  const [horas, setHoras] = useState('')
  const [minutos, setMinutos] = useState('')
  const [filas, setFilas] = useState<FilaMaterial[]>([])

  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [misReportes, setMisReportes] = useState<ReporteFontanero[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const cargar = async () => {
    setCargando(true)
    try {
      // Solo materiales activos: un artículo dado de baja no debería poder
      // usarse en un trabajo nuevo.
      const [listaArticulos, reportes] = await Promise.all([
        obtenerArticulos({ estado: 'activo' }),
        obtenerMisReportes(),
      ])
      setArticulos(listaArticulos)
      setMisReportes(reportes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la información.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  const totalMinutos = (Number(horas) || 0) * 60 + (Number(minutos) || 0)

  // Cuánto queda disponible de un artículo descontando lo que ya se pidió en
  // OTRAS filas: así, si el mismo material está dos veces, el tope de cada
  // fila refleja lo que realmente se puede pedir.
  const disponibleParaFila = (indice: number): number => {
    const idActual = filas[indice]?.articuloId
    if (!idActual) return 0
    const articulo = articulos.find((a) => String(a.id) === idActual)
    if (!articulo) return 0
    const pedidoEnOtrasFilas = filas.reduce((suma, fila, i) => {
      if (i === indice || fila.articuloId !== idActual) return suma
      return suma + (Number(fila.cantidad) || 0)
    }, 0)
    return Math.max(0, articulo.cantidad_disponible - pedidoEnOtrasFilas)
  }

  const filasInvalidas = filas.some((fila, i) => {
    if (!fila.articuloId) return true
    const cantidad = Number(fila.cantidad)
    return !Number.isInteger(cantidad) || cantidad < 1 || cantidad > disponibleParaFila(i)
  })

  const puedeEnviar =
    descripcion.trim().length >= MINIMO_DESCRIPCION &&
    fechaTrabajo !== '' &&
    totalMinutos > 0 &&
    !filasInvalidas &&
    !guardando

  const actualizarFila = (indice: number, cambios: Partial<FilaMaterial>) => {
    setFilas((actuales) =>
      actuales.map((fila, i) => (i === indice ? { ...fila, ...cambios } : fila)),
    )
  }

  const limpiar = () => {
    setTipoActividad('reparacion')
    setDescripcion('')
    setFechaTrabajo(hoyISO())
    setHoras('')
    setMinutos('')
    setFilas([])
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!puedeEnviar) return
    setGuardando(true)
    setError('')
    setExito('')

    try {
      await crearReporte({
        tipoActividad,
        descripcion: descripcion.trim(),
        fechaTrabajo,
        tiempoMinutos: totalMinutos,
        materiales: filas.map((fila) => ({
          articuloId: Number(fila.articuloId),
          cantidad: Number(fila.cantidad),
        })),
      })
      setExito('Reporte registrado correctamente.')
      limpiar()
      // Se recarga todo: los reportes para ver el nuevo, y los artículos
      // porque su stock acaba de bajar.
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el reporte.')
    } finally {
      setGuardando(false)
    }
  }

  const etiquetaCampo = 'block text-sm font-medium text-primary-900'
  const inputCls =
    'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Registro de actividad
        </h1>
        <p className="mt-1 text-sm text-primary-600">
          Anota el trabajo realizado, el tiempo que tomó y los materiales que
          usaste. Los materiales se descuentan del inventario automáticamente.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tipo" className={etiquetaCampo}>
              Tipo de actividad
            </label>
            <select
              id="tipo"
              value={tipoActividad}
              onChange={(e) => setTipoActividad(e.target.value as TipoActividad)}
              className={inputCls}
            >
              {TIPOS_ACTIVIDAD.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETA_ACTIVIDAD[tipo]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fecha" className={etiquetaCampo}>
              Fecha del trabajo
            </label>
            <input
              id="fecha"
              type="date"
              value={fechaTrabajo}
              // No se permiten fechas futuras: se reporta trabajo ya hecho.
              max={hoyISO()}
              onChange={(e) => setFechaTrabajo(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label htmlFor="descripcion" className={etiquetaCampo}>
            ¿Qué trabajo realizaste?
          </label>
          <textarea
            id="descripcion"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Se cambió el tubo roto frente a la escuela y se repuso el relleno."
            className={inputCls}
          />
          {descripcion.trim().length > 0 &&
            descripcion.trim().length < MINIMO_DESCRIPCION && (
              <p className="mt-1 text-xs text-amber-600">
                Escribe al menos {MINIMO_DESCRIPCION} caracteres (llevas{' '}
                {descripcion.trim().length}).
              </p>
            )}
        </div>

        <div>
          <span className={etiquetaCampo}>Tiempo empleado</span>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="number"
              min={0}
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              placeholder="0"
              aria-label="Horas"
              className="w-20 rounded-lg border border-primary-200 px-3 py-2 text-sm"
            />
            <span className="text-sm text-primary-700">horas</span>
            <input
              type="number"
              min={0}
              max={59}
              value={minutos}
              onChange={(e) => setMinutos(e.target.value)}
              placeholder="0"
              aria-label="Minutos"
              className="w-20 rounded-lg border border-primary-200 px-3 py-2 text-sm"
            />
            <span className="text-sm text-primary-700">minutos</span>
          </div>
        </div>

        {/* Materiales */}
        <div className="space-y-2">
          <span className={etiquetaCampo}>Materiales utilizados (opcional)</span>

          {filas.length === 0 && (
            <p className="text-sm text-primary-500">
              No agregaste materiales. Si el trabajo no consumió nada del
              inventario, puedes enviarlo así.
            </p>
          )}

          {filas.map((fila, indice) => {
            const disponible = disponibleParaFila(indice)
            const cantidad = Number(fila.cantidad)
            const excede = Boolean(fila.articuloId) && cantidad > disponible
            return (
              <div key={indice} className="flex flex-wrap items-start gap-2">
                <select
                  value={fila.articuloId}
                  onChange={(e) =>
                    actualizarFila(indice, { articuloId: e.target.value })
                  }
                  aria-label="Material"
                  className="min-w-[12rem] flex-1 rounded-lg border border-primary-200 px-3 py-2 text-sm"
                >
                  <option value="">Selecciona un material...</option>
                  {articulos.map((articulo) => (
                    <option key={articulo.id} value={articulo.id}>
                      {articulo.nombre} ({articulo.cantidad_disponible} disp.)
                    </option>
                  ))}
                </select>

                <div>
                  <input
                    type="number"
                    min={1}
                    value={fila.cantidad}
                    onChange={(e) =>
                      actualizarFila(indice, { cantidad: e.target.value })
                    }
                    aria-label="Cantidad"
                    className="w-24 rounded-lg border border-primary-200 px-3 py-2 text-sm"
                  />
                  {excede && (
                    <p className="mt-1 text-xs text-red-600">
                      Solo quedan {disponible}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFilas((actuales) => actuales.filter((_, i) => i !== indice))
                  }
                  className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 hover:bg-primary-50"
                >
                  Quitar
                </button>
              </div>
            )
          })}

          <button
            type="button"
            onClick={() =>
              setFilas((actuales) => [...actuales, { articuloId: '', cantidad: '1' }])
            }
            disabled={articulos.length === 0}
            className="rounded-full border border-primary-300 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
          >
            + Agregar material
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        {exito && (
          <p className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm font-medium text-green-800">
            {exito}
          </p>
        )}

        <button
          type="submit"
          disabled={!puedeEnviar}
          className="rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : 'Guardar reporte'}
        </button>
      </form>

      {/* Historial propio */}
      <div>
        <h2 className="text-lg font-semibold text-primary-900">
          Mis reportes anteriores
        </h2>

        <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-primary-900">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-primary-900">Actividad</th>
                <th className="px-4 py-3 text-left font-semibold text-primary-900">Tiempo</th>
                <th className="px-4 py-3 text-left font-semibold text-primary-900">Materiales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cargando ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-primary-500">
                    Cargando...
                  </td>
                </tr>
              ) : misReportes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-primary-500">
                    Todavía no has registrado ninguna actividad.
                  </td>
                </tr>
              ) : (
                misReportes.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-primary-700">
                      {reporte.fecha_trabajo}
                    </td>
                    <td className="px-4 py-3 text-primary-700">
                      {ETIQUETA_ACTIVIDAD[reporte.tipo_actividad]}
                      <span className="block text-xs text-primary-500">
                        {reporte.descripcion}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-primary-700">
                      {formatearTiempo(reporte.tiempo_minutos)}
                    </td>
                    <td className="px-4 py-3 text-primary-700">
                      {reporte.materiales.length === 0
                        ? '—'
                        : reporte.materiales
                            .map((m) => `${m.nombre_articulo} (${m.cantidad})`)
                            .join(', ')}
                    </td>
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

export default ReporteActividad
