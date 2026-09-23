import axios from 'axios'
import apiClient from '../../lib/apiClient'

export const IDENTIFICACION_REGEX =
  /^(\d{1}-\d{4}-\d{4}|\d{1}-\d{3}-\d{6}|\d{11,12})$/;
export const TELEFONO_REGEX = /^\d{4}-?\d{4}$/;
export const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function formatearCedula(
  valor: string,
  tipo: 'fisica' | 'juridica',
): string {
  const max = tipo === 'fisica' ? 9 : 10;
  const d = valor.replace(/\D/g, '').slice(0, max);
  if (!d) return '';
  if (tipo === 'fisica') {
    let out = d[0];
    if (d.length > 1) out += '-' + d.slice(1, 5);
    if (d.length > 5) out += '-' + d.slice(5);
    return out;
  }
  let out = d[0];
  if (d.length > 1) out += '-' + d.slice(1, 4);
  if (d.length > 4) out += '-' + d.slice(4);
  return out;
}

export function normalizarIdentificacion(valor: string): string {
  const d = valor.replace(/\D/g, '');
  if (d.length === 9) return `${d[0]}-${d.slice(1, 5)}-${d.slice(5)}`;
  if (d.length === 10) return `${d[0]}-${d.slice(1, 4)}-${d.slice(4)}`;
  return d;
}

// A partir de la cantidad de dígitos determina qué tipo de identificación
// es, para no tener que preguntárselo al usuario aparte (pedido explícito:
// "verificamos con la cedula el dato del usuario, si es fisico o juridico").
export type TipoIdentificacionDetectado = 'fisica' | 'juridica' | 'dimex' | null

export function detectarTipoIdentificacion(
  digitos: string,
): TipoIdentificacionDetectado {
  const len = digitos.length
  if (len === 9) return 'fisica'
  if (len === 10) return 'juridica'
  if (len === 11 || len === 12) return 'dimex'
  return null
}

// Opciones de los selects del formulario — deben coincidir exactamente con
// las listas @IsIn(...) de create-solicitud-paja-agua.dto.ts en el backend.
export const NATURALEZA_INMUEBLE_OPCIONES = [
  'Inmueble inscrito',
  'Parcela agrícola',
  'Zona indígena',
  'Zona marítimo terrestre',
  'Terreno en administración del INDER',
  'Inmueble sin inscribir',
] as const

export const CALIDAD_TITULAR_OPCIONES = [
  'Propietario registral',
  'Poseedor',
  'Autorizado legal',
  'Representante legal',
  'Concesionario, arrendatario o asignatario',
] as const

export const TIPO_SERVICIO_OPCIONES = [
  'Agua potable',
  'Alcantarillado sanitario',
  'Agua potable y alcantarillado sanitario',
] as const

export const TIPO_CONEXION_OPCIONES = [
  'Nueva conexión',
  'Individualización',
  'Independización',
  'Traslado de acometida',
  'Cambio de diámetro',
  'Servicio provisional para proyectos',
  'Servicio temporal',
] as const

export interface SolicitudPajaAguaPayload {
  tipoPersona: string
  nombreSolicitante: string
  identificacion: string
  nombreRepresentante?: string
  cedulaRepresentante?: string
  telefono: string
  telefonoSecundario?: string
  correo: string
  provincia: string
  canton: string
  distrito: string
  direccion: string
  numeroPlano: string
  naturalezaInmueble: string
  calidadTitular: string
  tipoServicio: string
  tipoConexion: string
  observaciones?: string
  permisosMunicipales: File
  cartaSolicitud: File
  cedulaFrente: File
  cedulaDorso: File
}

// Forma en la que el backend devuelve cada solicitud (GET /solicitudes,
// solo Admin) — usada por la vista administrativa para listar y revisar.
export interface SolicitudPajaAgua {
  id: number
  codigo_solicitud: string
  tipo_persona: 'fisica' | 'juridica'
  nombre_solicitante: string
  identificacion: string
  nombre_representante: string | null
  cedula_representante: string | null
  telefono: string
  telefono_secundario: string | null
  correo: string
  provincia: string | null
  canton: string | null
  distrito: string | null
  direccion: string
  numero_plano: string
  naturaleza_inmueble: string | null
  calidad_titular: string | null
  tipo_servicio: string | null
  tipo_conexion: string | null
  observaciones: string | null
  permisos_municipales_path: string | null
  carta_solicitud_path: string | null
  cedula_frente_path: string | null
  cedula_dorso_path: string | null
  estado: 'Pendiente' | 'En proceso' | 'Aprobada' | 'Rechazada' | 'Completada'
  motivo_rechazo: string | null
  fecha_solicitud: string
  empleado: { id: number; nombre: string } | null
  abonado: { id: number; numero_abonado: string } | null
}

export interface ActualizarEstadoSolicitudPajaAguaPayload {
  estado: 'En proceso' | 'Aprobada' | 'Rechazada'
  motivoRechazo?: string
}

// Traduce errores de axios/backend a un mensaje legible, igual que en el
// resto de servicios (abonados.service.ts, etc.)
function obtenerMensajeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Inténtalo más tarde.'
    }
    const msg = error.response?.data?.message
    if (typeof msg === 'string') return msg
    if (Array.isArray(msg)) return msg.join('. ')
  }
  return fallback
}

// Ruta pública (sin sesión) — se usa apiClient de todas formas para que
// tome la URL del backend de VITE_API_URL en vez de tener localhost
// harcodeado (bug que hacía que esta solicitud nunca funcionara ya
// publicada en Netlify).
export const crearSolicitudPajaAgua = async (
  payload: SolicitudPajaAguaPayload,
): Promise<SolicitudPajaAgua> => {
  const formData = new FormData()

  formData.append('tipoPersona', payload.tipoPersona)
  formData.append('nombreSolicitante', payload.nombreSolicitante)
  formData.append('identificacion', payload.identificacion)
  if (payload.nombreRepresentante) {
    formData.append('nombreRepresentante', payload.nombreRepresentante)
  }
  if (payload.cedulaRepresentante) {
    formData.append('cedulaRepresentante', payload.cedulaRepresentante)
  }
  formData.append('telefono', payload.telefono)
  if (payload.telefonoSecundario) {
    formData.append('telefonoSecundario', payload.telefonoSecundario)
  }
  formData.append('correo', payload.correo)
  formData.append('provincia', payload.provincia)
  formData.append('canton', payload.canton)
  formData.append('distrito', payload.distrito)
  formData.append('direccion', payload.direccion)
  formData.append('numeroPlano', payload.numeroPlano)
  formData.append('naturalezaInmueble', payload.naturalezaInmueble)
  formData.append('calidadTitular', payload.calidadTitular)
  formData.append('tipoServicio', payload.tipoServicio)
  formData.append('tipoConexion', payload.tipoConexion)
  if (payload.observaciones) {
    formData.append('observaciones', payload.observaciones)
  }
  formData.append('permisosMunicipales', payload.permisosMunicipales)
  formData.append('cartaSolicitud', payload.cartaSolicitud)
  formData.append('cedulaFrente', payload.cedulaFrente)
  formData.append('cedulaDorso', payload.cedulaDorso)

  try {
    const { data } = await apiClient.post<SolicitudPajaAgua>('/solicitudes', formData)
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(
        error,
        'No se pudo guardar la solicitud en la base de datos. Inténtalo de nuevo.',
      ),
    )
  }
}

// Ruta protegida (solo Admin) — usada por el dashboard administrativo para
// listar las solicitudes y poder revisarlas.
export const obtenerSolicitudesPajaAgua = async (): Promise<SolicitudPajaAgua[]> => {
  try {
    const { data } = await apiClient.get<SolicitudPajaAgua[]>('/solicitudes')
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudieron cargar las solicitudes de paja de agua.'),
    )
  }
}

// Cambio de estado (Marcar en proceso / Aprobar / Rechazar). Al aprobar, el
// backend crea (o vincula) automáticamente el Abonado y le notifica por
// correo los próximos pasos (permisos municipales + solicitud de conexión).
export const cambiarEstadoSolicitudPajaAgua = async (
  id: number,
  payload: ActualizarEstadoSolicitudPajaAguaPayload,
): Promise<SolicitudPajaAgua> => {
  try {
    const { data } = await apiClient.patch<SolicitudPajaAgua>(
      `/solicitudes/${id}/estado`,
      payload,
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo actualizar el estado de la solicitud.'),
    )
  }
}
