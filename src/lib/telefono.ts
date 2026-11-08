import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js'

// Teléfonos con código de país (CR por defecto, pero también extranjeros).
// Se guardan en formato internacional E.164 sin espacios (ej. +50688888888).

const REGEX_LOCAL_CR = /^\d{4}-?\d{4}$/

/**
 * Lleva cualquier valor a E.164: los teléfonos locales de 8 dígitos (como los
 * guardados antes de soportar otros países) pasan a +506.
 */
export function normalizarTelefono(valor?: string | null): string {
  const v = (valor ?? '').trim()
  if (!v) return ''
  if (REGEX_LOCAL_CR.test(v)) return `+506${v.replace(/\D/g, '')}`
  if (v.startsWith('+')) return `+${v.replace(/\D/g, '')}`
  return ''
}

/** ¿Es un número válido para su país? Acepta E.164 y el formato local de CR. */
export function esTelefonoValido(valor?: string | null): boolean {
  const normalizado = normalizarTelefono(valor)
  return normalizado !== '' && isValidPhoneNumber(normalizado)
}

/** Formato para mostrar: "+506 8888 8888"; si no se puede interpretar, el valor tal cual. */
export function formatearTelefonoVisible(valor?: string | null): string {
  if (!valor) return ''
  const normalizado = normalizarTelefono(valor)
  const parseado = normalizado ? parsePhoneNumberFromString(normalizado) : undefined
  return parseado ? parseado.formatInternational() : valor
}

export const MENSAJE_TELEFONO_INVALIDO =
  'Ingresa un número de teléfono válido para el país seleccionado.'
