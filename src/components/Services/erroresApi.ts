import axios from 'axios';

// Forma exacta que el backend responde cuando una cédula ya existe en la
// "otra" tabla (Abonado <-> Empleado) y se puede resolver confirmando que es
// la misma persona, en vez de bloquear la operación (ver
// AbonadosService.create / EmpleadosService.verificarCedulaNoUsadaPorAbonado).
export interface RequiereConfirmacionInfo {
  tipo: 'empleado' | 'abonado';
  registro: { id: number | string; nombre: string };
  message: string;
}

// Error dedicado para que los formularios puedan distinguir este caso (y
// mostrar un diálogo de confirmación) de un error genérico de validación.
export class RequiereConfirmacionError extends Error {
  info: RequiereConfirmacionInfo;

  constructor(info: RequiereConfirmacionInfo) {
    super(info.message);
    this.name = 'RequiereConfirmacionError';
    this.info = info;
  }
}

// Si el error de axios trae { requiereConfirmacion: true, tipo, registro,
// message } en el body, lo extrae; si no, devuelve null.
export function extraerRequiereConfirmacion(
  error: unknown,
): RequiereConfirmacionInfo | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data;
  if (data && typeof data === 'object' && data.requiereConfirmacion === true) {
    return {
      tipo: data.tipo,
      registro: data.registro,
      message: data.message,
    };
  }
  return null;
}
