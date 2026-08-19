const API_URL = 'http://localhost:3000/publicaciones';

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

// Crea una publicación (usado desde el dashboard administrativo)
export const crearPublicacion = async (
  payload: PublicacionPayload,
): Promise<Publicacion> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      `Error en el servidor: ${response.status}`,
    );
    throw new Error(message);
  }

  return await response.json();
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
  const response = await fetch(`${API_URL}/todas`);

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      `Error en el servidor: ${response.status}`,
    );
    throw new Error(message);
  }

  return await response.json();
};

// Edita campos y/o cambia el estado publicado/borrador de una publicación existente
export const actualizarPublicacion = async (
  id: string | number,
  payload: PublicacionUpdatePayload,
): Promise<Publicacion> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      `Error en el servidor: ${response.status}`,
    );
    throw new Error(message);
  }

  return await response.json();
};
