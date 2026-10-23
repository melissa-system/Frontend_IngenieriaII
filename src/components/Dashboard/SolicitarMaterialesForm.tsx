import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Alerta from '../ui/Alerta'
import Button from '../ui/Button'
import { Textarea } from '../ui/campos'
import {
  crearSolicitudMaterial,
  obtenerCatalogoMateriales,
  type ArticuloCatalogo,
  type CrearItemSolicitudMaterial,
  type SolicitudMaterial,
} from '../Services/solicitudesMaterial.service'

// Formulario de pedido de materiales que ve el fontanero dentro del detalle
// de un trabajo. Permite mezclar materiales del catálogo con materiales
// escritos a mano ("Otro") para los que todavía no están en inventario.

interface ItemElegido {
  clave: string
  articuloId: number | null
  nombre: string
  cantidad: number
  unidad?: string
}

const MOTIVO_MINIMO = 10

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function SolicitarMaterialesForm({
  averiaId,
  laborId,
  onCreada,
  onCancelar,
}: {
  averiaId?: number
  laborId?: number
  onCreada: (solicitud: SolicitudMaterial) => void
  onCancelar: () => void
}) {
  const [catalogo, setCatalogo] = useState<ArticuloCatalogo[]>([])
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true)
  const [errorCatalogo, setErrorCatalogo] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [items, setItems] = useState<ItemElegido[]>([])
  const [motivo, setMotivo] = useState('')

  // Material libre ("Otro").
  const [mostrarOtro, setMostrarOtro] = useState(false)
  const [otroNombre, setOtroNombre] = useState('')
  const [otroUnidad, setOtroUnidad] = useState('')
  const [otroCantidad, setOtroCantidad] = useState('1')

  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false
    obtenerCatalogoMateriales()
      .then((lista) => {
        if (!cancelado) setCatalogo(lista)
      })
      .catch((err) => {
        if (!cancelado) {
          setErrorCatalogo(
            err instanceof Error
              ? err.message
              : 'No se pudo cargar el catálogo de materiales.',
          )
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoCatalogo(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const resultados = useMemo(() => {
    const texto = normalizar(busqueda.trim())
    if (!texto) return []
    return catalogo
      .filter((a) => normalizar(a.nombre).includes(texto))
      .slice(0, 6)
  }, [busqueda, catalogo])

  function agregarDelCatalogo(articulo: ArticuloCatalogo) {
    setItems((prev) => {
      const existente = prev.find((i) => i.articuloId === articulo.id)
      if (existente) {
        return prev.map((i) =>
          i.articuloId === articulo.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        )
      }
      return [
        ...prev,
        {
          clave: `art-${articulo.id}`,
          articuloId: articulo.id,
          nombre: articulo.nombre,
          cantidad: 1,
        },
      ]
    })
    setBusqueda('')
  }

  function agregarOtro() {
    const nombre = otroNombre.trim()
    const cantidad = Number(otroCantidad)
    if (nombre.length < 3) {
      setError('Describe el material con al menos 3 caracteres.')
      return
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      setError('La cantidad debe ser un número entero mayor a cero.')
      return
    }
    setError('')
    setItems((prev) => [
      ...prev,
      {
        clave: `otro-${Date.now()}`,
        articuloId: null,
        nombre,
        cantidad,
        unidad: otroUnidad.trim() || undefined,
      },
    ])
    setOtroNombre('')
    setOtroUnidad('')
    setOtroCantidad('1')
    setMostrarOtro(false)
  }

  function cambiarCantidad(clave: string, valor: string) {
    const cantidad = Number(valor)
    setItems((prev) =>
      prev.map((i) =>
        i.clave === clave
          ? {
              ...i,
              cantidad:
                Number.isFinite(cantidad) && cantidad > 0
                  ? Math.min(999, Math.trunc(cantidad))
                  : 1,
            }
          : i,
      ),
    )
  }

  function quitar(clave: string) {
    setItems((prev) => prev.filter((i) => i.clave !== clave))
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (enviando) return
    if (items.length === 0) {
      setError('Agregá al menos un material a la solicitud.')
      return
    }
    if (motivo.trim().length < MOTIVO_MINIMO) {
      setError(`Explica el motivo con al menos ${MOTIVO_MINIMO} caracteres.`)
      return
    }
    setEnviando(true)
    setError('')
    try {
      const payloadItems: CrearItemSolicitudMaterial[] = items.map((i) => ({
        articuloId: i.articuloId ?? undefined,
        descripcionLibre: i.articuloId ? undefined : i.nombre,
        unidad: i.articuloId ? undefined : i.unidad,
        cantidad: i.cantidad,
      }))
      const creada = await crearSolicitudMaterial({
        averiaId,
        laborId,
        motivo: motivo.trim(),
        items: payloadItems,
      })
      onCreada(creada)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar la solicitud de material.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <div>
        <label
          htmlFor="buscar-material"
          className="block text-sm font-medium text-primary-700"
        >
          Buscar material en el catálogo
        </label>
        <input
          id="buscar-material"
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Ej: tubo, codo, medidor…"
          className="mt-1 w-full rounded-full border border-primary-200 px-4 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
        />
        {cargandoCatalogo && (
          <p className="mt-1 text-xs text-primary-400">Cargando catálogo…</p>
        )}
        {errorCatalogo && (
          <p className="mt-1 text-xs text-error-600">{errorCatalogo}</p>
        )}
        {busqueda.trim() !== '' && !cargandoCatalogo && (
          <ul className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-primary-200 bg-white shadow-sm">
            {resultados.length === 0 ? (
              <li className="px-3 py-2 text-sm text-primary-400">
                No se encontró en el catálogo. Usá “Agregar otro material”.
              </li>
            ) : (
              resultados.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => agregarDelCatalogo(a)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-primary-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-primary-800">
                        {a.nombre}
                      </span>
                      <span className="text-xs text-primary-400">
                        {a.clasificacion} · {a.ubicacion || 'Sin ubicación'}
                      </span>
                    </span>
                    <span
                      className={`flex-none rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        a.cantidad_disponible > 0
                          ? 'bg-exito-100 text-exito-700'
                          : 'bg-error-100 text-error-700'
                      }`}
                    >
                      Disponible: {a.cantidad_disponible}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setMostrarOtro((v) => !v)}
        >
          {mostrarOtro ? 'Cancelar material libre' : '+ Agregar otro material'}
        </Button>
        {mostrarOtro && (
          <div className="mt-2 space-y-2 rounded-lg border border-primary-200 bg-primary-50/50 p-3">
            <p className="text-xs text-primary-500">
              Para lo que no está en el inventario. La administración lo
              registrará antes de aprobar el pedido.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <input
                type="text"
                value={otroNombre}
                onChange={(e) => setOtroNombre(e.target.value)}
                maxLength={150}
                placeholder="Material (ej: manguera de 1”)"
                className="rounded-lg border border-primary-200 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                type="text"
                value={otroUnidad}
                onChange={(e) => setOtroUnidad(e.target.value)}
                maxLength={30}
                placeholder="Unidad (m, caja…)"
                className="rounded-lg border border-primary-200 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={otroCantidad}
                  onChange={(e) => setOtroCantidad(e.target.value)}
                  className="w-20 rounded-lg border border-primary-200 px-3 py-2 text-sm"
                />
                <Button type="button" size="sm" onClick={agregarOtro}>
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-primary-700">
          Materiales pedidos
        </p>
        {items.length === 0 ? (
          <p className="mt-1 text-sm text-primary-400">
            Todavía no agregaste materiales.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-primary-100 rounded-lg border border-primary-200">
            {items.map((item) => (
              <li
                key={item.clave}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-primary-800">
                    {item.nombre}
                  </span>
                  <span className="text-xs text-primary-400">
                    {item.articuloId ? 'Del catálogo' : 'No inventariado'}
                    {item.unidad ? ` · ${item.unidad}` : ''}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={item.cantidad}
                    onChange={(e) => cambiarCantidad(item.clave, e.target.value)}
                    className="w-16 rounded-lg border border-primary-200 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => quitar(item.clave)}
                    className="rounded-full border border-primary-200 px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                  >
                    Quitar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Textarea
        label="Motivo del pedido"
        obligatorio
        rows={3}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Ej: Se necesita para cambiar el medidor dañado y reparar la fuga."
        ayuda={`Mínimo ${MOTIVO_MINIMO} caracteres. Lo lee la administración al aprobar.`}
      />

      {error && <Alerta tipo="error">{error}</Alerta>}

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar solicitud'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancelar}
          disabled={enviando}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export default SolicitarMaterialesForm
