import apiClient from '../../lib/apiClient'
import { crearErrorApi } from './erroresApi'

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

// Debe coincidir con el enum EstadoRevisionReporte del backend. La resolución
// de una avería la aprueba o rechaza la administración, no el fontanero.
export const ESTADOS_REVISION = ['Pendiente', 'Aprobado', 'Rechazado'] as const
export type EstadoRevision = (typeof ESTADOS_REVISION)[number]

export const ETIQUETA_REVISION: Record<EstadoRevision, string> = {
  Pendiente: 'Pendiente',
  Aprobado: 'Aprobado',
  Rechazado: 'Rechazado',
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
  labor_id?: number | null
  labor?: { id: number; codigo_labor: string; tipo_actividad: TipoActividad } | null
  /** Texto libre con los materiales usados (flujo actual). */
  materiales_texto?: string | null
  /** Materiales vinculados a inventario (solo reportes antiguos). */
  materiales: MaterialUtilizado[]
  /** Estado de revisión de la administración sobre la resolución de la avería. */
  estado_revision: EstadoRevision
  /** URL de la evidencia opcional (imagen) subida por el fontanero. */
  evidencia_url?: string | null
  /** Nombre original del archivo de evidencia. */
  evidencia_nombre?: string | null
  /** Cuántas veces se reenvió el reporte tras un rechazo. */
  reintentos: number
  fecha_registro: string
}

export interface CrearReportePayload {
  tipoActividad: TipoActividad
  descripcion: string
  fechaTrabajo: string
  tiempoMinutos: number
  averiaId?: number
  laborId?: number
  materialesTexto?: string
  /** Evidencia opcional (una imagen), máximo 5 MB. */
  evidencia?: File
}

export interface FiltrosReportes {
  empleadoId?: number
  tipoActividad?: TipoActividad
  estadoRevision?: EstadoRevision
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
    // Multipart para poder adjuntar la evidencia opcional junto a los campos.
    const formData = new FormData()
    formData.append('tipoActividad', payload.tipoActividad)
    formData.append('descripcion', payload.descripcion)
    formData.append('fechaTrabajo', payload.fechaTrabajo)
    formData.append('tiempoMinutos', String(payload.tiempoMinutos))
    if (payload.averiaId !== undefined) {
      formData.append('averiaId', String(payload.averiaId))
    }
    if (payload.laborId !== undefined) {
      formData.append('laborId', String(payload.laborId))
    }
    if (payload.materialesTexto) {
      formData.append('materialesTexto', payload.materialesTexto)
    }
    if (payload.evidencia) {
      formData.append('evidencia', payload.evidencia)
    }

    const { data } = await apiClient.post<ReporteFontanero>(
      RESOURCE,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo guardar el reporte.')
  }
}

// Reportes del fontanero autenticado (su propia pantalla).
export const obtenerMisReportes = async (): Promise<ReporteFontanero[]> => {
  try {
    const { data } = await apiClient.get<ReporteFontanero[]>(`${RESOURCE}/mis-reportes`)
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudieron cargar tus reportes.')
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
    throw crearErrorApi(error, 'No se pudieron cargar los reportes.')
  }
}

export const obtenerReporte = async (id: number): Promise<ReporteFontanero> => {
  try {
    const { data } = await apiClient.get<ReporteFontanero>(`${RESOURCE}/${id}`)
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo cargar el reporte.')
  }
}

// La administración aprueba o rechaza la resolución de la avería a partir del
// reporte del fontanero.
export const revisarReporte = async (
  id: number,
  aprobado: boolean,
  observacion?: string,
): Promise<ReporteFontanero> => {
  try {
    const { data } = await apiClient.patch<ReporteFontanero>(
      `${RESOURCE}/${id}/revision`,
      { aprobado, observacion },
    )
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo registrar la revisión del reporte.')
  }
}
