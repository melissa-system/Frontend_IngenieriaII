import { useState, useEffect, useCallback } from 'react'
import {
  obtenerBitacora,
  MODULOS_CON_MOVIMIENTOS,
  ACCIONES_BITACORA,
  ETIQUETA_MODULO,
  ETIQUETA_ACCION,
  type RegistroBitacora,
  type FiltrosBitacora,
  type ModuloBitacora,
  type AccionBitacora,
} from '../../components/Services/bitacora.service'

const LIMITE_POR_PAGINA = 25

// Color del "chip" de acción, para distinguirlas de un vistazo en la tabla.
const COLOR_ACCION: Record<AccionBitacora, string> = {
  creacion: 'bg-green-100 text-green-800',
  edicion: 'bg-blue-100 text-blue-800',
  cambio_estado: 'bg-amber-100 text-amber-800',
  eliminacion: 'bg-red-100 text-red-800',
}

function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  return fecha.toLocaleString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Arma la descripción del cambio según el tipo de acción, para que la columna
// "Detalle" se lea en lenguaje natural en vez de mostrar columnas vacías.
function describirCambio(registro: RegistroBitacora): string {
  const { accion, campo, valor_anterior, valor_nuevo, observaciones } = registro

  if (accion === 'edicion' && campo) {
    return `${campo}: "${valor_anterior ?? '(vacío)'}" → "${valor_nuevo ?? '(vacío)'}"`
  }

  if (accion === 'cambio_estado') {
    const transicion = `${valor_anterior ?? '(sin estado)'} → ${valor_nuevo ?? ''}`
    return observaciones ? `${transicion} — ${observaciones}` : transicion
  }

  return observaciones ?? '—'
}

function Bitacora() {
  const [registros, setRegistros] = useState<RegistroBitacora[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Filtros del formulario. Se aplican al pedir datos, no mientras se escribe.
  const [modulo, setModulo] = useState<ModuloBitacora | ''>('')
  const [accion, setAccion] = useState<AccionBitacora | ''>('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const filtros: FiltrosBitacora = {
        pagina,
        limite: LIMITE_POR_PAGINA,
      }
      if (modulo) filtros.modulo = modulo
      if (accion) filtros.accion = accion
      if (desde) filtros.desde = desde
      if (hasta) filtros.hasta = hasta

      const respuesta = await obtenerBitacora(filtros)
      setRegistros(respuesta.datos)
      setTotal(respuesta.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la auditoría.')
      setRegistros([])
      setTotal(0)
    } finally {
      setCargando(false)
    }
  }, [pagina, modulo, accion, desde, hasta])

  useEffect(() => {
    void cargar()
  }, [cargar])

  // Al cambiar cualquier filtro se vuelve a la primera página: si el usuario
  // estaba en la página 5 y filtra algo con 2 resultados, quedaría viendo una
  // página vacía.
  const aplicarFiltro = <T,>(setter: (valor: T) => void) => (valor: T) => {
    setter(valor)
    setPagina(1)
  }

  const limpiarFiltros = () => {
    setModulo('')
    setAccion('')
    setDesde('')
    setHasta('')
    setPagina(1)
  }

  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA))
  const hayFiltros = Boolean(modulo || accion || desde || hasta)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Auditoría del sistema
        </h1>
        <p className="mt-1 text-sm text-primary-600">
          Registro de todos los movimientos del sistema: creaciones, ediciones,
          cambios de estado y eliminaciones.
        </p>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="filtro-modulo"
              className="block text-sm font-medium text-primary-900"
            >
              Módulo
            </label>
            <select
              id="filtro-modulo"
              value={modulo}
              onChange={(e) =>
                aplicarFiltro(setModulo)(e.target.value as ModuloBitacora | '')
              }
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">Todos</option>
              {MODULOS_CON_MOVIMIENTOS.map((m) => (
                <option key={m} value={m}>
                  {ETIQUETA_MODULO[m]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filtro-accion"
              className="block text-sm font-medium text-primary-900"
            >
              Acción
            </label>
            <select
              id="filtro-accion"
              value={accion}
              onChange={(e) =>
                aplicarFiltro(setAccion)(e.target.value as AccionBitacora | '')
              }
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">Todas</option>
              {ACCIONES_BITACORA.map((a) => (
                <option key={a} value={a}>
                  {ETIQUETA_ACCION[a]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filtro-desde"
              className="block text-sm font-medium text-primary-900"
            >
              Desde
            </label>
            <input
              id="filtro-desde"
              type="date"
              value={desde}
              onChange={(e) => aplicarFiltro(setDesde)(e.target.value)}
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="filtro-hasta"
              className="block text-sm font-medium text-primary-900"
            >
              Hasta
            </label>
            <input
              id="filtro-hasta"
              type="date"
              value={hasta}
              onChange={(e) => aplicarFiltro(setHasta)(e.target.value)}
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
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
              <th className="px-4 py-3 text-left font-semibold text-primary-900">
                Fecha
              </th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">
                Módulo
              </th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">
                Registro
              </th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">
                Acción
              </th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">
                Usuario
              </th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">
                Detalle
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cargando ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-primary-500">
                  Cargando movimientos...
                </td>
              </tr>
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-primary-500">
                  {hayFiltros
                    ? 'No hay movimientos que coincidan con los filtros.'
                    : 'Todavía no hay movimientos registrados.'}
                </td>
              </tr>
            ) : (
              registros.map((registro) => (
                <tr key={registro.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-primary-700">
                    {formatearFecha(registro.fecha)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-primary-700">
                    {ETIQUETA_MODULO[registro.modulo] ?? registro.modulo}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-primary-700">
                    #{registro.registro_id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        COLOR_ACCION[registro.accion] ?? 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ETIQUETA_ACCION[registro.accion] ?? registro.accion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-primary-700">
                    {/* Las acciones del formulario público no tienen usuario
                        autenticado: ahí el backend guarda el correo que escribió
                        la persona, o null si tampoco lo hay. */}
                    {registro.usuario_email ?? 'Sistema'}
                  </td>
                  <td className="px-4 py-3 text-primary-700">
                    {describirCambio(registro)}
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
            {total} movimiento{total === 1 ? '' : 's'} · página {pagina} de{' '}
            {totalPaginas}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1 || cargando}
              className="rounded-full border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas || cargando}
              className="rounded-full border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bitacora