import { useState, useMemo } from 'react'
import {
  MOCK_INVENTARIO, MOCK_PROVEEDORES,
  type InventarioItem, type MovimientoInventario,
  type Proveedor,
} from '../../lib/mockData'
import { useAuth } from '../../contexts/AuthContext'

const CATEGORIAS = ['Material', 'Herramienta', 'Medidor']
const UBICACIONES = ['Bodega A', 'Bodega B', 'Taller']

const CATEGORIA_COLORS: Record<string, string> = {
  Material: 'bg-blue-100 text-blue-700',
  Herramienta: 'bg-orange-100 text-orange-700',
  Medidor: 'bg-purple-100 text-purple-700',
}

function Inventario() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'inventario' | 'proveedores'>('inventario')

  const [items, setItems] = useState<InventarioItem[]>(MOCK_INVENTARIO)
  const [proveedores, setProveedores] = useState<Proveedor[]>(MOCK_PROVEEDORES)

  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Todas')

  const [addModal, setAddModal] = useState(false)
  const [editItem, setEditItem] = useState<InventarioItem | null>(null)

  const [provAddModal, setProvAddModal] = useState(false)
  const [editProv, setEditProv] = useState<Proveedor | null>(null)

  const [newItemForm, setNewItemForm] = useState({
    nombre: '', categoria: 'Material', proveedor: '',
    tipoProveedor: 'Físico' as 'Físico' | 'Jurídico',
    stock: 0, stockMinimo: 0, ubicacion: 'Bodega A',
  })

  const [newProvForm, setNewProvForm] = useState({
    nombre: '', tipo: 'Jurídico' as 'Físico' | 'Jurídico',
    contacto: '', telefono: '', correo: '', direccion: '', estado: 'Activo' as 'Activo' | 'Inactivo',
  })

  const filteredItems = useMemo(() => {
    let result = [...items]
    if (catFilter !== 'Todas') result = result.filter((i) => i.categoria === catFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) =>
          i.nombre.toLowerCase().includes(q) ||
          i.categoria.toLowerCase().includes(q) ||
          i.proveedor.toLowerCase().includes(q),
      )
    }
    return result
  }, [items, catFilter, search])

  const filteredProv = useMemo(() => {
    if (!search.trim()) return proveedores
    const q = search.toLowerCase()
    return proveedores.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.contacto.toLowerCase().includes(q) ||
        p.telefono.includes(q),
    )
  }, [proveedores, search])

  const stockCritico = useMemo(
    () => items.filter((i) => i.stock < i.stockMinimo * 0.5),
    [items],
  )
  const stockBajo = useMemo(
    () => items.filter((i) => i.stock <= i.stockMinimo && i.stock >= i.stockMinimo * 0.5),
    [items],
  )

  function resetNewItemForm() {
    setNewItemForm({ nombre: '', categoria: 'Material', proveedor: '', tipoProveedor: 'Físico', stock: 0, stockMinimo: 0, ubicacion: 'Bodega A' })
  }

  function handleAddItem() {
    const nuevo: InventarioItem = {
      id: String(Date.now()),
      nombre: newItemForm.nombre,
      categoria: newItemForm.categoria,
      proveedor: newItemForm.proveedor,
      tipoProveedor: newItemForm.tipoProveedor,
      stock: newItemForm.stock,
      stockMinimo: newItemForm.stockMinimo,
      ubicacion: newItemForm.ubicacion,
      historial: [
        {
          fecha: new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }),
          tipo: 'entrada',
          cantidad: newItemForm.stock,
          stockAnterior: 0,
          stockNuevo: newItemForm.stock,
          realizadoPor: user?.nombre ?? 'Sistema',
          observacion: 'Item agregado al inventario',
        },
      ],
    }
    setItems((prev) => [nuevo, ...prev])
    setAddModal(false)
    resetNewItemForm()
  }

  function handleEditItem(
    id: string,
    data: {
      nombre: string; categoria: string; proveedor: string
      tipoProveedor: 'Físico' | 'Jurídico'
      stock: number; stockMinimo: number; ubicacion: string
    },
  ) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it
        const diff = data.stock - it.stock
        if (diff !== 0) {
          const mov: MovimientoInventario = {
            fecha: new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }),
            tipo: diff > 0 ? 'entrada' : 'salida',
            cantidad: Math.abs(diff),
            stockAnterior: it.stock,
            stockNuevo: data.stock,
            realizadoPor: user?.nombre ?? 'Sistema',
            observacion: diff > 0 ? 'Ajuste por edición (incremento)' : 'Ajuste por edición (decremento)',
          }
          return { ...it, ...data, historial: [...it.historial, mov] }
        }
        return { ...it, ...data }
      }),
    )
    setEditItem(null)
  }

  function resetNewProvForm() {
    setNewProvForm({ nombre: '', tipo: 'Jurídico', contacto: '', telefono: '', correo: '', direccion: '', estado: 'Activo' })
  }

  function handleAddProveedor() {
    const nuevo: Proveedor = { id: String(Date.now()), ...newProvForm }
    setProveedores((prev) => [nuevo, ...prev])
    setProvAddModal(false)
    resetNewProvForm()
  }

  function handleEditProveedor(id: string, data: Omit<Proveedor, 'id'>) {
    setProveedores((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
    setEditProv(null)
  }

  function handleDeleteProveedor(id: string) {
    setProveedores((prev) => prev.filter((p) => p.id !== id))
  }

  const inputCls = 'mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none'
  const labelCls = 'block text-sm font-medium text-primary-700'
  const modalBgCls = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40'
  const modalCls = 'max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl'

  function AddItemModal() {
    if (!addModal) return null
    return (
      <div className={modalBgCls}>
        <div className={modalCls}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">Agregar Item</h2>
            <button type="button" onClick={() => { setAddModal(false); resetNewItemForm() }}
              className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nombre del item</label>
              <input type="text" value={newItemForm.nombre} onChange={(e) => setNewItemForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} placeholder="Nombre del item" />
            </div>
            <div>
              <label className={labelCls}>Categoría</label>
              <select value={newItemForm.categoria} onChange={(e) => setNewItemForm((p) => ({ ...p, categoria: e.target.value }))} className={inputCls}>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ubicación</label>
              <select value={newItemForm.ubicacion} onChange={(e) => setNewItemForm((p) => ({ ...p, ubicacion: e.target.value }))} className={inputCls}>
                {UBICACIONES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Proveedor</label>
              <input type="text" value={newItemForm.proveedor} onChange={(e) => setNewItemForm((p) => ({ ...p, proveedor: e.target.value }))} className={inputCls} placeholder="Nombre del proveedor" list="prov-list" />
              <datalist id="prov-list">
                {proveedores.map((p) => <option key={p.id} value={p.nombre} />)}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Tipo de proveedor</label>
              <select value={newItemForm.tipoProveedor} onChange={(e) => setNewItemForm((p) => ({ ...p, tipoProveedor: e.target.value as 'Físico' | 'Jurídico' }))} className={inputCls}>
                <option value="Físico">Físico</option>
                <option value="Jurídico">Jurídico</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Stock inicial</label>
              <input type="number" min={0} value={newItemForm.stock} onChange={(e) => setNewItemForm((p) => ({ ...p, stock: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Stock mínimo</label>
              <input type="number" min={0} value={newItemForm.stockMinimo} onChange={(e) => setNewItemForm((p) => ({ ...p, stockMinimo: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => { setAddModal(false); resetNewItemForm() }}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">Cancelar</button>
            <button type="button" onClick={handleAddItem} disabled={!newItemForm.nombre || !newItemForm.proveedor}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50">Agregar item</button>
          </div>
        </div>
      </div>
    )
  }

  function EditItemModal() {
    if (!editItem) return null
    const [form, setForm] = useState({ ...editItem })
    return (
      <div className={modalBgCls}>
        <div className={modalCls}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">Editar: {editItem.nombre}</h2>
            <button type="button" onClick={() => setEditItem(null)}
              className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nombre</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Categoría</label>
              <select value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))} className={inputCls}>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ubicación</label>
              <select value={form.ubicacion} onChange={(e) => setForm((p) => ({ ...p, ubicacion: e.target.value }))} className={inputCls}>
                {UBICACIONES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Proveedor</label>
              <input type="text" value={form.proveedor} onChange={(e) => setForm((p) => ({ ...p, proveedor: e.target.value }))} className={inputCls} list="edit-prov-list" />
              <datalist id="edit-prov-list">
                {proveedores.map((p) => <option key={p.id} value={p.nombre} />)}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Tipo de proveedor</label>
              <select value={form.tipoProveedor} onChange={(e) => setForm((p) => ({ ...p, tipoProveedor: e.target.value as 'Físico' | 'Jurídico' }))} className={inputCls}>
                <option value="Físico">Físico</option>
                <option value="Jurídico">Jurídico</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Stock actual</label>
              <input type="number" min={0} value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Stock mínimo</label>
              <input type="number" min={0} value={form.stockMinimo} onChange={(e) => setForm((p) => ({ ...p, stockMinimo: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>

          <div className="mt-5 border-t border-primary-100 pt-4">
            <h3 className="mb-3 text-base font-semibold text-primary-900">Historial de Movimientos</h3>
            {form.historial.length === 0 ? (
              <p className="text-sm text-primary-400">Sin movimientos registrados.</p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {[...form.historial].reverse().map((m, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-primary-100 bg-primary-50/50 p-3 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold
                      ${m.tipo === 'entrada' ? 'bg-green-100 text-green-700' : ''}
                      ${m.tipo === 'salida' ? 'bg-red-100 text-red-700' : ''}
                      ${m.tipo === 'ajuste' ? 'bg-yellow-100 text-yellow-700' : ''}
                    `}>
                      {m.tipo === 'entrada' ? '+E' : m.tipo === 'salida' ? '-S' : 'ajuste'}
                    </span>
                    <div className="flex-1">
                      <p className="text-primary-700">{m.observacion}</p>
                      <p className="text-xs text-primary-400">{m.cantidad} uds ({m.stockAnterior} \u2192 {m.stockNuevo}) &middot; {m.fecha} &middot; {m.realizadoPor}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setEditItem(null)}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">Cancelar</button>
            <button type="button" onClick={() => handleEditItem(editItem.id, form)}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">Guardar cambios</button>
          </div>
        </div>
      </div>
    )
  }

  function AddProveedorModal() {
    if (!provAddModal) return null
    return (
      <div className={modalBgCls}>
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">Nuevo Proveedor</h2>
            <button type="button" onClick={() => { setProvAddModal(false); resetNewProvForm() }}
              className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Nombre</label>
              <input type="text" value={newProvForm.nombre} onChange={(e) => setNewProvForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tipo</label>
                <select value={newProvForm.tipo} onChange={(e) => setNewProvForm((p) => ({ ...p, tipo: e.target.value as 'Físico' | 'Jurídico' }))} className={inputCls}>
                  <option value="Físico">Físico</option>
                  <option value="Jurídico">Jurídico</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={newProvForm.estado} onChange={(e) => setNewProvForm((p) => ({ ...p, estado: e.target.value as 'Activo' | 'Inactivo' }))} className={inputCls}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Contacto</label>
              <input type="text" value={newProvForm.contacto} onChange={(e) => setNewProvForm((p) => ({ ...p, contacto: e.target.value }))} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Teléfono</label>
                <input type="text" value={newProvForm.telefono} onChange={(e) => setNewProvForm((p) => ({ ...p, telefono: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Correo</label>
                <input type="email" value={newProvForm.correo} onChange={(e) => setNewProvForm((p) => ({ ...p, correo: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Dirección</label>
              <input type="text" value={newProvForm.direccion} onChange={(e) => setNewProvForm((p) => ({ ...p, direccion: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => { setProvAddModal(false); resetNewProvForm() }}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">Cancelar</button>
            <button type="button" onClick={handleAddProveedor} disabled={!newProvForm.nombre}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50">Agregar proveedor</button>
          </div>
        </div>
      </div>
    )
  }

  function EditProveedorModal() {
    if (!editProv) return null
    const [form, setForm] = useState({ ...editProv })
    return (
      <div className={modalBgCls}>
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">Editar Proveedor</h2>
            <button type="button" onClick={() => setEditProv(null)}
              className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Nombre</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tipo</label>
                <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as 'Físico' | 'Jurídico' }))} className={inputCls}>
                  <option value="Físico">Físico</option>
                  <option value="Jurídico">Jurídico</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as 'Activo' | 'Inactivo' }))} className={inputCls}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Contacto</label>
              <input type="text" value={form.contacto} onChange={(e) => setForm((p) => ({ ...p, contacto: e.target.value }))} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Teléfono</label>
                <input type="text" value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Correo</label>
                <input type="email" value={form.correo} onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Dirección</label>
              <input type="text" value={form.direccion} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setEditProv(null)}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">Cancelar</button>
            <button type="button" onClick={() => handleEditProveedor(editProv.id, form)}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">Guardar cambios</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">
            Inventario
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            {items.length} items registrados &middot; {stockBajo.length + stockCritico.length} con stock bajo
          </p>
        </div>

        {tab === 'inventario' ? (
          <button type="button" onClick={() => setAddModal(true)}
            className="self-start rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800">
            + Agregar item
          </button>
        ) : (
          <button type="button" onClick={() => setProvAddModal(true)}
            className="self-start rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800">
            + Nuevo proveedor
          </button>
        )}
      </div>

      <div className="flex gap-1 rounded-xl bg-primary-100 p-1">
        <button type="button" onClick={() => setTab('inventario')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors
            ${tab === 'inventario' ? 'bg-white text-primary-900 shadow-sm' : 'text-primary-600 hover:text-primary-800'}`}>
          Inventario
        </button>
        <button type="button" onClick={() => setTab('proveedores')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors
            ${tab === 'proveedores' ? 'bg-white text-primary-900 shadow-sm' : 'text-primary-600 hover:text-primary-800'}`}>
          Proveedores
        </button>
      </div>

      {tab === 'inventario' && (
        <>
          {stockCritico.length > 0 && (
            <div className="animate-pulse rounded-xl border-2 border-red-300 bg-red-50 p-4 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm font-bold text-red-800">
                  Stock crítico detectado
                </p>
              </div>
              <ul className="mt-2 space-y-1 pl-7">
                {stockCritico.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm font-medium text-red-700">
                    <span className="inline-flex h-2 w-2 rounded-full bg-red-500" />
                    {item.nombre} &mdash; Stock: {item.stock} (mín: {item.stockMinimo})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stockBajo.length > 0 && stockCritico.length === 0 && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
                <p className="text-sm font-semibold text-yellow-800">Alerta de stock bajo</p>
              </div>
              <ul className="mt-2 space-y-1 pl-7">
                {stockBajo.map((item) => (
                  <li key={item.id} className="text-sm text-yellow-700">
                    {item.nombre} &mdash; Stock: {item.stock} (m\u00edn: {item.stockMinimo})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" placeholder="Buscar por nombre, categoría o proveedor..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-primary-200 py-2.5 pl-9 pr-4 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
              className="rounded-lg border border-primary-200 px-3 py-2.5 text-sm text-primary-700 focus:border-primary-500 focus:outline-none">
              <option value="Todas">Todas las categorías</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-primary-100 text-sm">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Categoría</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Proveedor</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Stock</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Mínimo</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Ubicación</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-primary-400">
                      No se encontraron items.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const critico = item.stock < item.stockMinimo * 0.5
                    const bajo = item.stock <= item.stockMinimo && !critico
                    return (
                      <tr key={item.id}
                        className={`${critico ? 'bg-red-50 shadow-[inset_0_0_8px_rgba(239,68,68,0.15)]' : ''}
                          ${bajo ? 'bg-yellow-50/50' : ''}
                          hover:bg-primary-50/50`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {critico && (
                              <svg className="h-4 w-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className="font-medium text-primary-900">{item.nombre}</span>
                            {critico && (
                              <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                Stock crítico
                              </span>
                            )}
                            {bajo && !critico && (
                              <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                                Stock bajo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORIA_COLORS[item.categoria]}`}>
                            {item.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-primary-600">{item.proveedor}</td>
                        <td className={`px-4 py-3 font-mono font-medium ${critico ? 'text-red-600' : bajo ? 'text-yellow-600' : 'text-primary-700'}`}>
                          {item.stock}
                        </td>
                        <td className="px-4 py-3 text-primary-500">{item.stockMinimo}</td>
                        <td className="px-4 py-3 text-primary-500">{item.ubicacion}</td>
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => setEditItem(item)}
                            className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline">
                            Editar
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'proveedores' && (
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-primary-100 text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Contacto</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {filteredProv.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-primary-400">
                    No se encontraron proveedores.
                  </td>
                </tr>
              ) : (
                filteredProv.map((p) => (
                  <tr key={p.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-900">{p.nombre}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${p.tipo === 'Jurídico' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {p.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-primary-600">{p.contacto}</td>
                    <td className="px-4 py-3 font-mono text-primary-600">{p.telefono}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${p.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setEditProv(p)}
                          className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline">
                          Editar
                        </button>
                        <button type="button" onClick={() => handleDeleteProveedor(p.id)}
                          className="text-sm font-medium text-red-500 hover:text-red-700 hover:underline">
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
      )}

      <AddItemModal />
      <EditItemModal />
      <AddProveedorModal />
      <EditProveedorModal />
    </div>
  )
}

export default Inventario
