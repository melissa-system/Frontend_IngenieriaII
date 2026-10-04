import { ordenar, siguienteOrden, type OrdenTabla } from '../../lib/tabla'
import Paginador from '../../components/ui/Paginador'
import Alerta from '../../components/ui/Alerta'
import { FilaVacia } from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { FilasEsqueleto } from '../../components/ui/Cargando'
import { Notificar } from '../../components/ui/ToastProvider'
import { useState, useEffect, useCallback } from 'react'
import {
  erroresPorCampo,
  tieneErroresDeCampo,
} from '../../components/Services/erroresApi'
import {
  correo,
  formatearTelefono,
  hayErrores,
  maximo,
  requerido,
  telefono,
  validarCampos,
  type ErroresFormulario,
} from '../../lib/validaciones'
import CampoError, { Obligatorio, bordeCampo, enfocarPrimerError } from '../../components/common/CampoError'

type CampoProveedor = 'nombre' | 'contacto' | 'telefono' | 'correo' | 'direccion'
import {
  obtenerProveedores,
  crearProveedor,
  actualizarProveedor,
  type Proveedor,
} from '../../components/Services/inventario.service'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import PageHeader from '../../components/ui/PageHeader'

function getEstadoColor(estado: string) {
  if (estado === 'Activo') return 'bg-exito-100 text-exito-700'
  return 'bg-error-100 text-error-700'
}

function getTipoBadge(tipo: string) {
  if (tipo === 'Físico') return 'bg-info-100 text-info-700'
  return 'bg-acento-100 text-acento-700'
}

function formatearFecha(fecha?: string) {
  if (!fecha) return '—'
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
}

// Paginación client-side de la tabla de proveedores
const PROVEEDORES_POR_PAGINA = 10

// Normaliza texto para buscar sin depender de mayúsculas, acentos, guiones
// ni espacios.
function normalizarBusqueda(t: string) {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// Interruptor para activar/desactivar un proveedor. No guarda nada por sí
// mismo: solo dispara la confirmación que luego llama al backend.
function EstadoSwitch({
  estado,
  disabled,
  onChange,
}: {
  estado: string
  disabled?: boolean
  onChange: () => void
}) {
  const activo = estado === 'Activo'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={`Cambiar estado a ${activo ? 'Inactivo' : 'Activo'}`}
      title={`Cambiar estado a ${activo ? 'Inactivo' : 'Activo'}`}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 pointer-coarse:before:absolute pointer-coarse:before:-inset-3 pointer-coarse:before:content-[''] flex-none items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        activo ? 'bg-exito-500' : 'bg-primary-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          activo ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}

function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensajeExito, setMensajeExito] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')

  // Búsqueda y paginación
  const [search, setSearch] = useState('')
  const [pagina, setPagina] = useState(1)

  // Modales
  const [modalNuevoProveedor, setModalNuevoProveedor] = useState(false)
  const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | null>(null)
  const [proveedorAVer, setProveedorAVer] = useState<Proveedor | null>(null)

  // Cambio de estado (Activo / Inactivo)
  const [cambioEstado, setCambioEstado] = useState<{
    proveedor: Proveedor
    nuevo: Proveedor['estado']
  } | null>(null)
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState<number | null>(null)
  const [errorCambioEstado, setErrorCambioEstado] = useState<string | null>(null)

  // Formulario
  const [formProveedor, setFormProveedor] = useState({
    nombre: '',
    tipo: 'Jurídico' as 'Físico' | 'Jurídico',
    contacto: '',
    telefono: '',
    correo: '',
    direccion: '',
  })
  const [errorFormProveedor, setErrorFormProveedor] = useState('')
  const [errores, setErrores] = useState<ErroresFormulario<CampoProveedor>>({})

  // Checklist común (PBI 511): nombre obligatorio; teléfono y correo
  // opcionales, pero con formato válido si se escriben; longitudes máximas.
  function validarProveedor(): boolean {
    const nuevos = validarCampos<CampoProveedor>(
      {
        nombre: [requerido('El nombre del proveedor'), maximo('El nombre', 200)],
        contacto: [maximo('El contacto', 150)],
        telefono: [telefono()],
        correo: [correo(), maximo('El correo', 150)],
        direccion: [maximo('La dirección', 255)],
      },
      formProveedor,
    )
    setErrores(nuevos)
    enfocarPrimerError()
    return !hayErrores(nuevos)
  }

  function cambiarCampo(campo: CampoProveedor, valor: string) {
    setFormProveedor((p) => ({ ...p, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  // ------------------------------------------------------------------
  // Carga de Datos
  // ------------------------------------------------------------------
  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setErrorGeneral('')
    try {
      const data = await obtenerProveedores()
      setProveedores(data)
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : 'Error al cargar los proveedores')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargarDatos()
  }, [cargarDatos])

  function notificarExito(mensaje: string) {
    setMensajeExito(mensaje)
    setTimeout(() => setMensajeExito(''), 4000)
  }

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  function resetFormProveedor() {
    setFormProveedor({
      nombre: '',
      tipo: 'Jurídico',
      contacto: '',
      telefono: '',
      correo: '',
      direccion: '',
    })
    setErrorFormProveedor('')
    setErrores({})
  }

  async function handleCrearProveedor(e: React.FormEvent) {
    e.preventDefault()
    setErrorFormProveedor('')
    if (!validarProveedor()) return

    try {
      await crearProveedor(formProveedor)
      setModalNuevoProveedor(false)
      resetFormProveedor()
      notificarExito('Proveedor registrado exitosamente.')
      void cargarDatos()
    } catch (err) {
      setErrores(erroresPorCampo<CampoProveedor>(err))
      enfocarPrimerError()
      setErrorFormProveedor(
        tieneErroresDeCampo(err)
          ? ''
          : err instanceof Error ? err.message : 'Error al registrar el proveedor',
      )
    }
  }

  async function handleEditarProveedor(e: React.FormEvent) {
    e.preventDefault()
    if (!proveedorAEditar) return
    setErrorFormProveedor('')
    if (!validarProveedor()) return

    try {
      await actualizarProveedor(proveedorAEditar.id, formProveedor)
      setProveedorAEditar(null)
      notificarExito('Proveedor actualizado exitosamente.')
      void cargarDatos()
    } catch (err) {
      setErrores(erroresPorCampo<CampoProveedor>(err))
      enfocarPrimerError()
      setErrorFormProveedor(
        tieneErroresDeCampo(err)
          ? ''
          : err instanceof Error ? err.message : 'Error al actualizar el proveedor',
      )
    }
  }

  async function confirmarCambioEstado() {
    if (!cambioEstado) return
    const { proveedor, nuevo } = cambioEstado
    setCambiandoEstadoId(proveedor.id)
    setErrorCambioEstado(null)
    try {
      await actualizarProveedor(proveedor.id, { estado: nuevo })
      setCambioEstado(null)
      notificarExito(
        `Proveedor "${proveedor.nombre}" ${
          nuevo === 'Activo' ? 'activado' : 'inhabilitado'
        } exitosamente.`,
      )
      void cargarDatos()
    } catch (err) {
      setErrorCambioEstado(
        err instanceof Error ? err.message : 'Error al cambiar el estado del proveedor',
      )
    } finally {
      setCambiandoEstadoId(null)
    }
  }

  const [orden, setOrden] = useState<OrdenTabla | null>(null)

  // Búsqueda y paginación client-side: si la lista encoge, paginaActual se
  // autocorrige y nunca queda apuntando a una página vacía.
  const q = normalizarBusqueda(search)
  const filtrados =
    q === ''
      ? proveedores
      : proveedores.filter(
          (p) =>
            normalizarBusqueda(p.nombre).includes(q) ||
            normalizarBusqueda(p.contacto ?? '').includes(q) ||
            normalizarBusqueda(p.telefono ?? '').includes(q) ||
            normalizarBusqueda(p.correo ?? '').includes(q) ||
            normalizarBusqueda(p.direccion ?? '').includes(q),
        )

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtrados.length / PROVEEDORES_POR_PAGINA),
  )
  const paginaActual = Math.min(pagina, totalPaginas)
  const primeraFila = (paginaActual - 1) * PROVEEDORES_POR_PAGINA
  const ordenados = ordenar(filtrados, orden, {
    nombre: (p) => p.nombre,
    tipo: (p) => p.tipo,
    estado: (p) => p.estado,
  })
  const filasVisibles = ordenados.slice(
    primeraFila,
    primeraFila + PROVEEDORES_POR_PAGINA,
  )

  // Buscar siempre regresa a la primera página; navegar páginas NO toca el
  // término de búsqueda, así que el filtro se mantiene entre páginas.
  function manejarBusqueda(valor: string) {
    setSearch(valor)
    setPagina(1)
  }

  // Clases compartidas
  const inputConError = (error?: string) =>
    `mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${bordeCampo(error)}`
  const selectCls =
    'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none bg-white'
  const labelCls = 'block text-sm font-medium text-primary-700'

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <PageHeader
        titulo="Proveedores"
        descripcion="Registro y administración de los proveedores de materiales de la ASADA"
        accion={
          <>
<Button
          variant="primary"
          type="button"
          onClick={() => {
            resetFormProveedor()
            setModalNuevoProveedor(true)
          }}
          className="self-start shadow">
          + Nuevo Proveedor
        </Button>
          </>
        }
      />

      {/* Alertas */}
      <Notificar mensaje={mensajeExito} />
      {errorGeneral && <ErrorState mensaje={errorGeneral} onReintentar={cargarDatos} />}

      {/* Búsqueda */}
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
          placeholder="Buscar por nombre, contacto, teléfono, correo o dirección..."
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

      {/* Tabla de Proveedores */}
      <Table orden={orden} onOrdenar={(c) => { setOrden(siguienteOrden(orden, c)); setPagina(1) }} cabecera={[{ etiqueta: 'Proveedor', clave: 'nombre' }, { etiqueta: 'Tipo', clave: 'tipo' }, 'Contacto', 'Teléfono', 'Correo', { etiqueta: 'Estado', clave: 'estado' }, 'Acciones']} pie={<>{!cargando && filtrados.length > 0 && (
          <Paginador total={filtrados.length} pagina={paginaActual} porPagina={PROVEEDORES_POR_PAGINA} onCambiar={setPagina} etiqueta="proveedores" filtro={search} />
        )}</>}>
            {cargando ? (
              <FilasEsqueleto columnas={7} />
            ) : filtrados.length === 0 ? (
              <FilaVacia columnas={7} titulo={search
                    ? `No encontramos proveedores para "${search}"`
                    : 'No hay proveedores registrados.'} />
            ) : (
              filasVisibles.map((p) => (
                <tr key={p.id} className="hover:bg-primary-50/50">
                  <td className="px-4 py-3 font-medium text-primary-900">{p.nombre}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                      {p.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-primary-600">{p.contacto || '—'}</td>
                  <td className="px-4 py-3 font-mono text-primary-600">{p.telefono || '—'}</td>
                  <td className="px-4 py-3 text-primary-600">{p.correo || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <EstadoSwitch
                        estado={p.estado}
                        disabled={cambiandoEstadoId === p.id}
                        onChange={() => {
                          setErrorCambioEstado(null)
                          setCambioEstado({
                            proveedor: p,
                            nuevo: p.estado === 'Activo' ? 'Inactivo' : 'Activo',
                          })
                        }}
                      />
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(p.estado)}`}
                      >
                        {p.estado}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProveedorAEditar(p)
                          setFormProveedor({
                            nombre: p.nombre,
                            tipo: p.tipo,
                            contacto: p.contacto || '',
                            telefono: p.telefono || '',
                            correo: p.correo || '',
                            direccion: p.direccion || '',
                          })
                          setErrorFormProveedor('')
                        }}
                        className="text-sm font-medium text-primary-500 hover:text-primary-700 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setProveedorAVer(p)}
                        className="text-sm font-medium text-primary-500 hover:text-primary-700 hover:underline"
                      >
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </Table>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL REGISTRAR O EDITAR PROVEEDOR */}
      {/* ------------------------------------------------------------------ */}
      {(modalNuevoProveedor || proveedorAEditar) && (
        <Modal size="2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-900">
                {proveedorAEditar ? `Editar Proveedor: ${proveedorAEditar.nombre}` : 'Nuevo Proveedor'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setModalNuevoProveedor(false)
                  setProveedorAEditar(null)
                  resetFormProveedor()
                }}
                className="rounded-full p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
              >
                ✕
              </button>
            </div>

            {errorFormProveedor && (
              <Alerta tipo="error" className="mb-4">
                {errorFormProveedor}
              </Alerta>
            )}

            <form onSubmit={proveedorAEditar ? handleEditarProveedor : handleCrearProveedor} noValidate className="space-y-4">
              <div>
                <label className={labelCls}>
                  Nombre del proveedor
                  <Obligatorio />
                </label>
                <input
                  type="text"
                  value={formProveedor.nombre}
                  maxLength={200}
                  onChange={(e) => cambiarCampo('nombre', e.target.value)}
                  className={inputConError(errores.nombre)}
                />
                <CampoError mensaje={errores.nombre} />
              </div>

              <div>
                <label className={labelCls}>Tipo de Proveedor</label>
                <select
                  value={formProveedor.tipo}
                  onChange={(e) =>
                    setFormProveedor((p) => ({
                      ...p,
                      tipo: e.target.value as 'Físico' | 'Jurídico',
                    }))
                  }
                  className={selectCls}
                >
                  <option value="Jurídico">Jurídico</option>
                  <option value="Físico">Físico</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Persona de contacto</label>
                <input
                  type="text"
                  value={formProveedor.contacto}
                  maxLength={150}
                  onChange={(e) => cambiarCampo('contacto', e.target.value)}
                  className={inputConError(errores.contacto)}
                />
                <CampoError mensaje={errores.contacto} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Teléfono</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="8888-8888"
                    value={formProveedor.telefono}
                    onChange={(e) => cambiarCampo('telefono', formatearTelefono(e.target.value))}
                    className={inputConError(errores.telefono)}
                  />
                  <CampoError mensaje={errores.telefono} />
                </div>
                <div>
                  <label className={labelCls}>Correo electrónico</label>
                  <input
                    type="email"
                    value={formProveedor.correo}
                    maxLength={150}
                    onChange={(e) => cambiarCampo('correo', e.target.value)}
                    className={inputConError(errores.correo)}
                  />
                  <CampoError mensaje={errores.correo} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Dirección</label>
                <input
                  type="text"
                  value={formProveedor.direccion}
                  maxLength={255}
                  onChange={(e) => cambiarCampo('direccion', e.target.value)}
                  className={inputConError(errores.direccion)}
                />
                <CampoError mensaje={errores.direccion} />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-primary-100 pt-4">
                <Button
                  variant="primary"
                  type="submit"
                  className="shadow">
                  {proveedorAEditar ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setModalNuevoProveedor(false)
                    setProveedorAEditar(null)
                    resetFormProveedor()
                  }}>
                  Cancelar
                </Button>
              </div>
            </form>
</Modal>
      )}

      {/* MODAL DETALLE DEL PROVEEDOR */}
      {proveedorAVer && (
        <Modal size="lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-900">Detalle de Proveedor</h2>
              <button
                type="button"
                onClick={() => setProveedorAVer(null)}
                className="rounded-full p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 break-words">
                <span className="font-medium text-primary-700">Proveedor:</span>
                <span className="text-primary-900">{proveedorAVer.nombre}</span>
                <span className="font-medium text-primary-700">Tipo:</span>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getTipoBadge(proveedorAVer.tipo)}`}
                >
                  {proveedorAVer.tipo}
                </span>
                <span className="font-medium text-primary-700">Persona de contacto:</span>
                <span className="text-primary-900">{proveedorAVer.contacto || '—'}</span>
                <span className="font-medium text-primary-700">Teléfono:</span>
                <span className="font-mono text-primary-900">{proveedorAVer.telefono || '—'}</span>
                <span className="font-medium text-primary-700">Correo:</span>
                <span className="text-primary-900">{proveedorAVer.correo || '—'}</span>
                <span className="font-medium text-primary-700">Dirección:</span>
                <span className="text-primary-900">{proveedorAVer.direccion || '—'}</span>
                <span className="font-medium text-primary-700">Estado:</span>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(proveedorAVer.estado)}`}
                >
                  {proveedorAVer.estado}
                </span>
                <span className="font-medium text-primary-700">Registro:</span>
                <span className="text-primary-900">{formatearFecha(proveedorAVer.fecha_creacion)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="primary"
                type="button"
                onClick={() => setProveedorAVer(null)}>
                Cerrar
              </Button>
            </div>
</Modal>
      )}

      {/* Confirmación de cambio de estado (Activo / Inactivo) */}
      {cambioEstado && (
        <Modal size="md" layer={60} scroll={false}>
            <h2 className="text-lg font-semibold text-primary-900">
              Cambiar estado del proveedor
            </h2>
            <p className="mt-3 text-sm text-primary-600">
              ¿Seguro que deseas cambiar el estado de{' '}
              <span className="font-semibold text-primary-800">
                {cambioEstado.proveedor.nombre}
              </span>
              ?
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(cambioEstado.proveedor.estado)}`}
              >
                {cambioEstado.proveedor.estado}
              </span>
              <span aria-hidden="true" className="text-primary-400">→</span>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(cambioEstado.nuevo)}`}
              >
                {cambioEstado.nuevo}
              </span>
            </p>
            <p className="mt-3 text-xs text-primary-400">
              El proveedor puede reactivarse en cualquier momento desde la lista de
              proveedores.
            </p>
            {errorCambioEstado && (
              <Alerta tipo="error" className="mt-3">
                {errorCambioEstado}
              </Alerta>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="primary"
                type="button"
                onClick={confirmarCambioEstado}
                disabled={cambiandoEstadoId !== null}>
                {cambiandoEstadoId !== null ? 'Guardando...' : 'Sí, cambiar'}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setCambioEstado(null)}
                disabled={cambiandoEstadoId !== null}>
                Cancelar
              </Button>
            </div>
</Modal>
      )}
    </div>
  )
}

export default Proveedores