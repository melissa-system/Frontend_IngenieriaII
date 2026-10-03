import apiClient from '../../lib/apiClient';
import { crearErrorApi } from './erroresApi';

const API_URL = 'http://localhost:3000/publicaciones';
const RESOURCE = '/publicaciones';

export interface PublicacionPayload {
  titulo: string;
  contenido: string;
  categoria: string;
  publicado?: boolean;
}

export interface Publicacion extends PublicacionPayload {
  id: string | number;
  publicado: boolean;
  fecha_publicacion: string;
}

export interface PublicacionUpdatePayload {
  titulo?: string;
  contenido?: string;
  categoria?: string;
  publicado?: boolean;
}

export const LIMITES_PUBLICACION = {
  titulo: 120,
  contenido: 400,
  categoria: 40,
};

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return body?.message || body?.error?.message || fallback;
}


// Crea una publicación (usado desde el dashboard administrativo). Rutas de
// administración: van por apiClient para que el interceptor adjunte el
// Access Token (Authorization: Bearer), ya que ahora exigen sesión de admin.
export const crearPublicacion = async (
  payload: PublicacionPayload,
): Promise<Publicacion> => {
  try {
    const { data } = await apiClient.post<Publicacion>(RESOURCE, payload);
    return data;
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo crear la publicación.');
  }
};

// Solo publicaciones visibles, para el landing público
export const obtenerPublicaciones = async (): Promise<Publicacion[]> => {
  const response = await fetch(API_URL);

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      `Error en el servidor: ${response.status}`,
    );
    throw new Error(message);
  }

  return await response.json();
};

// Todas las publicaciones (incl. borradores), para el dashboard administrativo
export const obtenerTodasLasPublicaciones = async (): Promise<Publicacion[]> => {
  try {
    const { data } = await apiClient.get<Publicacion[]>(`${RESOURCE}/todas`);
    return data;
  } catch (error) {
    throw crearErrorApi(error, 'No se pudieron cargar las publicaciones.');
  }
};

// Edita campos y/o cambia el estado publicado/borrador de una publicación existente
export const actualizarPublicacion = async (
  id: string | number,
  payload: PublicacionUpdatePayload,
): Promise<Publicacion> => {
  try {
    const { data } = await apiClient.patch<Publicacion>(
      `${RESOURCE}/${id}`,
      payload,
    );
    return data;
  } catch (error) {
    throw crearErrorApi(error, 'No se pudieron guardar los cambios.');
  }
};
