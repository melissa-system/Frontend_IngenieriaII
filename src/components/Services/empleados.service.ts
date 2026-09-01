import axios from 'axios'
import apiClient from '../../lib/apiClient'

const RESOURCE = '/empleados'

export type EstadoEmpleado = 'Activo' | 'Inactivo'

export interface EmpleadoPayload {
  nombre: string
  cedula: string
  puesto: string
  telefono: string
  fecha_ingreso: string
  usuario_id?: number
  email?: string
}

export interface Empleado extends Omit<EmpleadoPayload, 'usuario_id' | 'email'> {
  id: number
  estado: string
  fecha_registro: string
  usuario_id: number | null
  email: string | null
}

export function nombreVisible(emp: Pick<Empleado, 'nombre'>): string {
  return emp.nombre
}

export interface EmpleadoUpdatePayload {
  nombre?: string
  cedula?: string
  puesto?: string
  telefono?: string
  correo?: string | null
  fecha_ingreso?: string
  usuario_id?: number | null
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

export const crearEmpleado = async (
  payload: EmpleadoPayload,
): Promise<Empleado> => {
  try {
    const { data } = await apiClient.post<Empleado>(RESOURCE, payload)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo registrar el empleado.'),
    )
  }
}

export const obtenerEmpleados = async (
  buscar?: string,
): Promise<Empleado[]> => {
  try {
    const params = buscar ? { buscar } : {}
    const { data } = await apiClient.get<Empleado[]>(RESOURCE, { params })
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudieron cargar los empleados.'),
    )
  }
}

export const obtenerEmpleado = async (
  id: number | string,
): Promise<Empleado> => {
  try {
    const { data } = await apiClient.get<Empleado>(`${RESOURCE}/${id}`)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo cargar el empleado.'),
    )
  }
}

export const actualizarEmpleado = async (
  id: number | string,
  payload: EmpleadoUpdatePayload,
): Promise<Empleado> => {
  try {
    const { data } = await apiClient.patch<Empleado>(
      `${RESOURCE}/${id}`,
      payload,
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(
        error,
        'No se pudieron guardar los cambios del empleado.',
      ),
    )
  }
}

export const cambiarEstadoEmpleado = async (
  id: number | string,
  estado: EstadoEmpleado,
): Promise<Empleado> => {
  try {
    const { data } = await apiClient.patch<Empleado>(
      `${RESOURCE}/${id}/estado`,
      { estado },
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(
        error,
        'No se pudo cambiar el estado del empleado.',
      ),
    )
  }
}

export const buscarUsuarioPorEmail = async (
  email: string,
): Promise<{ id: number; email: string } | null> => {
  try {
    const { data } = await apiClient.get<{ id: number; email: string } | null>(
      `${RESOURCE}/usuarios/por-email`,
      { params: { email } },
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo consultar el correo.'),
    )
  }
}
