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

// ---------------------------------------------------------------------------
// Formato único de errores de la API (PBI 511 / Task 516). El backend
// responde siempre:
//   { statusCode, codigo, message, errores: [{ campo, mensaje }] }
// Estas funciones son la única forma de leer un error en el frontend, para
// que todas las pantallas lo muestren igual.

export interface ErrorDeCampo {
  campo: string;
  mensaje: string;
}

// Error que lanzan los servicios: el mensaje general para el banner y, si el
// backend los envía, los errores por campo para mostrarlos junto al input.
export class ErrorApi extends Error {
  status?: number;
  codigo?: string;
  errores: Record<string, string>;

  constructor(
    mensaje: string,
    opciones: { status?: number; codigo?: string; errores?: Record<string, string> } = {},
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = opciones.status;
    this.codigo = opciones.codigo;
    this.errores = opciones.errores ?? {};
  }
}

const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Inténtalo más tarde.';

// Mensaje legible para el usuario. Acepta también el formato anterior
// (message como arreglo de textos) por compatibilidad.
export function obtenerMensajeError(error: unknown, fallback: string): string {
  if (error instanceof ErrorApi) return error.message;
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') return MENSAJE_SIN_CONEXION;
    const msg = error.response?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (Array.isArray(msg) && msg.length > 0) return msg.join('. ');
  }
  return fallback;
}

// Errores por campo de la respuesta: { cedula: 'La cédula ...', ... }. Si un
// campo trae varios errores se queda el primero.
export function erroresDeRespuesta(error: unknown): Record<string, string> {
  if (error instanceof ErrorApi) return error.errores;
  if (!axios.isAxiosError(error)) return {};
  const lista = error.response?.data?.errores;
  if (!Array.isArray(lista)) return {};
  const porCampo: Record<string, string> = {};
  for (const item of lista as ErrorDeCampo[]) {
    if (item?.campo && item.mensaje && !porCampo[item.campo]) {
      porCampo[item.campo] = item.mensaje;
    }
  }
  return porCampo;
}

// Convierte el error de axios en ErrorApi, conservando mensaje, código y
// errores por campo. Es lo que lanzan todos los servicios.
export function crearErrorApi(error: unknown, fallback: string): ErrorApi {
  return new ErrorApi(obtenerMensajeError(error, fallback), {
    status: axios.isAxiosError(error) ? error.response?.status : undefined,
    codigo: axios.isAxiosError(error) ? error.response?.data?.codigo : undefined,
    errores: erroresDeRespuesta(error),
  });
}

// Para las pantallas: errores por campo de un error ya lanzado por un
// servicio, traducidos a los nombres de campo del formulario cuando difieren
// de los del backend (ej. { cedulaNuevoPropietario: 'cedula' }).
export function erroresPorCampo<K extends string>(
  error: unknown,
  equivalencias: Partial<Record<string, K>> = {},
): Partial<Record<K, string>> {
  const resultado: Partial<Record<K, string>> = {};
  for (const [campo, mensaje] of Object.entries(erroresDeRespuesta(error))) {
    const destino = (equivalencias[campo] ?? campo) as K;
    if (!resultado[destino]) resultado[destino] = mensaje;
  }
  return resultado;
}

// true si el error trae errores por campo: en ese caso cada mensaje se
// muestra junto a su campo y no hace falta repetirlo arriba del formulario.
export function tieneErroresDeCampo(error: unknown): boolean {
  return Object.keys(erroresDeRespuesta(error)).length > 0;
}
