import { useState, useEffect, useCallback } from 'react'
import {
  obtenerProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  type Proveedor,
} from '../../components/Services/inventario.service'

function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensajeExito, setMensajeExito] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')

  // Modales
  const [modalNuevoProveedor, setModalNuevoProveedor] = useState(false)
  const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | null>(null)
  const [proveedorAEliminar, setProveedorAEliminar] = useState<Proveedor | null>(null)

  // Formulario
  const [formProveedor, setFormProveedor] = useState({
    nombre: '',
    tipo: 'Jurídico' as 'Físico' | 'Jurídico',
    contacto: '',
    telefono: '',
    correo: '',
    direccion: '',
    estado: 'Activo' as 'Activo' | 'Inactivo',
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
      estado: 'Activo',
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

  async function confirmarEliminarProveedor() {
    if (!proveedorAEliminar) return
    try {
      await eliminarProveedor(proveedorAEliminar.id)
      setProveedorAEliminar(null)
      notificarExito('Proveedor eliminado exitosamente.')
      void cargarDatos()
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : 'Error al eliminar el proveedor')
      setProveedorAEliminar(null)
    }
  }

  // Clases compartidas
  const inputCls =
    'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none'
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
              <th className="px-4 py-3 text-right font-medium text-primary-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-50">
            {cargando ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-primary-400">
                  Cargando proveedores...
                </td>
              </tr>
            ) : proveedores.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-primary-400">
                  No hay proveedores registrados.
                </td>
              </tr>
            ) : (
              proveedores.map((p) => (
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
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.estado === 'Activo'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
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
                            estado: p.estado,
                          })
                          setErrorFormProveedor('')
                        }}
                        className="text-xs font-medium text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setProveedorAEliminar(p)}
                        className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

              <div className="grid grid-cols-2 gap-4">
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
                  <label className={labelCls}>Estado</label>
                  <select
                    value={formProveedor.estado}
                    onChange={(e) =>
                      setFormProveedor((p) => ({
                        ...p,
                        estado: e.target.value as 'Activo' | 'Inactivo',
                      }))
                    }
                    className={selectCls}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
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
                <button
                  type="submit"
                  className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-primary-800"
                >
                  {proveedorAEditar ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR PROVEEDOR */}
      {proveedorAEliminar && (
        <div className={modalBgCls}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-red-900">¿Eliminar proveedor?</h3>
            <p className="mt-2 text-sm text-primary-600">
              ¿Está seguro de eliminar al proveedor{' '}
              <strong>{proveedorAEliminar.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProveedorAEliminar(null)}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminarProveedor}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Proveedores