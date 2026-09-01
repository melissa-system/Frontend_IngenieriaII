import axios from 'axios';
import apiClient from '../../lib/apiClient';

const API_URL = 'http://localhost:3000/configuracion';
const RESOURCE = '/configuracion';

export interface Configuracion {
  id: number;
  direccion: string;
  telefono: string;
  correo_electronico: string;
  enlace_google_maps: string;
  coordenadas_mapa: string;
  telefono_miembro_junta_1: string;
  telefono_miembro_junta_2: string;
  horario_lunes_viernes: string;
  horario_sabado: string;
  horario_domingo: string;
  created_at: string;
  updated_at: string;
}

export type ConfiguracionUpdatePayload = Partial<
  Omit<Configuracion, 'id' | 'created_at' | 'updated_at'>
>;

function obtenerMensajeErrorAxios(error: unknown, fallback: string): string {
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

// Lectura pública — landing y footer la necesitan sin autenticación
export const obtenerConfiguracion = async (): Promise<Configuracion> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(
      `Error al cargar la configuración: ${response.status}`,
    );
  }
  return await response.json();
};

// Actualización — requiere sesión de admin (apiClient adjunta el Bearer token)
export const actualizarConfiguracion = async (
  payload: ConfiguracionUpdatePayload,
): Promise<Configuracion> => {
  try {
    const { data } = await apiClient.patch<Configuracion>(RESOURCE, payload);
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeErrorAxios(error, 'No se pudo guardar la configuración.'),
    );
  }
};
