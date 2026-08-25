import axios from 'axios';
import apiClient from '../../lib/apiClient';

const RESOURCE = '/abonados';

export type TipoAbonado = 'Física' | 'Jurídica';

// Únicos estados que maneja el sistema para un abonado.
export type EstadoAbonado = 'Activo' | 'Inactivo';

export interface AbonadoPayload {
  tipo_abonado: TipoAbonado;
  nombre_completo: string; // nombre completo (física) o razón social (jurídica)
  nombre_representante_legal?: string; // obligatorio solo si tipo_abonado es 'Jurídica'
  cedula: string; // cédula física o jurídica
  telefono: string;
  correo: string;
  direccion: string;
  numero_plano_catastrado?: string; // opcional, aplica solo a física
}

export interface Abonado extends AbonadoPayload {
  id: string | number;
  numero_abonado: string;
  estado: string;
  fecha_registro: string;
}

// Campos que el formulario de edición puede modificar. El tipo de abonado
// y la cédula NO se envían: el backend no los acepta en el PATCH. El
// estado se envía únicamente desde el control de gestión de estado.
export interface AbonadoUpdatePayload {
  nombre_completo: string; // nombre completo (física) o razón social (jurídica)
  nombre_representante_legal?: string; // solo jurídica
  telefono: string;
  correo: string;
  direccion: string;
  numero_plano_catastrado?: string; // solo física, opcional
  estado?: EstadoAbonado; // gestión Activo/Inactivo
}

// Traduce errores de axios/backend a un mensaje legible, igual que en Login.
function obtenerMensajeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Inténtalo más tarde.';
    }
    const msg = error.response?.data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join('. ');
  }
  return fallback;
}

// Estas rutas requieren sesión de administrador: se usa apiClient (en vez de
// fetch directo) porque su interceptor adjunta automáticamente el Access
// Token (Authorization: Bearer) a cada petición.
export const crearAbonado = async (payload: AbonadoPayload): Promise<Abonado> => {
  try {
    const { data } = await apiClient.post<Abonado>(RESOURCE, payload);
    return data;
  } catch (error) {
    throw new Error(obtenerMensajeError(error, 'No se pudo registrar el abonado.'));
  }
};

export const obtenerAbonados = async (): Promise<Abonado[]> => {
  try {
    const { data } = await apiClient.get<Abonado[]>(RESOURCE);
    return data;
  } catch (error) {
    throw new Error(obtenerMensajeError(error, 'No se pudieron cargar los abonados.'));
  }
};

export const obtenerAbonado = async (id: number | string): Promise<Abonado> => {
  try {
    const { data } = await apiClient.get<Abonado>(`${RESOURCE}/${id}`);
    return data;
  } catch (error) {
    throw new Error(obtenerMensajeError(error, 'No se pudo cargar el abonado.'));
  }
};

export const actualizarAbonado = async (
  id: number | string,
  payload: AbonadoUpdatePayload,
): Promise<Abonado> => {
  try {
    const { data } = await apiClient.patch<Abonado>(
      `${RESOURCE}/${id}`,
      payload,
    );
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudieron guardar los cambios del abonado.'),
    );
  }
};

// Cambia únicamente el estado del abonado (Activo <-> Inactivo) usando
// su ruta específica en el backend: PATCH /abonados/:id/estado.
export const cambiarEstadoAbonado = async (
  id: number | string,
  estado: EstadoAbonado,
): Promise<Abonado> => {
  try {
    const { data } = await apiClient.patch<Abonado>(
      `${RESOURCE}/${id}/estado`,
      { estado },
    );
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo cambiar el estado del abonado.'),
    );
  }
};

// Un registro por cada campo modificado en una edición del abonado.
export interface HistorialAbonado {
  id: number;
  abonado_id: number;
  usuario_email: string;
  campo: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  fecha: string;
}

export const obtenerHistorialAbonado = async (
  id: number | string,
): Promise<HistorialAbonado[]> => {
  try {
    const { data } = await apiClient.get<HistorialAbonado[]>(
      `${RESOURCE}/${id}/historial`,
    );
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo cargar el historial de cambios.'),
    );
  }
};
