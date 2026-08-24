import axios from 'axios';
import apiClient from '../../lib/apiClient';

const RESOURCE = '/abonados';

export type TipoAbonado = 'Física' | 'Jurídica';

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
