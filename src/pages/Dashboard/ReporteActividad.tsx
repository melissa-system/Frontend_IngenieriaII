import Alerta from '../../components/ui/Alerta'
import { FilaVacia } from '../../components/ui/EmptyState'
import { FilasEsqueleto } from '../../components/ui/Cargando'
import { Notificar } from '../../components/ui/ToastProvider'
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import {
  FileDropZone,
  validarImagen,
  ACCEPT_IMAGEN,
} from '../../components/common/FileDropZone'

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
import {
  obtenerMisLabores,
  type LaborBackend,
} from '../../components/Services/labores.service'
import Button from '../../components/ui/Button'
import Tabs from '../../components/ui/Tabs'
import Table from '../../components/ui/Table'
import Paginador from '../../components/ui/Paginador'
import Modal, { ModalTitulo } from '../../components/ui/Modal'
import DetalleReporteFontanero from '../../components/Reportes/DetalleReporteFontanero'

const MINIMO_DESCRIPCION = 10
const MAXIMO_LARGO_MATERIALES = 500
const POR_PAGINA_REPORTES = 8

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
  // Permite llegar desde el dashboard del fontanero con una avería concreta ya
  // seleccionada y, si acaba de finalizar el cronómetro, con el tiempo real.
  const [searchParams, setSearchParams] = useSearchParams()
  const averiaParam = searchParams.get('averia')
  const laborParam = searchParams.get('labor')
  const nuevoParam = searchParams.get('nuevo')
  const minutosParam = searchParams.get('minutos')
  const codigoParam = searchParams.get('codigo')
  const fechaParam = searchParams.get('fecha')
  const tipoParam = searchParams.get('tipo')

  // Cuando el reporte viene del cronómetro de un trabajo (avería o labor), la
  // fecha y el tiempo son los reales de la gestión y NO se editan: el
  // fontanero solo describe el trabajo y los materiales.
  const medicionBloqueada = Boolean((averiaParam || laborParam) && minutosParam)

  const minutosIniciales = (() => {
    const n = Number(minutosParam)
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null
  })()

  const tipoInicial = (() => {
    if (averiaParam) return 'atencion_averia' as TipoActividad
    if (
      laborParam &&
      tipoParam &&
      (TIPOS_ACTIVIDAD as readonly string[]).includes(tipoParam)
    ) {
      return tipoParam as TipoActividad
    }
    return 'reparacion' as TipoActividad
  })()

  const [tipoActividad, setTipoActividad] = useState<TipoActividad>(tipoInicial)
  const [descripcion, setDescripcion] = useState('')
  const [fechaTrabajo, setFechaTrabajo] = useState(fechaParam ?? hoyISO())
  const [horas, setHoras] = useState(() =>
    minutosIniciales ? String(Math.floor(minutosIniciales / 60)) : '',
  )
  const [minutos, setMinutos] = useState(() =>
    minutosIniciales ? String(minutosIniciales % 60) : '',
  )
  const [materialesTexto, setMaterialesTexto] = useState('')
  // Evidencia opcional (una imagen) del trabajo realizado.
  const [evidencia, setEvidencia] = useState<File | null>(null)
  const [evidenciaPreview, setEvidenciaPreview] = useState<string | null>(null)
  const [errorEvidencia, setErrorEvidencia] = useState('')
  // Trabajo atendido, codificado como "averia:<id>" o "labor:<id>". '' =
  // trabajo sin avería/labor específica (mantenimiento, revisión, etc.).
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState<string>(
    averiaParam && Number.isInteger(Number(averiaParam))
      ? `averia:${Number(averiaParam)}`
      : laborParam && Number.isInteger(Number(laborParam))
        ? `labor:${Number(laborParam)}`
        : '',
  )

  const [misReportes, setMisReportes] = useState<ReporteFontanero[]>([])
  const [averiasPendientes, setAveriasPendientes] = useState<AveriaBackend[]>([])
  const [laboresPendientes, setLaboresPendientes] = useState<LaborBackend[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  // Alterna entre el historial y el formulario, como en las solicitudes:
  // se ve una cosa a la vez en vez de apilar ambas en la misma pantalla.
  const [vista, setVista] = useState<'lista' | 'crear'>(
    nuevoParam ? 'crear' : 'lista',
  )

  // Detalle de un reporte del historial y paginación de "Mis reportes".
  const [detalle, setDetalle] = useState<ReporteFontanero | null>(null)
  const [paginaReportes, setPaginaReportes] = useState(1)

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const [reportes, averias, labores] = await Promise.all([
        obtenerMisReportes(),
        obtenerMisAveriasFontanero(),
        obtenerMisLabores(),
      ])
      setMisReportes(reportes)
      setAveriasPendientes(averias)
      setLaboresPendientes(labores)
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
    setEvidencia(null)
    setEvidenciaPreview(null)
    setErrorEvidencia('')
    setTrabajoSeleccionado('')
    setErrores({})
    // Se quitan los parámetros de la URL para que el formulario quede limpio y
    // editable si el fontanero vuelve a abrir "Nuevo reporte".
    setSearchParams({}, { replace: true })
  }

  const handleEvidenciaSelect = (file: File) => {
    const mensaje = validarImagen(file)
    if (mensaje) {
      setErrorEvidencia(mensaje)
      setEvidencia(null)
      setEvidenciaPreview(null)
      return
    }
    setErrorEvidencia('')
    setEvidencia(file)
    setEvidenciaPreview(
      file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    )
  }

  const handleEvidenciaRemove = () => {
    setEvidencia(null)
    setEvidenciaPreview(null)
    setErrorEvidencia('')
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
    const [selTipo, selId] = trabajoSeleccionado
      ? (trabajoSeleccionado.split(':') as ['averia' | 'labor', string])
      : ['', '']
    try {
      await crearReporte({
        tipoActividad,
        descripcion: descripcion.trim(),
        fechaTrabajo,
        tiempoMinutos: totalMinutos,
        materialesTexto: materiales.length > 0 ? materiales : undefined,
        averiaId: selTipo === 'averia' ? Number(selId) : undefined,
        laborId: selTipo === 'labor' ? Number(selId) : undefined,
        evidencia: evidencia ?? undefined,
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

  // Opciones del selector: averías y labores asignadas.
  const opcionesTrabajo = [
    ...averiasPendientes.map((a) => ({
      valor: `averia:${a.id}`,
      etiqueta: 'Avería',
      texto: `${a.codigo_averia} — ${a.tipo_averia}`,
    })),
    ...laboresPendientes.map((l) => ({
      valor: `labor:${l.id}`,
      etiqueta: 'Labor',
      texto: `${l.codigo_labor} - ${ETIQUETA_ACTIVIDAD[l.tipo_actividad]}${
        l.datos_solicitud ? ` · ${l.datos_solicitud.abonado.nombre}` : ''
      }`,
    })),
  ]

  const [selTipo, selId] = trabajoSeleccionado
    ? trabajoSeleccionado.split(':')
    : ['', '']
  const seleccionEnLista = opcionesTrabajo.some(
    (o) => o.valor === trabajoSeleccionado,
  )
  const seleccionFijada =
    !cargando && trabajoSeleccionado !== '' && !seleccionEnLista
  const averiaVinculada =
    selTipo === 'averia'
      ? averiasPendientes.find((a) => a.id === Number(selId))
      : undefined
  const laborVinculada =
    selTipo === 'labor'
      ? laboresPendientes.find((l) => l.id === Number(selId))
      : undefined
  const trabajoDevuelto = averiaVinculada?.devuelta_revision
    ? averiaVinculada.motivo_revision
    : laborVinculada?.devuelta_revision
      ? laborVinculada.motivo_revision
      : null
  // Si el trabajo seleccionado ya tiene un reporte rechazado, al guardar se
  // actualizará ese reporte en vez de crear uno nuevo (aviso al fontanero).
  const reporteRechazado = misReportes.find((r) => {
    if (r.estado_revision !== 'Rechazado') return false
    if (selTipo === 'averia') {
      return r.averia_id !== null && r.averia_id === Number(selId)
    }
    if (selTipo === 'labor') {
      return r.labor_id !== null && r.labor_id === Number(selId)
    }
    return false
  })

  const etiquetaCampo = 'block text-sm font-medium text-primary-900'
  const inputCls =
    'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-titulo-pagina font-semibold text-primary-900">
          Reporte Fontanero
        </h1>
        <p className="mt-1 text-sm text-primary-600">
          Anota el trabajo realizado, el tiempo que tomó y los materiales que
          usaste.
        </p>
      </div>

      {/* Pestañas: historial y formulario, como en las solicitudes. */}
      <Tabs
        pestanas={[
          { valor: 'lista', etiqueta: 'Mis reportes' },
          { valor: 'crear', etiqueta: 'Nuevo reporte' },
        ]}
        activa={vista}
        onCambiar={setVista}
      />

      {vista === 'crear' && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 rounded-2xl border border-primary-200 bg-primary-50 p-4"
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
                disabled={medicionBloqueada}
                onChange={(e) => setTipoActividad(e.target.value as TipoActividad)}
                className={`${inputCls} ${
                  medicionBloqueada
                    ? 'cursor-not-allowed bg-primary-100 text-primary-500'
                    : ''
                }`}
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
                disabled={medicionBloqueada}
                onChange={(e) => setFechaTrabajo(e.target.value)}
                className={`${inputCls} ${
                  medicionBloqueada
                    ? 'cursor-not-allowed bg-primary-100 text-primary-500'
                    : ''
                }`}
              />
              <CampoError mensaje={errores.fecha} />
            </div>
          </div>

          <div>
            <label htmlFor="trabajo" className={etiquetaCampo}>
              Trabajo atendido (opcional)
            </label>
            {seleccionFijada ? (
              <div className="mt-1 flex items-center justify-between rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900">
                <span className="min-w-0 truncate">
                  {codigoParam || trabajoSeleccionado}
                  <span className="ml-2 text-xs text-primary-500">
                    (trabajo ya gestionado)
                  </span>
                </span>
                {!medicionBloqueada && (
                  <button
                    type="button"
                    onClick={() => setTrabajoSeleccionado('')}
                    className="ml-3 flex-none text-xs font-medium text-primary-600 hover:text-primary-800 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
            ) : (
              <select
                id="trabajo"
                value={trabajoSeleccionado}
                disabled={medicionBloqueada}
                onChange={(e) => {
                  const valor = e.target.value
                  setTrabajoSeleccionado(valor)
                  // Al elegir una labor, su tipo define el tipo de actividad.
                  if (valor.startsWith('labor:')) {
                    const id = Number(valor.split(':')[1])
                    const labor = laboresPendientes.find((l) => l.id === id)
                    if (labor) setTipoActividad(labor.tipo_actividad)
                  }
                }}
                className={`${inputCls} ${
                  medicionBloqueada
                    ? 'cursor-not-allowed bg-primary-100 text-primary-500'
                    : ''
                }`}
              >
                <option value="">Sin trabajo específico</option>
                {opcionesTrabajo.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    [{o.etiqueta}] {o.texto}
                  </option>
                ))}
              </select>
            )}
            {trabajoDevuelto && (
              <div className="mt-2">
                <Alerta tipo="advertencia">
                  Este trabajo fue devuelto: {trabajoDevuelto}
                </Alerta>
              </div>
            )}
            {reporteRechazado && (
              <p className="mt-2 text-xs font-medium text-advertencia-700">
                Este trabajo ya tiene un reporte rechazado. Al guardar se
                actualizará ese reporte en vez de crear uno nuevo.
              </p>
            )}
            {opcionesTrabajo.length === 0 && !seleccionFijada && (
              <p className="mt-1 text-xs text-primary-500">
                No tienes trabajos asignados por atender. Puedes registrar la
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
                <p className="mt-1 text-xs text-advertencia-700">
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

          <FileDropZone
            archivo={evidencia}
            archivoPreview={evidenciaPreview}
            onFileSelect={handleEvidenciaSelect}
            onRemoveFile={handleEvidenciaRemove}
            errorArchivo={errorEvidencia}
            label="Evidencia (opcional)"
            ayuda="Adjunta una foto del trabajo realizado si lo consideras útil."
            obligatorio={false}
            accept={ACCEPT_IMAGEN}
            textoFormatos="JPG, PNG, WEBP o GIF hasta 5 MB"
          />

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
                disabled={medicionBloqueada}
                onChange={(e) => setHoras(e.target.value)}
                placeholder="0"
                aria-label="Horas"
                className={`w-20 rounded-lg border border-primary-200 px-3 py-2 text-sm ${
                  medicionBloqueada
                    ? 'cursor-not-allowed bg-primary-100 text-primary-500'
                    : ''
                }`}
              />
              <span className="text-sm text-primary-700">horas</span>
              <input
                type="number"
                min={0}
                max={59}
                value={minutos}
                disabled={medicionBloqueada}
                onChange={(e) => setMinutos(e.target.value)}
                placeholder="0"
                aria-label="Minutos"
                className={`w-20 rounded-lg border border-primary-200 px-3 py-2 text-sm ${
                  medicionBloqueada
                    ? 'cursor-not-allowed bg-primary-100 text-primary-500'
                    : ''
                }`}
              />
              <span className="text-sm text-primary-700">minutos</span>
            </div>
            <CampoError mensaje={errores.tiempo} />
          </div>

          {error && (
            <Alerta tipo="error">
              {error}
            </Alerta>
          )}
          <Notificar mensaje={exito} />

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button
              variant="primary"
              type="submit"
              disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar reporte'}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={cancelar}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {vista === 'lista' && (
        <div>
          <h2 className="text-lg font-semibold text-primary-900">
            Mis reportes anteriores
          </h2>

          <div className="mt-3">
            <Table
              cabecera={['Fecha', 'Actividad', 'Tiempo', 'Materiales', 'Acciones']}
              pie={
                <>
                  {misReportes.length > 0 && (
                    <Paginador
                      total={misReportes.length}
                      pagina={paginaReportes}
                      porPagina={POR_PAGINA_REPORTES}
                      onCambiar={setPaginaReportes}
                      etiqueta="reportes"
                      deshabilitado={cargando}
                    />
                  )}
                </>
              }
            >
              {cargando ? (
                <FilasEsqueleto columnas={5} />
              ) : misReportes.length === 0 ? (
                <FilaVacia columnas={5} titulo="Todavía no has registrado ninguna actividad." />
              ) : (
                misReportes
                  .slice(
                    (paginaReportes - 1) * POR_PAGINA_REPORTES,
                    paginaReportes * POR_PAGINA_REPORTES,
                  )
                  .map((reporte) => (
                    <tr key={reporte.id} className="hover:bg-primary-50">
                      <td className="whitespace-nowrap px-4 py-3 text-primary-700">
                        {reporte.fecha_trabajo}
                      </td>
                      <td className="px-4 py-3 text-primary-700">
                        {ETIQUETA_ACTIVIDAD[reporte.tipo_actividad]}
                        <span className="block max-w-xs truncate text-xs text-primary-500">
                          {reporte.descripcion}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-primary-700">
                        {formatearTiempo(reporte.tiempo_minutos)}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-primary-700">
                        <span className="block truncate" title={
                          reporte.materiales_texto ??
                          reporte.materiales
                            .map((m) => `${m.nombre_articulo} (${m.cantidad})`)
                            .join(', ')
                        }>
                          {reporte.materiales_texto ??
                            (reporte.materiales.length === 0
                              ? '—'
                              : reporte.materiales
                                  .map((m) => `${m.nombre_articulo} (${m.cantidad})`)
                                  .join(', '))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => setDetalle(reporte)}
                        >
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  ))
              )}
            </Table>
          </div>
        </div>
      )}

      {/* Detalle de un reporte del historial. */}
      {detalle && (
        <Modal size="xl" onCerrar={() => setDetalle(null)}>
          <ModalTitulo>Detalle del reporte</ModalTitulo>
          <div className="mt-4">
            <DetalleReporteFontanero reporte={detalle} />
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="primary" type="button" onClick={() => setDetalle(null)}>
              Cerrar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ReporteActividad