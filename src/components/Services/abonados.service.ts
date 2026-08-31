import axios from 'axios';
import apiClient from '../../lib/apiClient';

const RESOURCE = '/abonados';

export type TipoAbonado = 'Física' | 'Jurídica';

// Únicos estados que maneja el sistema para un abonado.
export type EstadoAbonado = 'Activo' | 'Inactivo';

export interface AbonadoPayload {
  tipo_abonado: TipoAbonado;
  nombre: string; // nombre de pila (física) o razón social (jurídica)
  // Solo física (obligatorio apellido1 si tipo_abonado es 'Física')
  apellido1?: string;
  apellido2?: string;
  numero_plano_catastrado?: string;
  // Solo jurídica (obligatorios si tipo_abonado es 'Jurídica')
  nombre_representante_legal?: string;
  cedula_representante?: string;
  cedula: string; // cédula física o jurídica
  telefono: string;
  correo: string;
  direccion: string;
}

export interface Abonado extends AbonadoPayload {
  id: string | number;
  numero_abonado: string;
  estado: string;
  fecha_registro: string;
  usuario_id: number | string | null;
}

// Nombre completo para mostrar en listas/tablas: concatena nombre +
// apellidos si son física, o solo el nombre (razón social) si es jurídica.
export function nombreVisible(abonado: Pick<Abonado, 'nombre' | 'apellido1' | 'apellido2'>): string {
  return [abonado.nombre, abonado.apellido1, abonado.apellido2]
    .filter((parte) => parte && parte.trim() !== '')
    .join(' ');
}

// Campos que el formulario de edición puede modificar. El tipo de abonado
// y la cédula NO se envían: el backend no los acepta en el PATCH. El
// estado se envía únicamente desde el control de gestión de estado.
export interface AbonadoUpdatePayload {
  nombre: string; // nombre de pila (física) o razón social (jurídica)
  apellido1?: string;
  apellido2?: string;
  numero_plano_catastrado?: string;
  nombre_representante_legal?: string;
  cedula_representante?: string;
  telefono: string;
  correo: string;
  direccion: string;
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
