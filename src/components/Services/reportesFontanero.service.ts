import axios from 'axios'
import apiClient from '../../lib/apiClient'

const RESOURCE = '/reportes-fontanero'

// Debe coincidir con el enum TipoActividad del backend.
export const TIPOS_ACTIVIDAD = [
  'reparacion',
  'instalacion',
  'mantenimiento',
  'atencion_averia',
  'otro',
] as const
export type TipoActividad = (typeof TIPOS_ACTIVIDAD)[number]

export const ETIQUETA_ACTIVIDAD: Record<TipoActividad, string> = {
  reparacion: 'Reparación',
  instalacion: 'Instalación',
  mantenimiento: 'Mantenimiento',
  atencion_averia: 'Atención de avería',
  otro: 'Otro',
}

export interface MaterialUtilizado {
  id: number
  articulo_id: number | null
  nombre_articulo: string
  cantidad: number
}

export interface ReporteFontanero {
  id: number
  empleado_id: number
  empleado?: { id: number; nombre: string; puesto: string }
  tipo_actividad: TipoActividad
  descripcion: string
  fecha_trabajo: string
  tiempo_minutos: number
  averia_id: number | null
  averia?: { id: number; codigo_averia: string } | null
  /** Texto libre con los materiales usados (flujo actual). */
  materiales_texto?: string | null
  /** Materiales vinculados a inventario (solo reportes antiguos). */
  materiales: MaterialUtilizado[]
  fecha_registro: string
}

export interface CrearReportePayload {
  tipoActividad: TipoActividad
  descripcion: string
  fechaTrabajo: string
  tiempoMinutos: number
  averiaId?: number
  materialesTexto?: string
}

export interface FiltrosReportes {
  empleadoId?: number
  tipoActividad?: TipoActividad
  desde?: string
  hasta?: string
  pagina?: number
  limite?: number
}

export interface RespuestaReportes {
  datos: ReporteFontanero[]
  total: number
  pagina: number
  limite: number
}

function obtenerMensajeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Inténtalo más tarde.'
    }
    const msg = error.response?.data?.message
    if (typeof msg === 'string') return msg
    if (Array.isArray(msg)) return msg.join('. ')
  }
  return fallback
}

// Convierte minutos a un texto legible: 105 -> "1 h 45 min".
export function formatearTiempo(minutos: number): string {
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (horas === 0) return `${resto} min`
  if (resto === 0) return `${horas} h`
  return `${horas} h ${resto} min`
}

export const crearReporte = async (
  payload: CrearReportePayload,
): Promise<ReporteFontanero> => {
  try {
    const { data } = await apiClient.post<ReporteFontanero>(RESOURCE, payload)
    return data
  } catch (error) {
    throw new Error(obtenerMensajeError(error, 'No se pudo guardar el reporte.'))
  }
}

// Reportes del fontanero autenticado (su propia pantalla).
export const obtenerMisReportes = async (): Promise<ReporteFontanero[]> => {
  try {
    const { data } = await apiClient.get<ReporteFontanero[]>(`${RESOURCE}/mis-reportes`)
    return data
  } catch (error) {
    throw new Error(obtenerMensajeError(error, 'No se pudieron cargar tus reportes.'))
  }
}

// Consulta administrativa con filtros. Los filtros vacíos se omiten para no
// mandar `?tipoActividad=` al backend, que lo rechazaría por no ser un valor
// válido del enum.
export const obtenerReportes = async (
  filtros: FiltrosReportes = {},
): Promise<RespuestaReportes> => {
  const params: Record<string, string | number> = {}
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === null || valor === '') continue
    params[clave] = valor as string | number
  }

  try {
    const { data } = await apiClient.get<RespuestaReportes>(RESOURCE, { params })
    return data
  } catch (error) {
    throw new Error(obtenerMensajeError(error, 'No se pudieron cargar los reportes.'))
  }
}

export const obtenerReporte = async (id: number): Promise<ReporteFontanero> => {
  try {
    const { data } = await apiClient.get<ReporteFontanero>(`${RESOURCE}/${id}`)
    return data
  } catch (error) {
    throw new Error(obtenerMensajeError(error, 'No se pudo cargar el reporte.'))
  }
}
