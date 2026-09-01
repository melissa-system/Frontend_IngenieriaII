import apiClient from '../../lib/apiClient';

export interface Usuario {
  id: number;
  email: string;
  role: string;
  role_id: number;
  isActive: boolean;
  createdAt: string;
}

export interface RolDisponible {
  id: number;
  name: string;
  description?: string;
}

export interface CrearUsuarioPayload {
  email: string;
  password: string;
  role_id: number;
}

// Obtener lista completa de usuarios del sistema
export const obtenerUsuarios = async (): Promise<Usuario[]> => {
  try {
    const response = await apiClient.get<Usuario[]>('/usuarios');
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      'No se pudo cargar la lista de usuarios';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
};

// Obtener catálogo de roles disponibles
export const obtenerRolesDisponibles = async (): Promise<RolDisponible[]> => {
  try {
    const response = await apiClient.get<RolDisponible[]>('/usuarios/roles-disponibles');
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      'No se pudieron cargar los roles';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
};

// Crear un nuevo usuario por parte del administrador
export const crearUsuario = async (
  payload: CrearUsuarioPayload,
): Promise<Usuario> => {
  try {
    const response = await apiClient.post<Usuario>('/usuarios', payload);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      'No se pudo registrar el usuario';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
};

// Cambiar estado activo/inactivo de un usuario
export const cambiarEstadoUsuario = async (
  id: number,
  isActive: boolean,
): Promise<Usuario> => {
  try {
    const response = await apiClient.patch<Usuario>(`/usuarios/${id}/estado`, {
      isActive,
    });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      'No se pudo cambiar el estado del usuario';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
};

// Cambiar rol de un usuario
export const cambiarRolUsuario = async (
  id: number,
  role_id: number,
): Promise<Usuario> => {
  try {
    const response = await apiClient.patch<Usuario>(`/usuarios/${id}/rol`, {
      role_id,
    });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      'No se pudo actualizar el rol del usuario';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
};