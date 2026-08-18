const API_URL = 'http://localhost:3000/abonados';

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

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return body?.message || body?.error?.message || fallback;
}

export const crearAbonado = async (payload: AbonadoPayload): Promise<Abonado> => {
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

export const obtenerAbonados = async (): Promise<Abonado[]> => {
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
