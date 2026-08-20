const API_URL = 'http://localhost:3000/averias';

export interface AveriaPayload {
  tipo_averia: string;
  descripcion: string;
  cedula_reportante?: string;
  nombre_reportante?: string;
}

export const crearAveria = async (payload: AveriaPayload) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      cedula_reportante: payload.cedula_reportante || '504420101',
      nombre_reportante: payload.nombre_reportante || 'OSCAR ANDRES AIZA ZUÑIGA',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en el servidor: ${response.status} ${errorText}`);
  }

  return await response.json();
};