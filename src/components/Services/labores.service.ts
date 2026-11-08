import apiClient from '../../lib/apiClient'
import { crearErrorApi } from './erroresApi'

const RESOURCE = '/labores'

// Debe coincidir con ESTADOS_LABOR del backend.
export const ESTADOS_LABOR = [
  'Pendiente',
  'En proceso',
  'En revisión',
  'Finalizado',
] as const
export type EstadoLabor = (typeof ESTADOS_LABOR)[number]

// Tipos de actividad de una labor adicional (subconjunto de TipoActividad:
// no incluye "atención de avería").
export const TIPOS_LABOR = [
  'reparacion',
  'instalacion',
  'mantenimiento',
  'otro',
] as const
export type TipoLabor = (typeof TIPOS_LABOR)[number]

// Copia de los datos operativos de la solicitud que originó la labor. La arma
// el backend al aprobar una solicitud de conexión o de cambio de medidor.
export interface DatosSolicitudLabor {
  codigo_solicitud: string
  tipo_solicitud: string
  abonado: {
    nombre: string
    numero_abonado: string
    cedula: string
    telefono: string
  }
  direccion: string
  numero_nis: string | null
}

export interface LaborBackend {
  id: number
  codigo_labor: string
  tipo_actividad: TipoLabor
  descripcion: string
  estado: EstadoLabor
  empleado: { id: number; nombre: string; puesto?: string } | null
  gestion_iniciada_en: string | null
  gestion_finalizada_en: string | null
  devuelta_revision: boolean
  motivo_revision: string | null
  // 'solicitud' cuando se generó al aprobar una solicitud (conexión o cambio
  // de medidor); 'manual' cuando la creó la administración.
  origen: 'manual' | 'solicitud'
  id_solicitud: number | null
  datos_solicitud: DatosSolicitudLabor | null
  fecha_creacion: string
}

export type LaborFinalizada = LaborBackend & { duracion_minutos: number }

export interface CrearLaborPayload {
  tipoActividad: TipoLabor
  descripcion: string
  empleadoId?: number
}

export interface ActualizarLaborPayload {
  tipoActividad?: TipoLabor
  descripcion?: string
  empleadoId?: number
  estado?: EstadoLabor
  observacion?: string
}

export interface FiltrosLabores {
  estado?: EstadoLabor
  empleadoId?: number
  tipoActividad?: TipoLabor
}

export const crearLabor = async (
  payload: CrearLaborPayload,
): Promise<LaborBackend> => {
  try {
    const { data } = await apiClient.post<LaborBackend>(RESOURCE, payload)
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo crear la labor adicional.')
  }
}

export const obtenerLabores = async (
  filtros: FiltrosLabores = {},
): Promise<LaborBackend[]> => {
  const params: Record<string, string | number> = {}
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === '') continue
    params[clave] = valor as string | number
  }
  try {
    const { data } = await apiClient.get<LaborBackend[]>(RESOURCE, { params })
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudieron cargar las labores.')
  }
}

export const obtenerLabor = async (id: number): Promise<LaborBackend> => {
  try {
    const { data } = await apiClient.get<LaborBackend>(`${RESOURCE}/${id}`)
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo cargar la labor.')
  }
}

export const actualizarLabor = async (
  id: number,
  payload: ActualizarLaborPayload,
): Promise<LaborBackend> => {
  try {
    const { data } = await apiClient.patch<LaborBackend>(
      `${RESOURCE}/${id}`,
      payload,
    )
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo actualizar la labor.')
  }
}

export const obtenerMisLabores = async (): Promise<LaborBackend[]> => {
  try {
    const { data } = await apiClient.get<LaborBackend[]>(
      `${RESOURCE}/mis-labores`,
    )
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudieron cargar tus labores asignadas.')
  }
}

export const iniciarGestionLabor = async (
  id: number,
): Promise<LaborBackend> => {
  try {
    const { data } = await apiClient.patch<LaborBackend>(
      `${RESOURCE}/${id}/iniciar-gestion`,
    )
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo iniciar la gestión de la labor.')
  }
}

export const terminarGestionLabor = async (
  id: number,
): Promise<LaborFinalizada> => {
  try {
    const { data } = await apiClient.patch<LaborFinalizada>(
      `${RESOURCE}/${id}/terminar-gestion`,
    )
    return data
  } catch (error) {
    throw crearErrorApi(error, 'No se pudo terminar la gestión de la labor.')
  }
}
