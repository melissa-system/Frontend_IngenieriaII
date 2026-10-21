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

// --- Aviso de configuración actualizada ---
// El footer y la sección Ubicación leen la configuración una sola vez al
// montarse, así que un cambio guardado desde el dashboard (horario, contacto)
// no se veía en la parte pública hasta recargar la página. Al guardar se
// avisa con un evento de window (misma pestaña) y con una marca en
// localStorage, que dispara el evento `storage` en las OTRAS pestañas abiertas
// del sitio. Ver hooks/useConfiguracion.ts.
const EVENTO_CONFIGURACION_ACTUALIZADA = 'siapb:configuracion-actualizada';
const CLAVE_CONFIGURACION_ACTUALIZADA = 'siapb:configuracion-actualizada';

function notificarConfiguracionActualizada(config: Configuracion): void {
  window.dispatchEvent(
    new CustomEvent<Configuracion>(EVENTO_CONFIGURACION_ACTUALIZADA, { detail: config }),
  );
  try {
    localStorage.setItem(CLAVE_CONFIGURACION_ACTUALIZADA, String(Date.now()));
  } catch {
    // Sin localStorage (modo privado, bloqueado) solo se pierde el aviso a
    // otras pestañas; esas igual se refrescan al volver a enfocarse.
  }
}

// Suscribe a cambios guardados de la configuración. `config` trae la
// configuración nueva cuando el cambio viene de esta misma pestaña; si viene
// de otra pestaña llega null y quien escucha debe volver a pedirla.
export function alActualizarConfiguracion(
  oyente: (config: Configuracion | null) => void,
): () => void {
  const enEstaPestana = (e: Event) => {
    oyente((e as CustomEvent<Configuracion>).detail ?? null);
  };
  const enOtraPestana = (e: StorageEvent) => {
    if (e.key === CLAVE_CONFIGURACION_ACTUALIZADA) oyente(null);
  };
  window.addEventListener(EVENTO_CONFIGURACION_ACTUALIZADA, enEstaPestana);
  window.addEventListener('storage', enOtraPestana);
  return () => {
    window.removeEventListener(EVENTO_CONFIGURACION_ACTUALIZADA, enEstaPestana);
    window.removeEventListener('storage', enOtraPestana);
  };
}


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
    notificarConfiguracionActualizada(data);
    return data;
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo guardar la configuración.');
  }
};
