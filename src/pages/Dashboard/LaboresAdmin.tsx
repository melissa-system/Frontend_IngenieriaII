import { useEffect, useMemo, useState, type FormEvent } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Alerta from '../../components/ui/Alerta'
import Paginador from '../../components/ui/Paginador'
import Modal, { ModalTitulo } from '../../components/ui/Modal'
import { FilaVacia } from '../../components/ui/EmptyState'
import { FilasEsqueleto } from '../../components/ui/Cargando'
import { Notificar } from '../../components/ui/ToastProvider'
import {
  obtenerEmpleados,
  type Empleado,
} from '../../components/Services/empleados.service'
import {
  obtenerLabores,
  crearLabor,
  actualizarLabor,
  TIPOS_LABOR,
  ESTADOS_LABOR,
  type LaborBackend,
  type TipoLabor,
  type EstadoLabor,
} from '../../components/Services/labores.service'
import { ETIQUETA_ACTIVIDAD } from '../../components/Services/reportesFontanero.service'

const POR_PAGINA = 10

const ESTADO_COLOR: Record<string, string> = {
  Pendiente: 'bg-advertencia-100 text-advertencia-700',
  'En proceso': 'bg-info-100 text-info-700',
  'En revisión': 'bg-acento-100 text-acento-700',
  Finalizado: 'bg-exito-100 text-exito-700',
}

function normalizarBusqueda(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CR', {
    timeZone: 'America/Costa_Rica',
  })
}

// Modal de "Ver / gestionar" (mismo patrón que el de Reporte de Averías):
// muestra el detalle y permite asignar fontanero, cambiar estado y dejar
// observaciones.
function GestionLaborModal({
  labor,
  fontaneros,
  asignarFontanero,
  setAsignarFontanero,
  nuevoEstado,
  setNuevoEstado,
  observacion,
  setObservacion,
  onGuardar,
  onClose,
  procesando,
  errorGestion,
}: {
  labor: LaborBackend
  fontaneros: Empleado[]
  asignarFontanero: string
  setAsignarFontanero: (v: string) => void
  nuevoEstado: string
  setNuevoEstado: (v: string) => void
  observacion: string
  setObservacion: (v: string) => void
  onGuardar: () => void
  onClose: () => void
  procesando: boolean
  errorGestion: string | null
}) {
  const gestionable = labor.estado !== 'Finalizado'
  const fontaneroActual = labor.empleado?.nombre ?? null
  const tieneFontanero = Boolean(asignarFontanero || fontaneroActual)

  return (
    <Modal size="2xl" onCerrar={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ModalTitulo>{ETIQUETA_ACTIVIDAD[labor.tipo_actividad]}</ModalTitulo>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLOR[labor.estado] ?? 'bg-primary-100 text-primary-600'}`}
          >
            {labor.estado}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 break-words rounded-lg bg-primary-50 p-4 text-sm">
          <span className="font-medium text-primary-700">Código:</span>
          <span className="font-mono text-primary-900">{labor.codigo_labor}</span>
          <span className="font-medium text-primary-700">Tipo:</span>
          <span className="text-primary-900">
            {ETIQUETA_ACTIVIDAD[labor.tipo_actividad]}
          </span>
          <span className="font-medium text-primary-700">Descripción:</span>
          <span className="text-primary-900">{labor.descripcion}</span>
          <span className="font-medium text-primary-700">Fecha de creación:</span>
          <span className="text-primary-900">
            {formatearFecha(labor.fecha_creacion)}
          </span>
          <span className="font-medium text-primary-700">Fontanero:</span>
          <span className="text-primary-900">
            {fontaneroActual ?? (
              <span className="text-primary-400">Sin asignar</span>
            )}
          </span>
          <span className="font-medium text-primary-700">Origen:</span>
          <span className="text-primary-900">
            {labor.origen === 'solicitud' ? (
              <span className="inline-flex items-center gap-1.5">
                Solicitud aprobada
                {labor.datos_solicitud && (
                  <span className="rounded-full bg-acento-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-acento-700">
                    {labor.datos_solicitud.codigo_solicitud}
                  </span>
                )}
              </span>
            ) : (
              'Creación manual'
            )}
          </span>
        </div>

        {/* Datos con los que se generó la labor: abonado, dirección y NIS.
            Van como copia para que el fontanero no dependa del módulo de
            solicitudes. */}
        {labor.origen === 'solicitud' && labor.datos_solicitud && (
          <div className="rounded-xl border border-acento-200 bg-acento-50/40 p-4">
            <h3 className="mb-2 text-sm font-semibold text-primary-900">
              Datos de la solicitud
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 break-words text-sm sm:grid-cols-2">
              <span className="font-medium text-primary-700">Abonado:</span>
              <span className="text-primary-900">
                {labor.datos_solicitud.abonado.nombre} (
                {labor.datos_solicitud.abonado.numero_abonado})
              </span>
              <span className="font-medium text-primary-700">Cédula:</span>
              <span className="text-primary-900">
                {labor.datos_solicitud.abonado.cedula || '—'}
              </span>
              <span className="font-medium text-primary-700">Teléfono:</span>
              <span className="text-primary-900">
                {labor.datos_solicitud.abonado.telefono || '—'}
              </span>
              <span className="font-medium text-primary-700">Dirección:</span>
              <span className="text-primary-900">
                {labor.datos_solicitud.direccion || '—'}
              </span>
              <span className="font-medium text-primary-700">NIS:</span>
              <span className="text-primary-900">
                {labor.datos_solicitud.numero_nis ?? '—'}
              </span>
            </div>
          </div>
        )}

        {labor.devuelta_revision && labor.motivo_revision && (
          <Alerta tipo="advertencia">
            Devuelta por revisión: {labor.motivo_revision}
          </Alerta>
        )}

        {gestionable ? (
          <div className="rounded-xl border border-primary-100 p-4">
            <h3 className="mb-3 text-sm font-semibold text-primary-900">
              Gestión
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="g-fontanero"
                  className="block text-sm font-medium text-primary-700"
                >
                  Asignar fontanero
                </label>
                <select
                  id="g-fontanero"
                  value={asignarFontanero}
                  onChange={(e) => setAsignarFontanero(e.target.value)}
                  className="mt-1 w-full rounded-full border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Sin asignar</option>
                  {fontaneros.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="g-estado"
                  className="block text-sm font-medium text-primary-700"
                >
                  Cambiar estado
                </label>
                <select
                  id="g-estado"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  disabled={!tieneFontanero}
                  className="mt-1 w-full rounded-full border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Mantener: {labor.estado}</option>
                  {['Pendiente', 'En proceso', 'Finalizado']
                    .filter((e) => e !== labor.estado)
                    .map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                </select>
                {!tieneFontanero && (
                  <p className="mt-1 text-xs text-advertencia-700">
                    Asigna un fontanero antes de cambiar el estado.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="g-obs"
                  className="block text-sm font-medium text-primary-700"
                >
                  Observaciones
                </label>
                <textarea
                  id="g-obs"
                  rows={2}
                  maxLength={1000}
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Notas o instrucciones..."
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
                <p className="mt-1 text-right text-xs text-primary-400">
                  {observacion.length}/1000
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-primary-100 bg-primary-50 p-3 text-sm text-primary-500">
            Esta labor ya está finalizada; no admite más cambios.
          </p>
        )}
      </div>

      {errorGestion && (
        <Alerta tipo="error" className="mt-4">
          {errorGestion}
        </Alerta>
      )}

      <div className="mt-6 flex justify-end gap-3">
        {gestionable ? (
          <>
            <Button
              variant="primary"
              type="button"
              onClick={onGuardar}
              disabled={procesando}
            >
              {procesando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button variant="primary" type="button" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>
    </Modal>
  )
}

function LaboresAdmin() {
  const [labores, setLabores] = useState<LaborBackend[]>([])
  const [fontaneros, setFontaneros] = useState<Empleado[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [confirmacion, setConfirmacion] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | EstadoLabor>('Todos')
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | TipoLabor>('Todos')
  const [pagina, setPagina] = useState(1)

  // Modal de creación.
  const [modalCrear, setModalCrear] = useState(false)
  const [tipoActividad, setTipoActividad] = useState<TipoLabor>('reparacion')
  const [descripcion, setDescripcion] = useState('')
  const [empleadoId, setEmpleadoId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  // Modal de ver/gestionar.
  const [gestionModal, setGestionModal] = useState<LaborBackend | null>(null)
  const [asignarFontanero, setAsignarFontanero] = useState('')
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [observacion, setObservacion] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [errorGestion, setErrorGestion] = useState<string | null>(null)

  useEffect(() => {
    obtenerEmpleados()
      .then((lista) =>
        setFontaneros(lista.filter((e) => e.puesto === 'Fontanero')),
      )
      .catch(() => setFontaneros([]))
  }, [])

  const cargar = async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      setLabores(await obtenerLabores())
    } catch (err) {
      setErrorCarga(
        err instanceof Error ? err.message : 'No se pudieron cargar las labores.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  // Filtrado client-side: búsqueda por fontanero (y código/descripción) + tipo
  // y estado, igual que en la vista de Abonados/Averías.
  const filtered = useMemo(() => {
    let result =
      filtroEstado === 'Todos'
        ? [...labores]
        : labores.filter((l) => l.estado === filtroEstado)

    if (filtroTipo !== 'Todos') {
      result = result.filter((l) => l.tipo_actividad === filtroTipo)
    }

    if (search.trim()) {
      const q = normalizarBusqueda(search)
      result = result.filter((l) => {
        const campos = [
          l.empleado?.nombre ?? '',
          l.codigo_labor,
          l.descripcion,
          ETIQUETA_ACTIVIDAD[l.tipo_actividad],
        ]
        return campos.some((c) => normalizarBusqueda(c).includes(q))
      })
    }

    return result
  }, [labores, filtroEstado, filtroTipo, search])

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const primeraFila = (paginaActual - 1) * POR_PAGINA
  const filasVisibles = filtered.slice(primeraFila, primeraFila + POR_PAGINA)

  function manejarBusqueda(valor: string) {
    setSearch(valor)
    setPagina(1)
  }

  function abrirCrear() {
    setTipoActividad('reparacion')
    setDescripcion('')
    setEmpleadoId('')
    setErrorForm('')
    setModalCrear(true)
  }

  function cerrarCrear() {
    if (guardando) return
    setModalCrear(false)
  }

  async function handleCrear(e: FormEvent) {
    e.preventDefault()
    if (guardando) return
    if (descripcion.trim().length < 10) {
      setErrorForm('Describe la labor con al menos 10 caracteres.')
      return
    }
    setGuardando(true)
    setErrorForm('')
    try {
      await crearLabor({
        tipoActividad,
        descripcion: descripcion.trim(),
        empleadoId: empleadoId ? Number(empleadoId) : undefined,
      })
      setModalCrear(false)
      setConfirmacion('Labor creada correctamente.')
      setTimeout(() => setConfirmacion(null), 3000)
      await cargar()
    } catch (err) {
      setErrorForm(
        err instanceof Error ? err.message : 'No se pudo crear la labor.',
      )
    } finally {
      setGuardando(false)
    }
  }

  function abrirGestion(labor: LaborBackend) {
    setGestionModal(labor)
    setAsignarFontanero(labor.empleado ? String(labor.empleado.id) : '')
    setNuevoEstado('')
    setObservacion('')
    setErrorGestion(null)
  }

  function cerrarGestion() {
    setGestionModal(null)
    setAsignarFontanero('')
    setNuevoEstado('')
    setObservacion('')
    setErrorGestion(null)
  }

  async function handleGuardarGestion() {
    if (!gestionModal) return
    setProcesando(true)
    setErrorGestion(null)
    try {
      await actualizarLabor(gestionModal.id, {
        empleadoId: asignarFontanero ? Number(asignarFontanero) : undefined,
        estado: nuevoEstado ? (nuevoEstado as EstadoLabor) : undefined,
        observacion: observacion.trim() || undefined,
      })
      cerrarGestion()
      setConfirmacion('Labor actualizada correctamente.')
      setTimeout(() => setConfirmacion(null), 3000)
      await cargar()
    } catch (err) {
      setErrorGestion(
        err instanceof Error
          ? err.message
          : 'No se pudieron guardar los cambios. Inténtalo de nuevo.',
      )
    } finally {
      setProcesando(false)
    }
  }

  const selectCls =
    'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none'

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Otros mantenimientos"
        descripcion={
          cargando
            ? 'Cargando...'
            : `${labores.length} labores registradas`
        }
        accion={
          <Button
            variant="primary"
            type="button"
            onClick={abrirCrear}
            className="self-start"
          >
            + Nueva labor
          </Button>
        }
      />

      <Notificar mensaje={confirmacion} />

      {/* Búsqueda por fontanero + filtros por tipo y estado */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-96">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre del fontanero..."
            value={search}
            onChange={(e) => manejarBusqueda(e.target.value)}
            className="w-full rounded-full border border-primary-200 py-2.5 pl-10 pr-9 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => manejarBusqueda('')}
              title="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-primary-300 hover:bg-primary-100 hover:text-primary-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => {
            setFiltroTipo(e.target.value as 'Todos' | TipoLabor)
            setPagina(1)
          }}
          className="h-10 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
        >
          <option value="Todos">Todos los tipos</option>
          {TIPOS_LABOR.map((t) => (
            <option key={t} value={t}>
              {ETIQUETA_ACTIVIDAD[t]}
            </option>
          ))}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => {
            setFiltroEstado(e.target.value as 'Todos' | EstadoLabor)
            setPagina(1)
          }}
          className="h-10 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
        >
          <option value="Todos">Todos los estados</option>
          {ESTADOS_LABOR.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      {errorCarga && <Alerta tipo="error">{errorCarga}</Alerta>}

      <Table
        cabecera={['Código', 'Tipo', 'Descripción', 'Fontanero', 'Estado', 'Fecha', 'Acciones']}
        pie={
          <>
            {filtered.length > 0 && (
              <Paginador
                total={filtered.length}
                pagina={paginaActual}
                porPagina={POR_PAGINA}
                onCambiar={setPagina}
                etiqueta="labores"
                filtro={search}
                deshabilitado={cargando}
              />
            )}
          </>
        }
      >
        {cargando ? (
          <FilasEsqueleto columnas={7} />
        ) : filasVisibles.length === 0 ? (
          <FilaVacia
            columnas={7}
            titulo={
              search || filtroTipo !== 'Todos' || filtroEstado !== 'Todos'
                ? 'No hay labores que coincidan con el filtro.'
                : 'Todavía no se han creado labores adicionales.'
            }
          />
        ) : (
          filasVisibles.map((labor) => (
            <tr key={labor.id} className="hover:bg-primary-50/50">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-primary-500">
                <span className="flex items-center gap-2">
                  {labor.codigo_labor}
                  {labor.origen === 'solicitud' && (
                    <span
                      className="rounded-full bg-acento-100 px-1.5 py-0.5 text-[10px] font-semibold text-acento-700"
                      title="Generada al aprobar una solicitud"
                    >
                      Solicitud
                    </span>
                  )}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-primary-900">
                {ETIQUETA_ACTIVIDAD[labor.tipo_actividad]}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-primary-600" title={labor.descripcion}>
                {labor.descripcion}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-primary-700">
                {labor.empleado?.nombre ?? '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLOR[labor.estado] ?? 'bg-primary-100 text-primary-600'}`}
                >
                  {labor.estado}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-primary-500">
                {formatearFecha(labor.fecha_creacion)}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => abrirGestion(labor)}
                >
                  Ver / gestionar
                </Button>
              </td>
            </tr>
          ))
        )}
      </Table>

      {/* Crear labor */}
      {modalCrear && (
        <Modal size="lg" onCerrar={cerrarCrear}>
          <ModalTitulo>Nueva labor</ModalTitulo>
          <form onSubmit={handleCrear} noValidate className="mt-4 space-y-4">
            <div>
              <label htmlFor="l-tipo" className="block text-sm font-medium text-primary-900">
                Tipo de actividad
              </label>
              <select
                id="l-tipo"
                value={tipoActividad}
                onChange={(e) => setTipoActividad(e.target.value as TipoLabor)}
                className={selectCls}
              >
                {TIPOS_LABOR.map((t) => (
                  <option key={t} value={t}>
                    {ETIQUETA_ACTIVIDAD[t]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="l-desc" className="block text-sm font-medium text-primary-900">
                Descripción
              </label>
              <textarea
                id="l-desc"
                rows={3}
                value={descripcion}
                maxLength={2000}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Revisar y reparar la bomba del tanque de la escuela."
                className={selectCls}
              />
            </div>

            <div>
              <label htmlFor="l-fontanero" className="block text-sm font-medium text-primary-900">
                Fontanero asignado
              </label>
              <select
                id="l-fontanero"
                value={empleadoId}
                onChange={(e) => setEmpleadoId(e.target.value)}
                className={selectCls}
              >
                <option value="">Sin asignar</option>
                {fontaneros.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}
                  </option>
                ))}
              </select>
            </div>

            {errorForm && <Alerta tipo="error">{errorForm}</Alerta>}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="primary" type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Crear labor'}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={cerrarCrear}
                disabled={guardando}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Ver / gestionar */}
      {gestionModal && (
        <GestionLaborModal
          labor={gestionModal}
          fontaneros={fontaneros}
          asignarFontanero={asignarFontanero}
          setAsignarFontanero={setAsignarFontanero}
          nuevoEstado={nuevoEstado}
          setNuevoEstado={setNuevoEstado}
          observacion={observacion}
          setObservacion={setObservacion}
          onGuardar={handleGuardarGestion}
          onClose={cerrarGestion}
          procesando={procesando}
          errorGestion={errorGestion}
        />
      )}
    </div>
  )
}

export default LaboresAdmin
