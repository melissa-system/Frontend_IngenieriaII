import { useState, useEffect, useCallback } from 'react'
import {
  obtenerProveedores,
  crearProveedor,
  actualizarProveedor,
  type Proveedor,
} from '../../components/Services/inventario.service'

function getEstadoColor(estado: string) {
  if (estado === 'Activo') return 'bg-green-100 text-green-700'
  return 'bg-red-100 text-red-700'
}

function getTipoBadge(tipo: string) {
  if (tipo === 'Físico') return 'bg-blue-100 text-blue-700'
  return 'bg-purple-100 text-purple-700'
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
      className={`relative inline-flex h-5 w-9 flex-none items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        activo ? 'bg-green-500' : 'bg-gray-300'
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
  }

  async function handleCrearProveedor(e: React.FormEvent) {
    e.preventDefault()
    setErrorFormProveedor('')
    if (!formProveedor.nombre.trim()) {
      setErrorFormProveedor('El nombre del proveedor es obligatorio')
      return
    }

    try {
      await crearProveedor(formProveedor)
      setModalNuevoProveedor(false)
      resetFormProveedor()
      notificarExito('Proveedor registrado exitosamente.')
      void cargarDatos()
    } catch (err) {
      setErrorFormProveedor(err instanceof Error ? err.message : 'Error al registrar el proveedor')
    }
  }

  async function handleEditarProveedor(e: React.FormEvent) {
    e.preventDefault()
    if (!proveedorAEditar) return
    setErrorFormProveedor('')
    if (!formProveedor.nombre.trim()) {
      setErrorFormProveedor('El nombre del proveedor es obligatorio')
      return
    }

    try {
      await actualizarProveedor(proveedorAEditar.id, formProveedor)
      setProveedorAEditar(null)
      notificarExito('Proveedor actualizado exitosamente.')
      void cargarDatos()
    } catch (err) {
      setErrorFormProveedor(err instanceof Error ? err.message : 'Error al actualizar el proveedor')
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
  const filasVisibles = filtrados.slice(
    primeraFila,
    primeraFila + PROVEEDORES_POR_PAGINA,
  )
  const numerosPagina = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  // Buscar siempre regresa a la primera página; navegar páginas NO toca el
  // término de búsqueda, así que el filtro se mantiene entre páginas.
  function manejarBusqueda(valor: string) {
    setSearch(valor)
    setPagina(1)
  }

  // Clases compartidas
  const inputCls = 'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none'
  const selectCls =
    'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none bg-white'
  const labelCls = 'block text-sm font-medium text-primary-700'
  const modalBgCls = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
  const modalCls = 'max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl'

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">Proveedores</h1>
          <p className="mt-1 text-sm text-primary-500">
            Registro y administración de los proveedores de materiales de la ASADA
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetFormProveedor()
            setModalNuevoProveedor(true)
          }}
          className="self-start rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-primary-800"
        >
          + Nuevo Proveedor
        </button>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          ✓ {mensajeExito}
        </div>
      )}
      {errorGeneral && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          ✕ {errorGeneral}
        </div>
      )}

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
      <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-primary-100 text-sm">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Proveedor</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Contacto</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Teléfono</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Correo</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
              <th className="px-4 py-3 font-medium text-primary-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-50">
            {cargando ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-primary-400">
                  Cargando proveedores...
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-primary-400">
                  {search
                    ? `No encontramos proveedores para "${search}"`
                    : 'No hay proveedores registrados.'}
                </td>
              </tr>
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
          </tbody>
        </table>

        {!cargando && filtrados.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-primary-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-primary-500">
              Mostrando{' '}
              {`${primeraFila + 1}–${Math.min(primeraFila + PROVEEDORES_POR_PAGINA, filtrados.length)}`}{' '}
              de {filtrados.length} proveedores
              {search ? ` (filtro: "${search}")` : ''}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ‹ Anterior
              </button>
              {numerosPagina.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPagina(n)}
                  disabled={n === paginaActual}
                  aria-current={n === paginaActual ? 'page' : undefined}
                  className={`h-7 min-w-[28px] rounded-lg px-2 text-xs font-medium ${
                    n === paginaActual
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL REGISTRAR O EDITAR PROVEEDOR */}
      {/* ------------------------------------------------------------------ */}
      {(modalNuevoProveedor || proveedorAEditar) && (
        <div className={modalBgCls}>
          <div className={modalCls}>
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
                className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
              >
                ✕
              </button>
            </div>

            {errorFormProveedor && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
                {errorFormProveedor}
              </div>
            )}

            <form onSubmit={proveedorAEditar ? handleEditarProveedor : handleCrearProveedor} className="space-y-4">
              <div>
                <label className={labelCls}>Nombre del proveedor *</label>
                <input
                  type="text"
                  required
                  value={formProveedor.nombre}
                  onChange={(e) => setFormProveedor((p) => ({ ...p, nombre: e.target.value }))}
                  className={inputCls}
                />
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
                  onChange={(e) => setFormProveedor((p) => ({ ...p, contacto: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Teléfono</label>
                  <input
                    type="text"
                    value={formProveedor.telefono}
                    onChange={(e) => setFormProveedor((p) => ({ ...p, telefono: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Correo electrónico</label>
                  <input
                    type="email"
                    value={formProveedor.correo}
                    onChange={(e) => setFormProveedor((p) => ({ ...p, correo: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Dirección</label>
                <input
                  type="text"
                  value={formProveedor.direccion}
                  onChange={(e) => setFormProveedor((p) => ({ ...p, direccion: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-primary-100 pt-4">
                <button
                  type="submit"
                  className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-primary-800"
                >
                  {proveedorAEditar ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalNuevoProveedor(false)
                    setProveedorAEditar(null)
                    resetFormProveedor()
                  }}
                  className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DEL PROVEEDOR */}
      {proveedorAVer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-900">Detalle de Proveedor</h2>
              <button
                type="button"
                onClick={() => setProveedorAVer(null)}
                className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
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
              <button
                type="button"
                onClick={() => setProveedorAVer(null)}
                className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de cambio de estado (Activo / Inactivo) */}
      {cambioEstado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
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
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {errorCambioEstado}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={confirmarCambioEstado}
                disabled={cambiandoEstadoId !== null}
                className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cambiandoEstadoId !== null ? 'Guardando...' : 'Sí, cambiar'}
              </button>
              <button
                type="button"
                onClick={() => setCambioEstado(null)}
                disabled={cambiandoEstadoId !== null}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Proveedores