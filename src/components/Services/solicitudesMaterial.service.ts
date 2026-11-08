import apiClient from '../../lib/apiClient'
import { crearErrorApi } from './erroresApi'

const RESOURCE = '/solicitudes-material'

export const ESTADOS_SOLICITUD_MATERIAL = [
  'Pendiente',
  'Aprobada',
  'Rechazada',
  'Cancelada',
] as const

export type EstadoSolicitudMaterial =
  (typeof ESTADOS_SOLICITUD_MATERIAL)[number]

export interface ArticuloCatalogo {
  id: number
  nombre: string
  clasificacion: string
  cantidad_disponible: number
  ubicacion: string
}

export interface ItemSolicitudMaterial {
  id: number
  articulo: ArticuloCatalogo | null
  id_articulo: number | null
  descripcion_libre: string | null
  unidad: string | null
  cantidad: number
}

export interface SolicitudMaterial {
  id: number
  codigo_solicitud_material: string
  estado: EstadoSolicitudMaterial
  motivo: string
  motivo_rechazo: string | null
  empleado: { id: number; nombre: string } | null
  averia: {
    id: number
    codigo_averia: string
    tipo_averia: string
    descripcion: string
  } | null
  labor: {
    id: number
    codigo_labor: string
    tipo_actividad: string
    descripcion: string
  } | null
  detalles: ItemSolicitudMaterial[]
  fecha_revision: string | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface CrearItemSolicitudMaterial {
  articuloId?: number
  descripcionLibre?: string
  unidad?: string
  cantidad: number
}

export interface CrearSolicitudMaterialPayload {
  averiaId?: number
  laborId?: number
  motivo: string
  items: CrearItemSolicitudMaterial[]
}

export const obtenerCatalogoMateriales = async (): Promise<
  ArticuloCatalogo[]
> => {
  try {
    const { data } = await apiClient.get<ArticuloCatalogo[]>(
      `${RESOURCE}/catalogo`,
    )
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo cargar el catálogo de materiales.')
  }
}

export const obtenerMisSolicitudesMaterial = async (): Promise<
  SolicitudMaterial[]
> => {
  try {
    const { data } = await apiClient.get<SolicitudMaterial[]>(
      `${RESOURCE}/mis-solicitudes`,
    )
    return data
  } catch (error) {
    throw crearErrorApi(
      error,
      'No se pudieron cargar tus solicitudes de material.',
    )
  }
}

export const crearSolicitudMaterial = async (
  payload: CrearSolicitudMaterialPayload,
): Promise<SolicitudMaterial> => {
  try {
    const { data } = await apiClient.post<SolicitudMaterial>(RESOURCE, payload)
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo enviar la solicitud de material.')
  }
}

export const obtenerSolicitudesMaterial = async (filtros: {
  estado?: string
  busqueda?: string
} = {}): Promise<SolicitudMaterial[]> => {
  const params: Record<string, string> = {}
  if (filtros.estado && filtros.estado !== 'Todos') {
    params.estado = filtros.estado
  }
  if (filtros.busqueda?.trim()) params.busqueda = filtros.busqueda.trim()
  try {
    const { data } = await apiClient.get<SolicitudMaterial[]>(RESOURCE, {
      params,
    })
    return data
  } catch (error) {
    throw crearErrorApi(
      error,
      'No se pudieron cargar las solicitudes de material.',
    )
  }
}

export const vincularMaterialSolicitud = async (
  id: number,
  detalleId: number,
  articuloId: number,
): Promise<SolicitudMaterial> => {
  try {
    const { data } = await apiClient.patch<SolicitudMaterial>(
      `${RESOURCE}/${id}/vincular/${detalleId}`,
      { articuloId },
    )
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo vincular el material al inventario.')
  }
}

export const aprobarSolicitudMaterial = async (
  id: number,
): Promise<SolicitudMaterial> => {
  try {
    const { data } = await apiClient.patch<SolicitudMaterial>(
      `${RESOURCE}/${id}/aprobar`,
    )
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo aprobar la solicitud de material.')
  }
}

export const rechazarSolicitudMaterial = async (
  id: number,
  motivoRechazo: string,
): Promise<SolicitudMaterial> => {
  try {
    const { data } = await apiClient.patch<SolicitudMaterial>(
      `${RESOURCE}/${id}/rechazar`,
      { motivoRechazo },
    )
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo rechazar la solicitud de material.')
  }
}

export const cancelarSolicitudMaterial = async (
  id: number,
): Promise<SolicitudMaterial> => {
  try {
    const { data } = await apiClient.patch<SolicitudMaterial>(
      `${RESOURCE}/${id}/cancelar`,
    )
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo cancelar la solicitud de material.')
  }
}
