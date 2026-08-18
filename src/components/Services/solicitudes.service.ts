const API_URL = 'http://localhost:3000/solicitudes';

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

export interface SolicitudPajaAguaPayload {
  tipoPersona: string
  nombreSolicitante: string
  identificacion: string
  nombreRepresentante?: string
  cedulaRepresentante?: string
  telefono: string
  correo: string
  direccion: string
  numeroPlano: string
  observaciones?: string
  permisosMunicipales: File
  cartaSolicitud: File
}

export const crearSolicitudPajaAgua = async (payload: SolicitudPajaAguaPayload) => {
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
  formData.append('correo', payload.correo)
  formData.append('direccion', payload.direccion)
  formData.append('numeroPlano', payload.numeroPlano)
  if (payload.observaciones) {
    formData.append('observaciones', payload.observaciones)
  }
  formData.append('permisosMunicipales', payload.permisosMunicipales)
  formData.append('cartaSolicitud', payload.cartaSolicitud)

  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let mensaje = `El servidor respondió con estado ${response.status}. Inténtalo de nuevo.`
    try {
      const body = await response.json()
      const msg = body?.message
      if (Array.isArray(msg)) mensaje = msg.join('. ')
      else if (typeof msg === 'string') mensaje = msg
    } catch {
      mensaje = `El servidor respondió con estado ${response.status}. Inténtalo de nuevo.`
    }
    throw new Error(mensaje)
  }

  return await response.json()
}
