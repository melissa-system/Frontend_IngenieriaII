import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Alerta from '../../components/ui/Alerta'
import BadgeEstado from '../../components/ui/BadgeEstado'
import Modal, { ModalAcciones, ModalTitulo } from '../../components/ui/Modal'
import Paginador from '../../components/ui/Paginador'
import { FilaVacia } from '../../components/ui/EmptyState'
import { FilasEsqueleto } from '../../components/ui/Cargando'
import { Notificar } from '../../components/ui/ToastProvider'
import ModalGestionEstado, {
  type AccionGestion,
} from '../../components/Dashboard/ModalGestionEstado'
import {
  aprobarSolicitudMaterial,
  obtenerSolicitudesMaterial,
  rechazarSolicitudMaterial,
  vincularMaterialSolicitud,
  type EstadoSolicitudMaterial,
  type ItemSolicitudMaterial,
  type SolicitudMaterial,
} from '../../components/Services/solicitudesMaterial.service'
import {
  crearArticulo,
  obtenerArticulos,
  obtenerProveedores,
  type Articulo,
  type Proveedor,
} from '../../components/Services/inventario.service'

const POR_PAGINA = 10

const ESTADOS: Array<'Todos' | EstadoSolicitudMaterial> = [
  'Todos',
  'Pendiente',
  'Aprobada',
  'Rechazada',
  'Cancelada',
]

function formatearFecha(fecha: string): string {
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
}

function nombreMaterial(detalle: ItemSolicitudMaterial): string {
  return detalle.articulo?.nombre ?? detalle.descripcion_libre ?? 'Material'
}

function codigoTrabajo(solicitud: SolicitudMaterial): string {
  return (
    solicitud.averia?.codigo_averia ??
    solicitud.labor?.codigo_labor ??
    '—'
  )
}

// Bandeja de solicitudes de material (Inventario). El fontanero las crea desde
// su panel; acá se revisan, se vinculan los materiales que no estaban en el
// catálogo y se aprueban (lo que descuenta stock) o se rechazan con motivo.
function SolicitudesMaterial() {
  const [solicitudes, setSolicitudes] = useState<SolicitudMaterial[]>([])
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const [filtroEstado, setFiltroEstado] = useState<'Todos' | EstadoSolicitudMaterial>('Todos')
  const [search, setSearch] = useState('')
  const [pagina, setPagina] = useState(1)

  const [detalle, setDetalle] = useState<SolicitudMaterial | null>(null)
  const [confirmar, setConfirmar] = useState<AccionGestion | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [gestionando, setGestionando] = useState(false)
  const [errorGestion, setErrorGestion] = useState('')

  // Vinculación de un material libre a un artículo existente.
  const [articuloElegido, setArticuloElegido] = useState<Record<number, string>>({})
  const [vinculando, setVinculando] = useState<number | null>(null)

  // Alta rápida de artículo para un material que no estaba en inventario.
  const [creandoPara, setCreandoPara] = useState<number | null>(null)
  const [nuevo, setNuevo] = useState({
    nombre: '',
    cantidad: '1',
    ubicacion: '',
    proveedorId: '',
  })

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      const [lista, catalogo, provs] = await Promise.all([
        obtenerSolicitudesMaterial(),
        obtenerArticulos(),
        obtenerProveedores(),
      ])
      setSolicitudes(lista)
      setArticulos(catalogo)
      setProveedores(provs)
      setDetalle((actual) =>
        actual ? lista.find((s) => s.id === actual.id) ?? null : null,
      )
    } catch (err) {
      setErrorCarga(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar las solicitudes de material.',
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const filtradas = useMemo(() => {
    const texto = search
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    return solicitudes.filter((s) => {
      if (filtroEstado !== 'Todos' && s.estado !== filtroEstado) return false
      if (!texto) return true
      const campos = [
        s.codigo_solicitud_material,
        s.empleado?.nombre ?? '',
        codigoTrabajo(s),
      ]
      return campos.some((c) =>
        c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(texto),
      )
    })
  }, [solicitudes, filtroEstado, search])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const filas = filtradas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  )

  const pendientes = solicitudes.filter((s) => s.estado === 'Pendiente').length

  function abrirDetalle(solicitud: SolicitudMaterial) {
    setDetalle(solicitud)
    setErrorGestion('')
    setMotivoRechazo('')
    setCreandoPara(null)
    setArticuloElegido({})
  }

  function cerrarDetalle() {
    if (gestionando) return
    setDetalle(null)
    setConfirmar(null)
    setErrorGestion('')
  }

  async function vincular(detalleId: number) {
    if (!detalle) return
    const articuloId = Number(articuloElegido[detalleId] ?? 0)
    if (!articuloId) {
      setErrorGestion('Elegí un artículo del inventario para vincular el material.')
      return
    }
    setVinculando(detalleId)
    setErrorGestion('')
    try {
      const actualizada = await vincularMaterialSolicitud(detalle.id, detalleId, articuloId)
      setDetalle(actualizada)
      setToast('Material vinculado al inventario.')
      await cargar()
    } catch (err) {
      setErrorGestion(
        err instanceof Error ? err.message : 'No se pudo vincular el material.',
      )
    } finally {
      setVinculando(null)
    }
  }

  function abrirCrearArticulo(item: ItemSolicitudMaterial) {
    setCreandoPara(item.id)
    setErrorGestion('')
    setNuevo({
      nombre: item.descripcion_libre ?? '',
      cantidad: String(item.cantidad),
      ubicacion: 'Bodega',
      proveedorId: '',
    })
  }

  async function crearYVincular(item: ItemSolicitudMaterial) {
    if (!detalle) return
    if (nuevo.nombre.trim().length < 3) {
      setErrorGestion('Escribí el nombre del artículo (mínimo 3 caracteres).')
      return
    }
    if (!nuevo.proveedorId) {
      setErrorGestion('Elegí el proveedor del artículo.')
      return
    }
    const cantidad = Number(nuevo.cantidad)
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      setErrorGestion('La cantidad comprada debe ser un número entero mayor a cero.')
      return
    }

    setVinculando(item.id)
    setErrorGestion('')
    try {
      const articulo = await crearArticulo({
        nombre: nuevo.nombre.trim(),
        descripcion: `${nuevo.nombre.trim()} (solicitud ${detalle.codigo_solicitud_material})`,
        clasificacion: 'materiales',
        cantidad,
        ubicacion: nuevo.ubicacion.trim() || 'Bodega',
        proveedorId: Number(nuevo.proveedorId),
        personaRecibe: detalle.empleado?.nombre ?? 'ASADA',
      })
      const actualizada = await vincularMaterialSolicitud(
        detalle.id,
        item.id,
        articulo.id,
      )
      setDetalle(actualizada)
      setCreandoPara(null)
      setToast(`Artículo "${articulo.nombre}" registrado y vinculado.`)
      await cargar()
    } catch (err) {
      setErrorGestion(
        err instanceof Error
          ? err.message
          : 'No se pudo registrar el artículo en inventario.',
      )
    } finally {
      setVinculando(null)
    }
  }

  async function gestionar() {
    if (!detalle || !confirmar) return
    setGestionando(true)
    setErrorGestion('')
    try {
      const actualizada =
        confirmar === 'aprobar'
          ? await aprobarSolicitudMaterial(detalle.id)
          : await rechazarSolicitudMaterial(detalle.id, motivoRechazo)
      setDetalle(null)
      setConfirmar(null)
      setMotivoRechazo('')
      setToast(
        confirmar === 'aprobar'
          ? `Solicitud ${actualizada.codigo_solicitud_material} aprobada: se descontó el stock.`
          : `Solicitud ${actualizada.codigo_solicitud_material} rechazada.`,
      )
      await cargar()
    } catch (err) {
      setConfirmar(null)
      setErrorGestion(
        err instanceof Error
          ? err.message
          : 'No se pudo gestionar la solicitud.',
      )
    } finally {
      setGestionando(false)
    }
  }

  const haySinVincular =
    detalle?.detalles.some((item) => !item.articulo) ?? false
  const haySinStock =
    detalle?.detalles.some(
      (item) =>
        !!item.articulo && item.articulo.cantidad_disponible < item.cantidad,
    ) ?? false

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Solicitudes de material"
        descripcion={
          cargando
            ? 'Cargando...'
            : `${pendientes} pendiente(s) de ${solicitudes.length} solicitudes`
        }
      />

      <Notificar mensaje={toast} />

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPagina(1)
          }}
          placeholder="Buscar por código, fontanero o trabajo…"
          className="h-10 w-full rounded-full border border-primary-200 px-4 text-sm text-primary-900 focus:border-primary-500 focus:outline-none sm:w-80"
        />
        <select
          value={filtroEstado}
          onChange={(e) => {
            setFiltroEstado(e.target.value as 'Todos' | EstadoSolicitudMaterial)
            setPagina(1)
          }}
          className="h-10 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
        >
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {estado === 'Todos' ? 'Todos los estados' : estado}
            </option>
          ))}
        </select>
      </div>

      {errorCarga && <Alerta tipo="error">{errorCarga}</Alerta>}

      <Table
        cabecera={['Código', 'Fontanero', 'Trabajo', 'Fecha', 'Estado', 'Acciones']}
        pie={
          filtradas.length > 0 ? (
            <Paginador
              total={filtradas.length}
              pagina={paginaActual}
              porPagina={POR_PAGINA}
              onCambiar={setPagina}
              etiqueta="solicitudes"
              filtro={search}
              deshabilitado={cargando}
            />
          ) : undefined
        }
      >
        {cargando ? (
          <FilasEsqueleto columnas={6} />
        ) : filas.length === 0 ? (
          <FilaVacia
            columnas={6}
            titulo={
              solicitudes.length === 0
                ? 'Todavía no hay solicitudes de material.'
                : 'Ninguna solicitud coincide con el filtro.'
            }
          />
        ) : (
          filas.map((solicitud) => (
            <tr key={solicitud.id} className="hover:bg-primary-50/50">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-primary-600">
                {solicitud.codigo_solicitud_material}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-primary-800">
                {solicitud.empleado?.nombre ?? '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-primary-700">
                {codigoTrabajo(solicitud)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-primary-500">
                {formatearFecha(solicitud.fecha_creacion)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <BadgeEstado estado={solicitud.estado} />
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => abrirDetalle(solicitud)}
                >
                  Ver / gestionar
                </Button>
              </td>
            </tr>
          ))
        )}
      </Table>

      {detalle && (
        <Modal size="2xl" onCerrar={cerrarDetalle}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <ModalTitulo>{detalle.codigo_solicitud_material}</ModalTitulo>
              <p className="mt-0.5 text-sm text-primary-500">
                {detalle.empleado?.nombre ?? 'Fontanero'} ·{' '}
                {codigoTrabajo(detalle)}
              </p>
            </div>
            <BadgeEstado estado={detalle.estado} />
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-primary-400">
                Fecha
              </dt>
              <dd className="mt-0.5 text-primary-800">
                {formatearFecha(detalle.fecha_creacion)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-primary-400">
                Revisada
              </dt>
              <dd className="mt-0.5 text-primary-800">
                {detalle.fecha_revision
                  ? formatearFecha(detalle.fecha_revision)
                  : 'Pendiente'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-primary-400">
                Motivo del pedido
              </dt>
              <dd className="mt-0.5 whitespace-pre-line text-primary-800">
                {detalle.motivo}
              </dd>
            </div>
            {detalle.motivo_rechazo && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase text-error-600">
                  Motivo del rechazo
                </dt>
                <dd className="mt-0.5 text-error-700">
                  {detalle.motivo_rechazo}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-primary-900">
              Materiales solicitados
            </h3>
            <ul className="mt-2 divide-y divide-primary-100 rounded-xl border border-primary-200">
              {detalle.detalles.map((item) => {
                const sinStock =
                  !!item.articulo &&
                  item.articulo.cantidad_disponible < item.cantidad
                return (
                  <li key={item.id} className="space-y-2 px-3 py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block font-medium text-primary-900">
                          {nombreMaterial(item)}
                        </span>
                        <span className="text-xs text-primary-400">
                          Pedido: {item.cantidad}
                          {item.unidad ? ` ${item.unidad}` : ''}
                          {item.articulo
                            ? ` · Disponible: ${item.articulo.cantidad_disponible}`
                            : ' · No inventariado'}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        {!item.articulo && (
                          <span className="rounded-full bg-advertencia-100 px-2 py-0.5 text-[11px] font-semibold text-advertencia-700">
                            Sin vincular
                          </span>
                        )}
                        {sinStock && (
                          <span className="rounded-full bg-error-100 px-2 py-0.5 text-[11px] font-semibold text-error-700">
                            Falta stock
                          </span>
                        )}
                      </span>
                    </div>

                    {!item.articulo && detalle.estado === 'Pendiente' && (
                      <div className="space-y-2 rounded-lg bg-primary-50/60 p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={articuloElegido[item.id] ?? ''}
                            onChange={(e) =>
                              setArticuloElegido((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            className="h-9 min-w-0 flex-1 rounded-full border border-primary-200 bg-white px-3 text-sm"
                          >
                            <option value="">Vincular a un artículo existente…</option>
                            {articulos
                              .filter((a) => a.estado === 'activo')
                              .map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.nombre} (stock: {a.cantidad_disponible})
                                </option>
                              ))}
                          </select>
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            disabled={vinculando === item.id}
                            onClick={() => vincular(item.id)}
                          >
                            Vincular
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            disabled={vinculando === item.id}
                            onClick={() =>
                              creandoPara === item.id
                                ? setCreandoPara(null)
                                : abrirCrearArticulo(item)
                            }
                          >
                            {creandoPara === item.id
                              ? 'Cancelar alta'
                              : 'Crear artículo'}
                          </Button>
                        </div>

                        {creandoPara === item.id && (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <input
                              type="text"
                              value={nuevo.nombre}
                              onChange={(e) =>
                                setNuevo((n) => ({ ...n, nombre: e.target.value }))
                              }
                              placeholder="Nombre del artículo"
                              maxLength={150}
                              className="rounded-lg border border-primary-200 px-3 py-2 text-sm"
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min={1}
                                value={nuevo.cantidad}
                                onChange={(e) =>
                                  setNuevo((n) => ({ ...n, cantidad: e.target.value }))
                                }
                                placeholder="Cantidad comprada"
                                className="w-28 rounded-lg border border-primary-200 px-3 py-2 text-sm"
                              />
                              <input
                                type="text"
                                value={nuevo.ubicacion}
                                onChange={(e) =>
                                  setNuevo((n) => ({ ...n, ubicacion: e.target.value }))
                                }
                                placeholder="Ubicación"
                                className="min-w-0 flex-1 rounded-lg border border-primary-200 px-3 py-2 text-sm"
                              />
                            </div>
                            <select
                              value={nuevo.proveedorId}
                              onChange={(e) =>
                                setNuevo((n) => ({ ...n, proveedorId: e.target.value }))
                              }
                              className="rounded-full border border-primary-200 bg-white px-3 py-2 text-sm"
                            >
                              <option value="">Proveedor…</option>
                              {proveedores.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nombre}
                                </option>
                              ))}
                            </select>
                            <Button
                              variant="primary"
                              size="sm"
                              type="button"
                              disabled={vinculando === item.id}
                              onClick={() => crearYVincular(item)}
                            >
                              {vinculando === item.id
                                ? 'Registrando…'
                                : 'Registrar compra y vincular'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {haySinStock && detalle.estado === 'Pendiente' && (
            <div className="mt-3">
              <Alerta tipo="advertencia">
                Falta stock para aprobar esta solicitud. Registrá la entrada de
                la compra en{' '}
                <Link
                  to="/dashboard/inventario/movimientos"
                  className="font-semibold underline"
                >
                  Inventario → Movimientos de stock
                </Link>{' '}
                y después volvé a aprobar.
              </Alerta>
            </div>
          )}

          {errorGestion && (
            <Alerta tipo="error" className="mt-3">
              {errorGestion}
            </Alerta>
          )}

          <ModalAcciones>
            {detalle.estado === 'Pendiente' ? (
              <>
                <Button
                  variant="success"
                  type="button"
                  disabled={haySinVincular || gestionando}
                  title={
                    haySinVincular
                      ? 'Vinculá los materiales no inventariados antes de aprobar'
                      : undefined
                  }
                  onClick={() => setConfirmar('aprobar')}
                >
                  Aprobar
                </Button>
                <Button
                  variant="danger"
                  type="button"
                  disabled={gestionando}
                  onClick={() => setConfirmar('rechazar')}
                >
                  Rechazar
                </Button>
              </>
            ) : (
              <Button variant="secondary" type="button" onClick={cerrarDetalle}>
                Cerrar
              </Button>
            )}
            {detalle.estado === 'Pendiente' && (
              <Button
                variant="secondary"
                type="button"
                onClick={cerrarDetalle}
                disabled={gestionando}
              >
                Cancelar
              </Button>
            )}
          </ModalAcciones>

          {confirmar && (
            <ModalGestionEstado
              accion={confirmar}
              codigo={detalle.codigo_solicitud_material}
              motivo={motivoRechazo}
              onMotivoChange={setMotivoRechazo}
              aviso={
                confirmar === 'aprobar'
                  ? 'Al confirmar, se descontará del inventario el stock de todos los materiales aprobados.'
                  : undefined
              }
              cargando={gestionando}
              onConfirmar={gestionar}
              onCancelar={() => setConfirmar(null)}
            />
          )}
        </Modal>
      )}
    </div>
  )
}

export default SolicitudesMaterial
