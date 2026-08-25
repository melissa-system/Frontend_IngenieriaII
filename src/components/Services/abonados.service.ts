import apiClient from '../../lib/apiClient';

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

export const crearAbonado = async (payload: AbonadoPayload): Promise<Abonado> => {
  try {
    const response = await apiClient.post<Abonado>('/abonados', payload);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      'No se pudo crear el abonado';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
};

export const obtenerAbonados = async (): Promise<Abonado[]> => {
  try {
    const response = await apiClient.get<Abonado[]>('/abonados');
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      'No se pudieron cargar los abonados';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
};