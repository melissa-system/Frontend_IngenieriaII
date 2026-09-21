import axios from 'axios'
import apiClient from '../../lib/apiClient'

const RESOURCE = '/bitacora'

// Deben coincidir exactamente con los enums del backend
// (Backend_IngeII/src/modules/bitacora/entities/bitacora.enums.ts)
export const MODULOS_BITACORA = [
  'abonados',
  'solicitudes',
  'averias',
  'inventario',
  'usuarios',
  'empleados',
  'documentos',
  'publicaciones',
  'configuracion',
] as const
export type ModuloBitacora = (typeof MODULOS_BITACORA)[number]

// Subconjunto que HOY registra movimientos en la auditoría. MODULOS_BITACORA
// tiene todos los que el backend acepta; este es el que se ofrece en el
// filtro de la pantalla, para no mostrar opciones que siempre devuelven
// vacío y parecen un error del sistema.
//
// Cuando un módulo nuevo empiece a llamar a BitacoraService en el backend,
// basta con agregarlo acá para que aparezca en el filtro.
export const MODULOS_CON_MOVIMIENTOS = [
  'abonados',
  'solicitudes',
  'averias',
  'inventario',
  'documentos',
  'empleados',
  'publicaciones',
  'configuracion',
  'usuarios',
] as const satisfies readonly ModuloBitacora[]

export const ACCIONES_BITACORA = [
  'creacion',
  'edicion',
  'cambio_estado',
  'eliminacion',
] as const
export type AccionBitacora = (typeof ACCIONES_BITACORA)[number]

// Etiquetas legibles para la tabla; los valores crudos vienen en snake_case
// desde la base de datos.
export const ETIQUETA_MODULO: Record<ModuloBitacora, string> = {
  abonados: 'Abonados',
  solicitudes: 'Solicitudes',
  averias: 'Averías',
  inventario: 'Inventario',
  usuarios: 'Usuarios',
  empleados: 'Empleados',
  documentos: 'Documentos',
  publicaciones: 'Publicaciones',
  configuracion: 'Configuración',
}

export const ETIQUETA_ACCION: Record<AccionBitacora, string> = {
  creacion: 'Creación',
  edicion: 'Edición',
  cambio_estado: 'Cambio de estado',
  eliminacion: 'Eliminación',
}

export interface RegistroBitacora {
  id: number
  modulo: ModuloBitacora
  registro_id: number
  accion: AccionBitacora
  usuario_email: string | null
  campo: string | null
  valor_anterior: string | null
  valor_nuevo: string | null
  observaciones: string | null
  fecha: string
  usuario: { id: number; email: string } | null
}

export interface FiltrosBitacora {
  modulo?: ModuloBitacora
  registro_id?: number
  accion?: AccionBitacora
  usuario_id?: number
  desde?: string
  hasta?: string
  pagina?: number
  limite?: number
}

export interface RespuestaBitacora {
  datos: RegistroBitacora[]
  total: number
  pagina: number
  limite: number
}

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

// Consulta general con filtros y paginación. Los filtros vacíos se omiten
// para no mandar `?modulo=&accion=` al backend, que los rechazaría por no
// ser valores válidos del enum.
export const obtenerBitacora = async (
  filtros: FiltrosBitacora = {},
): Promise<RespuestaBitacora> => {
  const params: Record<string, string | number> = {}
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === null || valor === '') continue
    params[clave] = valor as string | number
  }

  try {
    const { data } = await apiClient.get<RespuestaBitacora>(RESOURCE, { params })
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo cargar la bitácora.'),
    )
  }
}

// Historial completo de un registro concreto ("¿qué le pasó a este abonado?").
// Pensado para una pestaña de historial dentro del detalle de cada registro.
export const obtenerHistorialDeRegistro = async (
  modulo: ModuloBitacora,
  registroId: number,
): Promise<RegistroBitacora[]> => {
  try {
    const { data } = await apiClient.get<RegistroBitacora[]>(
      `${RESOURCE}/${modulo}/${registroId}`,
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo cargar el historial.'),
    )
  }
}