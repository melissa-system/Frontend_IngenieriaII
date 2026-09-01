import axios from 'axios'
import apiClient from '../../lib/apiClient'

export interface PerfilCompleto {
  id: number
  email: string
  role: string
  foto_url: string | null
  nombre: string | null
  apellido1: string | null
  apellido2: string | null
  cedula: string | null
  telefono: string | null
  direccion?: string | null
  puesto: string | null
  tipo_asociacion: 'empleado' | 'abonado' | null
}

export interface ActualizarPerfilPayload {
  email?: string
  telefono?: string
}

function obtenerMensajeErrorAxios(error: unknown, fallback: string): string {
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

export const obtenerPerfil = async (): Promise<PerfilCompleto> => {
  try {
    const { data } = await apiClient.get<PerfilCompleto>('/auth/perfil')
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeErrorAxios(error, 'No se pudo cargar el perfil.'),
    )
  }
}

export const actualizarPerfil = async (
  payload: ActualizarPerfilPayload,
): Promise<PerfilCompleto> => {
  try {
    const { data } = await apiClient.patch<PerfilCompleto>('/auth/perfil', payload)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeErrorAxios(error, 'No se pudo actualizar el perfil.'),
    )
  }
}

export const subirFoto = async (file: File): Promise<{ foto_url: string }> => {
  try {
    const formData = new FormData()
    formData.append('foto', file)
    const { data } = await apiClient.patch<{ foto_url: string }>(
      '/auth/foto',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeErrorAxios(error, 'No se pudo subir la foto.'),
    )
  }
}
