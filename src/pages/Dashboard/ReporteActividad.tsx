import { useEffect, useState, type FormEvent } from 'react'
import {
  erroresPorCampo,
  tieneErroresDeCampo,
} from '../../components/Services/erroresApi'
import {
  fecha as reglaFecha,
  hayErrores,
  longitud,
  requerido,
  validarCampos,
  type ErroresFormulario,
} from '../../lib/validaciones'
import CampoError, { Obligatorio, enfocarPrimerError } from '../../components/common/CampoError'

type CampoReporte = 'descripcion' | 'fecha' | 'tiempo'
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
  obtenerMisAveriasFontanero,
  type AveriaBackend,
} from '../../components/Services/averias.service'

const MINIMO_DESCRIPCION = 10
const MAXIMO_LARGO_MATERIALES = 500

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
  const [materialesTexto, setMaterialesTexto] = useState('')
  // Avería atendida: '' significa trabajo sin avería específica (mantenimiento,
  // revisión, etc.).
  const [averiaSeleccionada, setAveriaSeleccionada] = useState<number | ''>(
    '',
  )

  const [misReportes, setMisReportes] = useState<ReporteFontanero[]>([])
  const [averiasPendientes, setAveriasPendientes] = useState<AveriaBackend[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  // Alterna entre el historial y el formulario, como en las solicitudes:
  // se ve una cosa a la vez en vez de apilar ambas en la misma pantalla.
  const [vista, setVista] = useState<'lista' | 'crear'>('lista')

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const [reportes, averias] = await Promise.all([
        obtenerMisReportes(),
        obtenerMisAveriasFontanero(),
      ])
      setMisReportes(reportes)
      setAveriasPendientes(averias)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo cargar la información.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  const [errores, setErrores] = useState<ErroresFormulario<CampoReporte>>({})
  const totalMinutos = (Number(horas) || 0) * 60 + (Number(minutos) || 0)

  // Checklist común (PBI 511): en vez de deshabilitar el botón sin decir
  // por qué, se valida al guardar y cada error aparece junto a su campo.
  function validar(): ErroresFormulario<CampoReporte> {
    const nuevos = validarCampos<CampoReporte>(
      {
        descripcion: [
          requerido('La descripción del trabajo', true),
          longitud('La descripción', MINIMO_DESCRIPCION, 2000),
        ],
        fecha: [requerido('La fecha del trabajo', true), reglaFecha({ noFutura: true })],
        tiempo: [
          () => (horas !== '' && !Number.isInteger(Number(horas))) || Number(horas) < 0
            ? 'Las horas deben ser un número entero.'
            : null,
          () => (minutos !== '' && !Number.isInteger(Number(minutos))) || Number(minutos) < 0 || Number(minutos) > 59
            ? 'Los minutos deben ser un número entero entre 0 y 59.'
            : null,
          () => (totalMinutos > 0 ? null : 'Indica cuánto tiempo te tomó el trabajo.'),
          () => (totalMinutos > 1440 ? 'El tiempo no puede superar las 24 horas.' : null),
        ],
      },
      { descripcion, fecha: fechaTrabajo, tiempo: '' },
    )
    return nuevos
  }

  const limpiar = () => {
    setTipoActividad('reparacion')
    setDescripcion('')
    setFechaTrabajo(hoyISO())
    setHoras('')
    setMinutos('')
    setMaterialesTexto('')
    setAveriaSeleccionada('')
    setErrores({})
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (guardando) return
    const nuevos = validar()
    setErrores(nuevos)
    enfocarPrimerError()
    if (hayErrores(nuevos)) return
    setGuardando(true)
    setError('')
    setExito('')

    const materiales = materialesTexto.trim()
    try {
      await crearReporte({
        tipoActividad,
        descripcion: descripcion.trim(),
        fechaTrabajo,
        tiempoMinutos: totalMinutos,
        materialesTexto: materiales.length > 0 ? materiales : undefined,
        averiaId: averiaSeleccionada === '' ? undefined : Number(averiaSeleccionada),
      })
      setExito('Reporte registrado correctamente.')
      limpiar()
      // Se recarga el historial para ver el nuevo reporte.
      await cargar()
      setVista('lista')
    } catch (err) {
      setErrores(erroresPorCampo<CampoReporte>(err, { fechaTrabajo: 'fecha', tiempoMinutos: 'tiempo' }))
      enfocarPrimerError()
      setError(
        tieneErroresDeCampo(err)
          ? ''
          : err instanceof Error ? err.message : 'No se pudo guardar el reporte.',
      )
    } finally {
      setGuardando(false)
    }
  }

  const cancelar = () => {
    limpiar()
    setError('')
    setExito('')
  }

  const etiquetaCampo = 'block text-sm font-medium text-primary-900'
  const inputCls =
    'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Reporte Fontanero
        </h1>
        <p className="mt-1 text-sm text-primary-600">
          Anota el trabajo realizado, el tiempo que tomó y los materiales que
          usaste.
        </p>
      </div>

      {/* Pestañas: historial y formulario, como en las solicitudes. */}
      <div className="flex gap-6 border-b border-primary-100">
        <button
          type="button"
          onClick={() => setVista('lista')}
          className={`border-b-2 pb-2 text-sm font-semibold transition-colors ${
            vista === 'lista'
              ? 'border-primary-700 text-primary-900'
              : 'border-transparent text-primary-400 hover:text-primary-700'
          }`}
        >
          Mis reportes
        </button>
        <button
          type="button"
          onClick={() => setVista('crear')}
          className={`border-b-2 pb-2 text-sm font-semibold transition-colors ${
            vista === 'crear'
              ? 'border-primary-700 text-primary-900'
              : 'border-transparent text-primary-400 hover:text-primary-700'
          }`}
        >
          Nuevo reporte
        </button>
      </div>

      {vista === 'crear' && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tipo" className={etiquetaCampo}>
                Tipo de actividad
                <Obligatorio />
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
                <Obligatorio />
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
              <CampoError mensaje={errores.fecha} />
            </div>
          </div>

          <div>
            <label htmlFor="averia" className={etiquetaCampo}>
              Avería atendida (opcional)
            </label>
            <select
              id="averia"
              value={averiaSeleccionada}
              onChange={(e) =>
                setAveriaSeleccionada(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              className={inputCls}
            >
              <option value="">Sin avería específica</option>
              {averiasPendientes.map((averia) => (
                <option key={averia.id} value={averia.id}>
                  {averia.codigo_averia} — {averia.tipo_averia}
                </option>
              ))}
            </select>
            {averiasPendientes.length === 0 && (
              <p className="mt-1 text-xs text-primary-500">
                No tienes averías asignadas por atender. Puedes registrar la
                actividad de todas formas.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="descripcion" className={etiquetaCampo}>
              ¿Qué trabajo realizaste?
              <Obligatorio />
            </label>
            <textarea
              id="descripcion"
              rows={3}
              value={descripcion}
              maxLength={2000}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Se cambió el tubo roto frente a la escuela y se repuso el relleno."
              className={inputCls}
            />
            <CampoError mensaje={errores.descripcion} />
            {descripcion.trim().length > 0 &&
              descripcion.trim().length < MINIMO_DESCRIPCION && (
                <p className="mt-1 text-xs text-amber-600">
                  Escribe al menos {MINIMO_DESCRIPCION} caracteres (llevas{' '}
                  {descripcion.trim().length}).
                </p>
              )}
          </div>

          <div>
            <label htmlFor="materiales" className={etiquetaCampo}>
              Materiales utilizados (opcional)
            </label>
            <textarea
              id="materiales"
              rows={2}
              value={materialesTexto}
              maxLength={MAXIMO_LARGO_MATERIALES}
              onChange={(e) => setMaterialesTexto(e.target.value)}
              placeholder="Ej: 2 m de tubo PVC, 1 codo, 3 m de cable."
              className={inputCls}
            />
            <p className="mt-1 text-xs text-primary-500">
              Escribe los materiales que usaste. La entrada y salida de{' '}
              inventario la registra la administración por separado.
            </p>
          </div>

          <div>
            <span className={etiquetaCampo}>
              Tiempo empleado
              <Obligatorio />
            </span>
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
            <CampoError mensaje={errores.tiempo} />
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

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar reporte'}
            </button>
            <button
              type="button"
              onClick={cancelar}
              className="rounded-lg border border-primary-200 px-5 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {vista === 'lista' && (
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
                        {reporte.materiales_texto ??
                          (reporte.materiales.length === 0
                            ? '—'
                            : reporte.materiales
                                .map((m) => `${m.nombre_articulo} (${m.cantidad})`)
                                .join(', '))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReporteActividad