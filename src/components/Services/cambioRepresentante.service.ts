import axios from 'axios'
import apiClient from '../../lib/apiClient'

const RESOURCE = '/solicitudes/cambio-representante'

export type EstadoSolicitud = 'pendiente' | 'en_proceso' | 'aprobado' | 'rechazado'

export interface SolicitudCambioRepresentante {
  id: number
  codigo_solicitud: string
  id_abonado: number
  numero_abonado: string
  nombre_abonado: string
  cedula: string
  correo: string
  tipo_solicitud: string
  estado: EstadoSolicitud
  representante_anterior_nombre: string
  representante_anterior_cedula: string
  representante_nuevo_nombre: string
  representante_nuevo_cedula: string
  representante_nuevo_direccion: string
  representante_nuevo_correo: string | null
  representante_nuevo_telefono: string | null
  copia_cedula_url: string | null
  justificacion: string
  motivo_rechazo: string | null
  id_empleado: number | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface CrearSolicitudCambioRepresentantePayload {
  idAbonado?: number
  representanteNuevoNombre: string
  representanteNuevoCedula: string
  representanteNuevoDireccion: string
  representanteNuevoCorreo?: string
  representanteNuevoTelefono?: string
  justificacion: string
  copiaCedula: File
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

export const crearSolicitudCambioRepresentante = async (
  payload: CrearSolicitudCambioRepresentantePayload,
): Promise<SolicitudCambioRepresentante> => {
  try {
    const formData = new FormData()
    if (payload.idAbonado) {
      formData.append('idAbonado', String(payload.idAbonado))
    }
    formData.append('representanteNuevoNombre', payload.representanteNuevoNombre)
    formData.append('representanteNuevoCedula', payload.representanteNuevoCedula)
    formData.append('representanteNuevoDireccion', payload.representanteNuevoDireccion)
    if (payload.representanteNuevoCorreo?.trim()) {
      formData.append('representanteNuevoCorreo', payload.representanteNuevoCorreo.trim())
    }
    if (payload.representanteNuevoTelefono?.trim()) {
      formData.append('representanteNuevoTelefono', payload.representanteNuevoTelefono.trim())
    }
    formData.append('justificacion', payload.justificacion)
    formData.append('copiaCedula', payload.copiaCedula)

    const { data } = await apiClient.post<SolicitudCambioRepresentante>(
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
      obtenerMensajeError(error, 'No se pudo crear la solicitud de cambio de representante.'),
    )
  }
}

export const obtenerSolicitudesCambioRepresentante = async (): Promise<
  SolicitudCambioRepresentante[]
> => {
  try {
    const { data } = await apiClient.get<SolicitudCambioRepresentante[]>(RESOURCE)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudieron cargar las solicitudes de cambio de representante.'),
    )
  }
}

export const cambiarEstadoSolicitudCambioRepresentante = async (
  id: number,
  payload: ActualizarEstadoPayload,
): Promise<SolicitudCambioRepresentante> => {
  try {
    const { data } = await apiClient.patch<SolicitudCambioRepresentante>(
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