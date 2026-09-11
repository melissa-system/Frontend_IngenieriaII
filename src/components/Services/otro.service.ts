import axios from 'axios'
import apiClient from '../../lib/apiClient'

const RESOURCE = '/solicitudes/otro'

export type EstadoSolicitud = 'pendiente' | 'en_proceso' | 'aprobado' | 'rechazado'

export interface SolicitudOtro {
  id: number
  codigo_solicitud: string
  id_abonado: number
  numero_abonado: string
  nombre_abonado: string
  cedula: string
  correo: string
  tipo_solicitud: string
  estado: EstadoSolicitud
  asunto: string
  justificacion: string
  adjunto_url: string | null
  motivo_rechazo: string | null
  id_empleado: number | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface CrearSolicitudOtroPayload {
  idAbonado?: number
  asunto: string
  justificacion: string
  adjunto?: File
}

export interface ActualizarEstadoPayload {
  estado: 'en_proceso' | 'aprobado' | 'rechazado'
  motivoRechazo?: string
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

export const crearSolicitudOtro = async (
  payload: CrearSolicitudOtroPayload,
): Promise<SolicitudOtro> => {
  try {
    const formData = new FormData()
    if (payload.idAbonado) {
      formData.append('idAbonado', String(payload.idAbonado))
    }
    formData.append('asunto', payload.asunto)
    formData.append('justificacion', payload.justificacion)
    if (payload.adjunto) {
      formData.append('adjunto', payload.adjunto)
    }

    const { data } = await apiClient.post<SolicitudOtro>(
      RESOURCE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo crear la solicitud.'),
    )
  }
}

export const obtenerSolicitudesOtro = async (): Promise<SolicitudOtro[]> => {
  try {
    const { data } = await apiClient.get<SolicitudOtro[]>(RESOURCE)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudieron cargar las solicitudes.'),
    )
  }
}

export const cambiarEstadoSolicitudOtro = async (
  id: number,
  payload: ActualizarEstadoPayload,
): Promise<SolicitudOtro> => {
  try {
    const { data } = await apiClient.patch<SolicitudOtro>(
      `${RESOURCE}/${id}/estado`,
      payload,
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo actualizar el estado de la solicitud.'),
    )
  }
}