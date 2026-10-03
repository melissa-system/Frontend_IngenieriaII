// Reglas de validación comunes a todos los formularios (PBI 511 / Task 513).
// Son exactamente las mismas que aplica el backend en
// src/common/validacion/reglas-validacion.ts: así un dato que el formulario
// acepta nunca lo rechaza la API por un criterio distinto, y viceversa.
//
// Uso típico en un formulario:
//   const errores = validarCampos({
//     cedula: [requerido('La cédula'), cedula(['fisica', 'dimex'])],
//     correo: [requerido('El correo'), correo()],
//   }, form)
//   if (hayErrores(errores)) { setErrores(errores); return }

// Cédula física: 9 dígitos, con o sin guiones (X-XXXX-XXXX).
export const REGEX_CEDULA_FISICA = /^\d-?\d{4}-?\d{4}$/
// Cédula jurídica: 10 dígitos, con o sin guiones (X-XXX-XXXXXX).
export const REGEX_CEDULA_JURIDICA = /^\d-?\d{3}-?\d{6}$/
// DIMEX: 11 o 12 dígitos.
export const REGEX_DIMEX = /^\d{11,12}$/
// Teléfono de Costa Rica: 8 dígitos, con o sin guion (XXXX-XXXX).
export const REGEX_TELEFONO = /^\d{4}-?\d{4}$/
// Correo: usuario@dominio.ext, sin espacios.
export const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type TipoIdentificacion = 'fisica' | 'juridica' | 'dimex'

export const MENSAJES_VALIDACION = {
  cedulaFisica: 'La cédula física debe tener 9 dígitos (ej. 1-2345-6789).',
  cedulaJuridica: 'La cédula jurídica debe tener 10 dígitos (ej. 3-101-123456).',
  cedulaFisicaODimex:
    'Debe ser una cédula física (9 dígitos) o un DIMEX (11 o 12 dígitos).',
  identificacion:
    'Debe ser una cédula física (9 dígitos), jurídica (10 dígitos) o un DIMEX (11 o 12 dígitos).',
  telefono: 'El teléfono debe tener 8 dígitos (ej. 8888-8888).',
  correo: 'El correo electrónico no tiene un formato válido.',
  fecha: 'La fecha no es válida.',
  fechaFutura: 'La fecha no puede ser posterior a hoy.',
} as const

export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

export function esIdentificacion(
  valor: string,
  tipos: TipoIdentificacion[] = ['fisica', 'juridica', 'dimex'],
): boolean {
  const v = valor.trim()
  return (
    (tipos.includes('fisica') && REGEX_CEDULA_FISICA.test(v)) ||
    (tipos.includes('juridica') && REGEX_CEDULA_JURIDICA.test(v)) ||
    (tipos.includes('dimex') && REGEX_DIMEX.test(v))
  )
}

export function esTelefono(valor: string): boolean {
  return REGEX_TELEFONO.test(valor.trim())
}

export function esCorreo(valor: string): boolean {
  return REGEX_CORREO.test(valor.trim())
}

// Fecha real del calendario en formato AAAA-MM-DD (rechaza 2026-02-30).
export function esFecha(valor: string): boolean {
  const v = valor.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const fecha = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === v
}

export function hoyIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mensajeIdentificacion(tipos: TipoIdentificacion[]): string {
  const clave = [...tipos].sort().join(',')
  if (clave === 'fisica') return MENSAJES_VALIDACION.cedulaFisica
  if (clave === 'juridica') return MENSAJES_VALIDACION.cedulaJuridica
  if (clave === 'dimex,fisica') return MENSAJES_VALIDACION.cedulaFisicaODimex
  return MENSAJES_VALIDACION.identificacion
}

// ---------------------------------------------------------------------------
// Reglas componibles: cada una recibe el valor y devuelve el mensaje de error
// o null. Las reglas de formato no se quejan de un campo vacío (para eso está
// `requerido`), así sirven también para campos opcionales.

export type Regla = (valor: string) => string | null

export const requerido =
  (nombre: string, femenino = false): Regla =>
  (v) =>
    v.trim() ? null : `${nombre} es ${femenino ? 'obligatoria' : 'obligatorio'}.`

export const cedula =
  (tipos: TipoIdentificacion[] = ['fisica', 'juridica', 'dimex'], mensaje?: string): Regla =>
  (v) =>
    !v.trim() || esIdentificacion(v, tipos) ? null : (mensaje ?? mensajeIdentificacion(tipos))

export const telefono =
  (mensaje: string = MENSAJES_VALIDACION.telefono): Regla =>
  (v) =>
    !v.trim() || esTelefono(v) ? null : mensaje

export const correo =
  (mensaje: string = MENSAJES_VALIDACION.correo): Regla =>
  (v) =>
    !v.trim() || esCorreo(v) ? null : mensaje

export const longitud =
  (nombre: string, min: number, max: number): Regla =>
  (v) => {
    const n = v.trim().length
    if (!n) return null
    if (n < min) return `${nombre} debe tener al menos ${min} caracteres.`
    if (n > max) return `${nombre} no puede superar los ${max} caracteres.`
    return null
  }

export const maximo =
  (nombre: string, max: number): Regla =>
  (v) =>
    v.trim().length > max ? `${nombre} no puede superar los ${max} caracteres.` : null

export const entero =
  (nombre: string, min: number, max?: number): Regla =>
  (v) => {
    if (!v.trim()) return null
    const n = Number(v)
    if (!Number.isInteger(n)) return `${nombre} debe ser un número entero.`
    if (n < min) return min === 0 ? `${nombre} no puede ser menor a 0.` : `${nombre} debe ser al menos ${min}.`
    if (max !== undefined && n > max) return `${nombre} no puede ser mayor a ${max}.`
    return null
  }

export const fecha =
  (opciones: { noFutura?: boolean } = {}): Regla =>
  (v) => {
    if (!v.trim()) return null
    if (!esFecha(v)) return MENSAJES_VALIDACION.fecha
    if (opciones.noFutura && v.slice(0, 10) > hoyIso()) return MENSAJES_VALIDACION.fechaFutura
    return null
  }

export type ErroresFormulario<K extends string = string> = Partial<Record<K, string>>

// Aplica las reglas de cada campo y devuelve el primer error de cada uno.
export function validarCampos<K extends string>(
  reglas: Partial<Record<K, Regla[]>>,
  valores: Record<K, string>,
): ErroresFormulario<K> {
  const errores: ErroresFormulario<K> = {}
  for (const campo of Object.keys(reglas) as K[]) {
    for (const regla of reglas[campo] ?? []) {
      const mensaje = regla(valores[campo] ?? '')
      if (mensaje) {
        errores[campo] = mensaje
        break
      }
    }
  }
  return errores
}

export function hayErrores(errores: ErroresFormulario): boolean {
  return Object.values(errores).some(Boolean)
}

// ---------------------------------------------------------------------------
// Archivos adjuntos: tipo (por extensión) y peso.

export const MB = 1024 * 1024

export function validarArchivo(
  archivo: File | null | undefined,
  opciones: { extensiones: string[]; maxBytes: number; mensajeTipo?: string },
): string | null {
  if (!archivo) return null
  const nombre = archivo.name.toLowerCase()
  const permitido = opciones.extensiones.some((ext) => nombre.endsWith(ext.toLowerCase()))
  if (!permitido) {
    return (
      opciones.mensajeTipo ??
      `Formato no permitido. Solo se aceptan: ${opciones.extensiones.join(', ')}.`
    )
  }
  if (archivo.size > opciones.maxBytes) {
    return `El archivo no puede superar los ${Math.round(opciones.maxBytes / MB)} MB.`
  }
  return null
}

// Mientras se escribe: deja solo 8 dígitos y agrega el guion (8888-8888).
export function formatearTelefono(valor: string): string {
  const d = soloDigitos(valor).slice(0, 8)
  return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d
}
