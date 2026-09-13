import axios from 'axios'
import apiClient from '../../lib/apiClient'

const RESOURCE = '/averias'

export interface AveriaBackend {
  id: number
  codigo_averia: string
  tipo_averia: string
  descripcion: string
  estado: 'Pendiente' | 'En proceso' | 'Finalizado'
  cedula_reportante: string
  nombre_reportante: string
  apellido1_reportante: string | null
  apellido2_reportante: string | null
  ubicacion: string | null
  imagen_url: string | null
  fecha_reporte: string
  empleado: {
    id: number
    nombre: string
    apellido1: string | null
    apellido2: string | null
    puesto: string
  } | null
  historial: HistorialAveriaBackend[]
}

export interface HistorialAveriaBackend {
  id: number
  estado_anterior: string | null
  estado_nuevo: string
  realizado_por: string
  observacion: string | null
  fecha: string
}

export interface AveriaPayload {
  tipo_averia: string
  descripcion: string
  cedula_reportante: string
  nombre_reportante: string
  apellido1_reportante?: string
  apellido2_reportante?: string
  ubicacion?: string
}

export interface ActualizarAveriaPayload {
  estado?: string
  empleado_id?: number
  observacion?: string
  realizado_por?: string
}

function obtenerMensajeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Inténtalo más tarde.'
    }
    const msg = error.response?.data?.message
    if (typeof msg === 'string') return msg
    if (Array.isArray(msg)) return msg.join('. ')
  }
  return fallback
}

export const crearAveria = async (payload: AveriaPayload): Promise<AveriaBackend> => {
  try {
    const { data } = await apiClient.post<AveriaBackend>(RESOURCE, payload)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo crear el reporte de avería.'),
    )
  }
}

export const obtenerAverias = async (): Promise<AveriaBackend[]> => {
  try {
    const { data } = await apiClient.get<AveriaBackend[]>(RESOURCE)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudieron cargar las averías.'),
    )
  }
}

export const obtenerAveria = async (id: number): Promise<AveriaBackend> => {
  try {
    const { data } = await apiClient.get<AveriaBackend>(`${RESOURCE}/${id}`)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo cargar la avería.'),
    )
  }
}

export const actualizarAveria = async (
  id: number,
  payload: ActualizarAveriaPayload,
): Promise<AveriaBackend> => {
  try {
    const { data } = await apiClient.patch<AveriaBackend>(
      `${RESOURCE}/${id}`,
      payload,
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo actualizar la avería.'),
    )
  }
}

export const subirImagenAveria = async (
  id: number,
  file: File,
): Promise<AveriaBackend> => {
  try {
    const formData = new FormData()
    formData.append('imagen', file)

    const { data } = await apiClient.patch<AveriaBackend>(
      `${RESOURCE}/${id}/imagen`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo subir la imagen.'),
    )
  }
}
