import axios from 'axios'
import apiClient from '../../lib/apiClient'

export type EstadoSolicitud = 'pendiente' | 'en_proceso' | 'aprobado' | 'rechazado'

// Reglas de documentos requeridos según el caso (sección VII del formulario
// GNU-42-01-F1). No pretende cubrir cada uno de los escenarios legales al
// detalle, pero sí las combinaciones más comunes de naturaleza del inmueble,
// calidad del titular y tipo de trámite.
export interface ReglaAdjunto {
  tipo: string
  etiqueta: string
  requerido: boolean
}

export function reglasAdjuntos(
  naturalezaInmueble: string | null,
  calidadTitular: string | null,
  tipoTramite: string,
): ReglaAdjunto[] {
  const reglas: ReglaAdjunto[] = [
    {
      tipo: 'identificacion',
      etiqueta: 'Documento de identificación del titular o representante legal',
      requerido: true,
    },
  ]

  const esZonaEspecial = [
    'Zona marítimo terrestre',
    'Zona indígena',
    'Terreno en administración del INDER',
  ].includes(naturalezaInmueble ?? '')
  const esConcesionario = calidadTitular === 'Concesionario, arrendatario o asignatario'
  if (esZonaEspecial || esConcesionario) {
    reglas.push({
      tipo: 'autorizacion_ente',
      etiqueta: 'Autorización del ente correspondiente (concesión, arriendo o asignación)',
      requerido: true,
    })
  }

  if (naturalezaInmueble === 'Inmueble sin inscribir') {
    reglas.push({
      tipo: 'declaracion_jurada',
      etiqueta: 'Declaración jurada de posesión (firmada con dos testigos)',
      requerido: true,
    })
  }

  if (calidadTitular === 'Autorizado legal' || calidadTitular === 'Representante legal') {
    reglas.push({
      tipo: 'poder_especial',
      etiqueta: 'Poder especial, autorización o aval notarial',
      requerido: true,
    })
  }

  if (naturalezaInmueble === 'Inmueble inscrito' || naturalezaInmueble === 'Parcela agrícola') {
    reglas.push({
      tipo: 'plano_agrimensura',
      etiqueta: 'Plano de agrimensura (si no existe plano catastrado)',
      requerido: false,
    })
    reglas.push({
      tipo: 'permiso_municipal',
      etiqueta: 'Permiso municipal de construcción, o declaración jurada que lo sustituya',
      requerido: false,
    })
  }

  if (tipoTramite === 'independizacion') {
    reglas.push({
      tipo: 'acta_asamblea',
      etiqueta: 'Acta de asamblea de condóminos + diseño de sitio',
      requerido: true,
    })
  }

  if (tipoTramite === 'cambio_diametro') {
    reglas.push({
      tipo: 'memoria_calculo',
      etiqueta: 'Memoria de cálculo que justifique el cambio de diámetro',
      requerido: true,
    })
  }

  if (tipoTramite === 'servicio_temporal') {
    reglas.push({
      tipo: 'autorizacion_propietario',
      etiqueta: 'Autorización del propietario del inmueble',
      requerido: true,
    })
    reglas.push({
      tipo: 'disposicion_aguas',
      etiqueta: 'Forma en que dispondrá las aguas residuales generadas',
      requerido: true,
    })
  }

  reglas.push({ tipo: 'otro', etiqueta: 'Otro documento (opcional)', requerido: false })
  return reglas
}

export const SERVICIO_OPCIONES: { value: string; label: string }[] = [
  { value: 'agua_potable', label: 'Agua potable' },
  { value: 'alcantarillado_sanitario', label: 'Alcantarillado sanitario' },
  { value: 'ambos', label: 'Ambos' },
]

export const TIPO_TRAMITE_OPCIONES: { value: string; label: string }[] = [
  { value: 'nueva_conexion', label: 'Nueva conexión' },
  { value: 'individualizacion', label: 'Individualización' },
  { value: 'independizacion', label: 'Independización' },
  { value: 'traslado', label: 'Traslado' },
  { value: 'servicio_provisional_proyectos', label: 'Servicio provisional para proyectos' },
  { value: 'cambio_diametro', label: 'Cambio de diámetro' },
  { value: 'servicio_temporal', label: 'Servicio Temporal' },
]

export const FORMA_PAGO_OPCIONES: { value: string; label: string }[] = [
  { value: 'efectivo_previo', label: 'En efectivo en un solo tracto previo a la conexión' },
  { value: 'incluir_primera_facturacion', label: 'Incluir el monto en la primera facturación' },
]

export const MEDIO_NOTIFICACION_OPCIONES: { value: string; label: string }[] = [
  { value: 'correo', label: 'Correo electrónico' },
  { value: 'direccion', label: 'Dirección física' },
  { value: 'fax', label: 'Fax' },
]

export function etiquetaMedioNotificacion(valor: string): string {
  return MEDIO_NOTIFICACION_OPCIONES.find((o) => o.value === valor)?.label ?? valor
}
export function etiquetaServicioSolicitado(valor: string): string {
  return SERVICIO_OPCIONES.find((o) => o.value === valor)?.label ?? valor
}
export function etiquetaTipoTramite(valor: string): string {
  return TIPO_TRAMITE_OPCIONES.find((o) => o.value === valor)?.label ?? valor
}
export function etiquetaFormaPago(valor: string): string {
  return FORMA_PAGO_OPCIONES.find((o) => o.value === valor)?.label ?? valor
}

export interface SolicitudPajaAguaDisponible {
  id: number
  codigo_solicitud: string
  nombre_solicitante: string
  identificacion: string
  tipo_persona: 'fisica' | 'juridica'
  telefono: string
  correo: string
  provincia: string | null
  canton: string | null
  distrito: string | null
  direccion: string
  naturaleza_inmueble: string | null
  calidad_titular: string | null
  tipo_servicio: string | null
  tipo_conexion: string | null
}

export interface AdjuntoConexion {
  tipo: string
  etiqueta: string
  url: string
  publicId: string
}

export interface SolicitudConexion {
  id: number
  codigo_solicitud: string
  id_abonado: number
  numero_abonado: string
  nombre_abonado: string
  cedula: string
  correo: string
  estado: EstadoSolicitud
  solicitud_paja_agua_codigo: string
  tipo_persona: 'fisica' | 'juridica'
  nombre_solicitante: string
  identificacion_solicitante: string
  telefono_solicitante: string
  provincia: string | null
  canton: string | null
  distrito: string | null
  direccion_inmueble: string
  naturaleza_inmueble: string | null
  calidad_titular: string | null
  medio_notificacion_principal: string
  valor_notificacion_principal: string
  medio_notificacion_secundario: string | null
  valor_notificacion_secundario: string | null
  folio_real: string | null
  plano_catastro: string | null
  plano_agrimensura: string | null
  numero_disponibilidad: string
  numero_nis: string | null
  servicio_solicitado: string
  tipo_tramite: string
  codigo_apc_cfia: string | null
  forma_pago: string
  nombre_firmante: string
  identificacion_firmante: string
  firma_path: string
  adjuntos: AdjuntoConexion[]
  motivo_rechazo: string | null
  id_empleado: number | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface CrearSolicitudConexionPayload {
  idSolicitudPajaAgua?: number
  medioNotificacionPrincipal: string
  valorNotificacionPrincipal: string
  medioNotificacionSecundario?: string
  valorNotificacionSecundario?: string
  folioReal?: string
  planoCatastro?: string
  planoAgrimensura?: string
  numeroDisponibilidad: string
  numeroNis?: string
  servicioSolicitado: string
  tipoTramite: string
  codigoApcCfia?: string
  formaPago: string
  nombreFirmante: string
  identificacionFirmante: string
  firma: File
  adjuntos: { tipo: string; etiqueta: string; archivo: File }[]
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

export const obtenerSolicitudesPajaAguaDisponibles = async (): Promise<
  SolicitudPajaAguaDisponible[]
> => {
  try {
    const { data } = await apiClient.get<SolicitudPajaAguaDisponible[]>(
      '/solicitudes/conexion-paja-agua/disponibles',
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudieron cargar tus solicitudes disponibles.'),
    )
  }
}

export const obtenerSolicitudesConexion = async (): Promise<SolicitudConexion[]> => {
  try {
    const { data } = await apiClient.get<SolicitudConexion[]>('/solicitudes/conexion-paja-agua')
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudieron cargar las solicitudes de conexión.'),
    )
  }
}

export const crearSolicitudConexion = async (
  payload: CrearSolicitudConexionPayload,
): Promise<SolicitudConexion> => {
  const formData = new FormData()
  if (payload.idSolicitudPajaAgua) {
    formData.append('idSolicitudPajaAgua', String(payload.idSolicitudPajaAgua))
  }
  formData.append('medioNotificacionPrincipal', payload.medioNotificacionPrincipal)
  formData.append('valorNotificacionPrincipal', payload.valorNotificacionPrincipal)
  if (payload.medioNotificacionSecundario) {
    formData.append('medioNotificacionSecundario', payload.medioNotificacionSecundario)
  }
  if (payload.valorNotificacionSecundario) {
    formData.append('valorNotificacionSecundario', payload.valorNotificacionSecundario)
  }
  if (payload.folioReal) formData.append('folioReal', payload.folioReal)
  if (payload.planoCatastro) formData.append('planoCatastro', payload.planoCatastro)
  if (payload.planoAgrimensura) formData.append('planoAgrimensura', payload.planoAgrimensura)
  formData.append('numeroDisponibilidad', payload.numeroDisponibilidad)
  if (payload.numeroNis) formData.append('numeroNis', payload.numeroNis)
  formData.append('servicioSolicitado', payload.servicioSolicitado)
  formData.append('tipoTramite', payload.tipoTramite)
  if (payload.codigoApcCfia) formData.append('codigoApcCfia', payload.codigoApcCfia)
  formData.append('formaPago', payload.formaPago)
  formData.append('nombreFirmante', payload.nombreFirmante)
  formData.append('identificacionFirmante', payload.identificacionFirmante)
  formData.append('firma', payload.firma, 'firma.png')

  const meta = payload.adjuntos.map((a) => ({ tipo: a.tipo, etiqueta: a.etiqueta }))
  formData.append('adjuntosMeta', JSON.stringify(meta))
  payload.adjuntos.forEach((a) => formData.append('adjuntos', a.archivo))

  try {
    const { data } = await apiClient.post<SolicitudConexion>(
      '/solicitudes/conexion-paja-agua',
      formData,
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo guardar la solicitud de conexión.'),
    )
  }
}

export const cambiarEstadoSolicitudConexion = async (
  id: number,
  payload: { estado: 'en_proceso' | 'aprobado' | 'rechazado'; motivoRechazo?: string },
): Promise<SolicitudConexion> => {
  try {
    const { data } = await apiClient.patch<SolicitudConexion>(
      `/solicitudes/conexion-paja-agua/${id}/estado`,
      payload,
    )
    return data
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'No se pudo actualizar el estado de la solicitud.'),
    )
  }
}
