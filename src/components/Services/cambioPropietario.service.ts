import axios from 'axios'
import apiClient from '../../lib/apiClient'

const RESOURCE = '/solicitudes/cambio-propietario'

export type EstadoSolicitud = 'pendiente' | 'en_proceso' | 'aprobado' | 'rechazado'

export const MOTIVOS_TRASPASO = [
  'Compraventa',
  'Donación',
  'Herencia / Sucesión',
  'Cesión voluntaria',
] as const

export type MotivoTraspaso = (typeof MOTIVOS_TRASPASO)[number]

export interface SolicitudCambioPropietario {
  id: number
  codigo_solicitud: string
  id_abonado: number
  numero_abonado: string
  nombre_abonado: string
  cedula: string
  correo: string
  telefono: string
  tipo_solicitud: string
  estado: EstadoSolicitud
  nombre_nuevo_propietario: string
  cedula_nuevo_propietario: string
  telefono_nuevo_propietario: string
  correo_nuevo_propietario: string
  motivo_traspaso: string
  justificacion: string
  documento_soporte_url: string | null
  motivo_rechazo: string | null
  id_empleado: number | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface CrearSolicitudCambioPropietarioPayload {
  idAbonado?: number
  nombreNuevoPropietario: string
  cedulaNuevoPropietario: string
  telefonoNuevoPropietario: string
  correoNuevoPropietario: string
  motivoTraspaso: MotivoTraspaso
  justificacion: string
  documentoSoporte: File
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

export const crearSolicitudCambioPropietario = async (
  payload: CrearSolicitudCambioPropietarioPayload,
): Promise<SolicitudCambioPropietario> => {
  try {
    const formData = new FormData()
    if (payload.idAbonado) {
      formData.append('idAbonado', String(payload.idAbonado))
    }
    formData.append('nombreNuevoPropietario', payload.nombreNuevoPropietario)
    formData.append('cedulaNuevoPropietario', payload.cedulaNuevoPropietario)
    formData.append('telefonoNuevoPropietario', payload.telefonoNuevoPropietario)
    formData.append('correoNuevoPropietario', payload.correoNuevoPropietario)
    formData.append('motivoTraspaso', payload.motivoTraspaso)
    formData.append('justificacion', payload.justificacion)
    formData.append('documento_soporte', payload.documentoSoporte)

    const { data } = await apiClient.post<SolicitudCambioPropietario>(
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
      obtenerMensajeError(error, 'No se pudo crear la solicitud de cambio de propietario.'),
    )
  }
}

export const obtenerSolicitudesCambioPropietario = async (): Promise<
  SolicitudCambioPropietario[]
> => {
  try {
    const { data } = await apiClient.get<SolicitudCambioPropietario[]>(RESOURCE)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(
        error,
        'No se pudieron cargar las solicitudes de cambio de propietario.',
      ),
    )
  }
}

export const cambiarEstadoSolicitudCambioPropietario = async (
  id: number,
  payload: ActualizarEstadoPayload,
): Promise<SolicitudCambioPropietario> => {
  try {
    const { data } = await apiClient.patch<SolicitudCambioPropietario>(
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

