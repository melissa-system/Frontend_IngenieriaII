import { useState } from 'react'
import { MOCK_ABONADOS, type Abonado, type MedidorInfo } from '../../lib/mockData'

type ModalMode = 'create' | 'edit' | null

const emptyForm: Omit<Abonado, 'id'> = {
  cedula: '',
  nombre: '',
  tipo: 'Física',
  telefono: '',
  correo: '',
  direccion: '',
  beneficiario: '',
  medidor: { numero: '', diametro: '', ubicacion: '' },
  estado: 'Activo',
  fechaRegistro: new Date().toISOString().slice(0, 10),
}

function getEstadoColor(estado: string) {
  if (estado === 'Activo') return 'bg-green-100 text-green-700'
  return 'bg-red-100 text-red-700'
}

function getTipoBadge(tipo: string) {
  if (tipo === 'Física') return 'bg-blue-100 text-blue-700'
  return 'bg-purple-100 text-purple-700'
}

function Abonados() {
  const [abonados, setAbonados] = useState<Abonado[]>(MOCK_ABONADOS)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<Abonado | null>(null)
  const [form, setForm] = useState<Omit<Abonado, 'id'>>(emptyForm)
  const [viewDetail, setViewDetail] = useState<Abonado | null>(null)

  const filtered = abonados.filter(
    (a) =>
      a.nombre.toLowerCase().includes(search.toLowerCase()) ||
      a.cedula.includes(search) ||
      a.telefono.includes(search) ||
      a.direccion.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setForm(emptyForm)
    setSelected(null)
    setModal('create')
  }

  function openEdit(a: Abonado) {
    setSelected(a)
    setForm({
      cedula: a.cedula,
      nombre: a.nombre,
      tipo: a.tipo,
      telefono: a.telefono,
      correo: a.correo,
      direccion: a.direccion,
      beneficiario: a.beneficiario,
      medidor: { ...a.medidor },
      estado: a.estado,
      fechaRegistro: a.fechaRegistro,
    })
    setModal('edit')
  }

  function handleSave() {
    if (modal === 'create') {
      const nuevo: Abonado = {
        id: String(Date.now()),
        ...form,
      }
      setAbonados((prev) => [nuevo, ...prev])
    } else if (modal === 'edit' && selected) {
      setAbonados((prev) =>
        prev.map((a) => (a.id === selected.id ? { ...a, ...form } : a)),
      )
    }
    setModal(null)
    setSelected(null)
  }

  function updateField(field: string, value: string) {
    if (field.startsWith('medidor.')) {
      const key = field.split('.')[1] as keyof MedidorInfo
      setForm((prev) => ({
        ...prev,
        medidor: { ...prev.medidor, [key]: value },
      }))
    } else {
      setForm((prev) => ({ ...prev, [field]: value }))
    }
  }

  function ModalForm() {
    if (!modal) return null
    const isCreate = modal === 'create'

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">
              {isCreate ? 'Nuevo Abonado' : 'Editar Abonado'}
            </h2>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-primary-700">Cedula</label>
                <input
                  type="text"
                  value={form.cedula}
                  onChange={(e) => updateField('cedula', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="1-2345-6789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700">Nombre completo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="Nombre del abonado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => updateField('tipo', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="Física">Física</option>
                  <option value="Jurídica">Jurídica</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700">Telefono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="8888-8888"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700">Correo electronico</label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) => updateField('correo', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="correo@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700">Beneficiario</label>
                <input
                  type="text"
                  value={form.beneficiario}
                  onChange={(e) => updateField('beneficiario', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="Nombre del beneficiario"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700">Direccion</label>
              <textarea
                value={form.direccion}
                onChange={(e) => updateField('direccion', e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                placeholder="Direccion completa"
              />
            </div>

            <div className="border-t border-primary-100 pt-4">
              <h3 className="mb-3 text-base font-semibold text-primary-900">Datos del Medidor</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-primary-700">Numero de medidor</label>
                  <input
                    type="text"
                    value={form.medidor.numero}
                    onChange={(e) => updateField('medidor.numero', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    placeholder="M-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700">Diametro</label>
                  <select
                    value={form.medidor.diametro}
                    onChange={(e) => updateField('medidor.diametro', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Seleccionar</option>
                    <option value='1/2"'>1/2"</option>
                    <option value='3/4"'>3/4"</option>
                    <option value='1"'>1"</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700">Ubicacion</label>
                  <select
                    value={form.medidor.ubicacion}
                    onChange={(e) => updateField('medidor.ubicacion', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Exterior">Exterior</option>
                    <option value="Interior">Interior</option>
                  </select>
                </div>
              </div>
            </div>

            {!isCreate && (
              <div>
                <label className="block text-sm font-medium text-primary-700">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => updateField('estado', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
            >
              {isCreate ? 'Crear abonado' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  function DetailModal() {
    if (!viewDetail) return null
    const a = viewDetail
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">Detalle del Abonado</h2>
            <button
              type="button"
              onClick={() => setViewDetail(null)}
              className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium text-primary-700">Cedula:</span>
              <span className="text-primary-900">{a.cedula}</span>
              <span className="font-medium text-primary-700">Nombre:</span>
              <span className="text-primary-900">{a.nombre}</span>
              <span className="font-medium text-primary-700">Tipo:</span>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getTipoBadge(a.tipo)}`}>{a.tipo}</span>
              <span className="font-medium text-primary-700">Telefono:</span>
              <span className="text-primary-900">{a.telefono}</span>
              <span className="font-medium text-primary-700">Correo:</span>
              <span className="text-primary-900">{a.correo}</span>
              <span className="font-medium text-primary-700">Direccion:</span>
              <span className="text-primary-900">{a.direccion}</span>
              <span className="font-medium text-primary-700">Beneficiario:</span>
              <span className="text-primary-900">{a.beneficiario}</span>
              <span className="font-medium text-primary-700">Medidor:</span>
              <span className="text-primary-900">{a.medidor.numero} ({a.medidor.diametro} - {a.medidor.ubicacion})</span>
              <span className="font-medium text-primary-700">Estado:</span>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(a.estado)}`}>{a.estado}</span>
              <span className="font-medium text-primary-700">Registro:</span>
              <span className="text-primary-900">{a.fechaRegistro}</span>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setViewDetail(null)}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Cerrar
            </button>
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
            Gestion de Abonados
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            {abonados.length} abonados registrados
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="self-start rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
        >
          + Nuevo abonado
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre, cedula, telefono o direccion..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none sm:w-96"
      />

      <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-primary-100 text-sm">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Cedula</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Telefono</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Registro</th>
              <th className="px-4 py-3 text-left font-medium text-primary-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-primary-400">
                  No se encontraron abonados.
                </td>
              </tr>
            ) : (
              filtered.map((abonado) => (
                <tr key={abonado.id} className="hover:bg-primary-50/50">
                  <td className="px-4 py-3 font-mono text-primary-700">{abonado.cedula}</td>
                  <td className="px-4 py-3 font-medium text-primary-900">{abonado.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getTipoBadge(abonado.tipo)}`}>
                      {abonado.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-primary-600">{abonado.telefono}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getEstadoColor(abonado.estado)}`}>
                      {abonado.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-primary-500">{abonado.fechaRegistro}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(abonado)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewDetail(abonado)}
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
      </div>

      <ModalForm />
      <DetailModal />
    </div>
  )
}

export default Abonados