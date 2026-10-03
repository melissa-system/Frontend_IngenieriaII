import apiClient from '../../lib/apiClient';
import { crearErrorApi } from './erroresApi';

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


// Lectura pública — landing y footer la necesitan sin autenticación. Usa
// apiClient (en vez de fetch a una URL hardcodeada) para tomar el backend
// real de VITE_API_URL — el fetch a localhost:3000 nunca hubiera funcionado
// ya publicado en Netlify (mismo bug que tenía solicitudes.service.ts).
export const obtenerConfiguracion = async (): Promise<Configuracion> => {
  try {
    const { data } = await apiClient.get<Configuracion>(RESOURCE);
    return data;
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo cargar la configuración.');
  }
};

// Actualización — requiere sesión de admin (apiClient adjunta el Bearer token)
export const actualizarConfiguracion = async (
  payload: ConfiguracionUpdatePayload,
): Promise<Configuracion> => {
  try {
    const { data } = await apiClient.patch<Configuracion>(RESOURCE, payload);
    return data;
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo guardar la configuración.');
  }
};
