import apiClient from './apiClient'

// Reglas mínimas: deben coincidir con las que valida el backend
// (ConfirmarResetPasswordDto): al menos 8 caracteres, una mayúscula y un número.
export const PASSWORD_MIN_LENGTH = 8
const REGEX_MAYUSCULA = /[A-Z]/
const REGEX_NUMERO = /[0-9]/
const REGEX_SIMBOLO = /[^A-Za-z0-9]/

export function passwordCumpleMinimos(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    REGEX_MAYUSCULA.test(password) &&
    REGEX_NUMERO.test(password)
  )
}

export type NivelFortaleza = 0 | 1 | 2 | 3 // 0 = vacía, 1 = débil, 2 = media, 3 = fuerte

// Indicador visual: por debajo del mínimo del backend siempre es "débil"
// (no se puede enviar). Cumplir el mínimo ya es "media". Ir más allá
// (12+ caracteres y algún símbolo) es "fuerte" — esto es solo una guía
// para el usuario, el backend no exige el símbolo ni el largo extra.
export function calcularFortaleza(password: string): NivelFortaleza {
  if (!password) return 0
  if (!passwordCumpleMinimos(password)) return 1
  if (password.length >= 12 && REGEX_SIMBOLO.test(password)) return 3
  return 2
}

interface MensajeRespuesta {
  mensaje: string
}

export async function solicitarResetPassword(
  email: string,
): Promise<MensajeRespuesta> {
  const { data } = await apiClient.post<MensajeRespuesta>(
    '/auth/reset-password/solicitar',
    { email },
  )
  return data
}

export async function confirmarResetPassword(
  token: string,
  nuevaPassword: string,
): Promise<MensajeRespuesta> {
  const { data } = await apiClient.post<MensajeRespuesta>(
    '/auth/reset-password/confirmar',
    { token, nuevaPassword },
  )
  return data
}