import axios, { type AxiosProgressEvent } from 'axios';
import apiClient from '../../lib/apiClient';

const RESOURCE = '/documentos';

// Mismo criterio que apiClient.ts para resolver la URL base del backend.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// El backend expone uploads/ como archivos estáticos (ver main.ts), así que
// el archivo de un documento queda accesible en esta URL.
export function obtenerUrlArchivo(ubicacion: string): string {
  return `${API_BASE_URL}/uploads/documentos/${ubicacion}`;
}

// Debe coincidir exactamente con el catálogo TipoDocumento del backend
// (ver Backend_IngeII/src/modules/documentos/enums/documento.enums.ts)
export const TIPOS_DOCUMENTO = [
  'Actas',
  'Informes',
  'Mediciones en el acueducto',
  'Comunicados',
  'Otros',
] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

// Debe coincidir con VisibilidadDocumento del backend
export const VISIBILIDADES_DOCUMENTO = ['Interno', 'Público'] as const;
export type VisibilidadDocumento = (typeof VISIBILIDADES_DOCUMENTO)[number];

// Tipos de archivo aceptados por el backend (ver ALLOWED_MIME_TYPES en
// documentos.controller.ts). Se repite acá para que el input de archivo
// filtre lo mismo antes de intentar subirlo.
export const ACCEPT_DOCUMENTO =
  '.pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png';

export const MAX_DOCUMENTO_MB = 10;

export interface Documento {
  id: string | number;
  nombre: string;
  tipo: TipoDocumento;
  version: number;
  ubicacion: string;
  visibilidad: VisibilidadDocumento;
  estado: 'Vigente' | 'Inhabilitado';
  fecha_carga: string;
}

export interface CrearDocumentoPayload {
  nombre: string;
  tipo: TipoDocumento;
  visibilidad: VisibilidadDocumento;
  archivo: File;
}

export interface ActualizarDocumentoPayload {
  nombre?: string;
  visibilidad?: VisibilidadDocumento;
  estado?: 'Vigente' | 'Inhabilitado';
}

// Traduce errores de axios/backend a un mensaje legible, igual que en Login/Abonados.
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

// Sube un documento nuevo (o una nueva versión de uno existente, si coincide
// nombre + tipo con un documento vigente). Usa apiClient para que el
// interceptor adjunte el Access Token, y reporta el progreso de la subida
// vía onProgress (0-100) para poder mostrar una barra de carga.
export const crearDocumento = async (
  payload: CrearDocumentoPayload,
  onProgress?: (porcentaje: number) => void,
): Promise<Documento> => {
  const formData = new FormData();
  formData.append('nombre', payload.nombre);
  formData.append('tipo', payload.tipo);
  formData.append('visibilidad', payload.visibilidad);
  formData.append('archivo', payload.archivo);

  try {
    const { data } = await apiClient.post<Documento>(RESOURCE, formData, {
      // Sin header de Content-Type manual: axios/el navegador debe generar
      // el boundary automáticamente a partir del FormData. Si se fija
      // 'multipart/form-data' a mano sin boundary, multer no puede parsear
      // el body en el backend.
      onUploadProgress: (evento: AxiosProgressEvent) => {
        if (!onProgress || !evento.total) return;
        onProgress(Math.round((evento.loaded / evento.total) * 100));
      },
    });
    return data;
  } catch (error) {
    throw new Error(obtenerMensajeError(error, 'No se pudo subir el documento.'));
  }
};

export const obtenerDocumentos = async (): Promise<Documento[]> => {
  try {
    const { data } = await apiClient.get<Documento[]>(RESOURCE);
    return data;
  } catch (error) {
    throw new Error(obtenerMensajeError(error, 'No se pudieron cargar los documentos.'));
  }
};

export const actualizarDocumento = async (
  id: string | number,
  payload: ActualizarDocumentoPayload,
): Promise<Documento> => {
  try {
    const { data } = await apiClient.patch<Documento>(`${RESOURCE}/${id}`, payload);
    return data;
  } catch (error) {
    throw new Error(obtenerMensajeError(error, 'No se pudo actualizar el documento.'));
  }
};
