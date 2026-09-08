import axios from 'axios'
import apiClient from '../../lib/apiClient'

const RESOURCE = '/solicitudes/cambio-medidor'

export type EstadoSolicitud = 'pendiente' | 'en_proceso' | 'aprobado' | 'rechazado'

export const MOTIVOS_FALLA_MEDIDOR = [
  'Dañado',
  'Frenado',
  'Ilegible',
  'Antigüedad',
  'Fuga en la base del medidor',
  'Desgaste o fuga en la llave de paso',
] as const

export type MotivoFallaMedidor = (typeof MOTIVOS_FALLA_MEDIDOR)[number]

export interface SolicitudCambioMedidor {
  id: number
  codigo_solicitud: string
  id_abonado: number
  numero_abonado: string
  nombre_abonado: string
  cedula: string
  correo: string
  tipo_solicitud: string
  estado: EstadoSolicitud
  motivo_falla: string
  direccion_exacta: string
  justificacion: string
  evidencia_url: string | null
  motivo_rechazo: string | null
  id_empleado: number | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface CrearSolicitudCambioMedidorPayload {
  idAbonado?: number
  motivoFalla: string
  direccionExacta: string
  justificacion: string
  evidencia: File
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

export const crearSolicitudCambioMedidor = async (
  payload: CrearSolicitudCambioMedidorPayload,
): Promise<SolicitudCambioMedidor> => {
  try {
    const formData = new FormData()
    if (payload.idAbonado) {
      formData.append('idAbonado', String(payload.idAbonado))
    }
    formData.append('motivoFalla', payload.motivoFalla)
    formData.append('direccionExacta', payload.direccionExacta)
    formData.append('justificacion', payload.justificacion)
    formData.append('evidencia', payload.evidencia)

    const { data } = await apiClient.post<SolicitudCambioMedidor>(
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
      obtenerMensajeError(error, 'No se pudo crear la solicitud de cambio de medidor.'),
    )
  }
}

export const obtenerSolicitudesCambioMedidor = async (): Promise<
  SolicitudCambioMedidor[]
> => {
  try {
    const { data } = await apiClient.get<SolicitudCambioMedidor[]>(RESOURCE)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudieron cargar las solicitudes de cambio de medidor.'),
    )
  }
}

export const cambiarEstadoSolicitudCambioMedidor = async (
  id: number,
  payload: ActualizarEstadoPayload,
): Promise<SolicitudCambioMedidor> => {
  try {
    const { data } = await apiClient.patch<SolicitudCambioMedidor>(
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

