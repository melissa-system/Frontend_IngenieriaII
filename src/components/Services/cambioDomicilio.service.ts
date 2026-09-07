import axios from 'axios'
import apiClient from '../../lib/apiClient'

const RESOURCE = '/solicitudes/cambio-domicilio'

export type EstadoSolicitud = 'pendiente' | 'en_proceso' | 'aprobado' | 'rechazado'

export interface SolicitudCambioDomicilio {
  id: number
  codigo_solicitud: string
  id_abonado: number
  numero_abonado: string
  nombre_abonado: string
  cedula: string
  correo: string
  tipo_solicitud: string
  estado: EstadoSolicitud
  direccion_anterior: string
  direccion_nueva: string
  justificacion: string
  motivo_rechazo: string | null
  id_empleado: number | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface CrearSolicitudCambioDomicilioPayload {
  idAbonado?: number
  direccionNueva: string
  justificacion: string
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

export const crearSolicitudCambioDomicilio = async (
  payload: CrearSolicitudCambioDomicilioPayload,
): Promise<SolicitudCambioDomicilio> => {
  try {
    const { data } = await apiClient.post<SolicitudCambioDomicilio>(RESOURCE, payload)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo crear la solicitud de cambio de domicilio.'),
    )
  }
}

export const obtenerSolicitudesCambioDomicilio = async (): Promise<
  SolicitudCambioDomicilio[]
> => {
  try {
    const { data } = await apiClient.get<SolicitudCambioDomicilio[]>(RESOURCE)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudieron cargar las solicitudes de cambio de domicilio.'),
    )
  }
}

export const cambiarEstadoSolicitudCambioDomicilio = async (
  id: number,
  payload: ActualizarEstadoPayload,
): Promise<SolicitudCambioDomicilio> => {
  try {
    const { data } = await apiClient.patch<SolicitudCambioDomicilio>(
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
