const API_URL = 'http://localhost:3000/averias';

export interface AveriaPayload {
  tipo_averia: string;
  descripcion: string;
}

export const crearAveria = async (payload: AveriaPayload) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error en el servidor: ${response.statusText}`);
  }

  return await response.json();
};