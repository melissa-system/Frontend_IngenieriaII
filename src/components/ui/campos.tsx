import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import CampoError, { Obligatorio, bordeCampo } from '../common/CampoError'

// Clases estándar de los campos (ver diseños/formularios.md). Inputs y
// textareas: rounded-lg. Selects: SIEMPRE rounded-full.
export const CLASE_INPUT =
  'mt-1 w-full rounded-lg border px-4 py-2.5 text-primary-900 focus:ring-1 focus:ring-primary-500 focus:outline-none disabled:bg-primary-50'
export const CLASE_SELECT =
  'mt-1 w-full rounded-full border bg-white px-4 py-2.5 text-primary-900 focus:ring-1 focus:ring-primary-500 focus:outline-none disabled:bg-primary-50'
/** Select suelto de una barra de filtros (misma altura que el botón de orden). */
export const CLASE_SELECT_FILTRO =
  'h-10 pointer-coarse:h-11 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none'
/** Input de búsqueda de una barra de filtros. */
export const CLASE_BUSCADOR =
  'h-10 pointer-coarse:h-11 rounded-full border border-primary-200 bg-white px-4 text-sm text-primary-900 focus:border-primary-500 focus:outline-none'

interface CampoProps {
  label?: string
  obligatorio?: boolean
  error?: string | null
  ayuda?: string
  children: ReactNode
  htmlFor?: string
}

/** Envoltorio estándar: etiqueta arriba, campo, ayuda y error debajo. */
export function Campo({ label, obligatorio, error, ayuda, children, htmlFor }: CampoProps) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-primary-900">
          {label}
          {obligatorio && <Obligatorio />}
        </label>
      )}
      {children}
      {ayuda && !error && <p className="mt-1 text-xs text-primary-500">{ayuda}</p>}
      <CampoError mensaje={error} />
    </div>
  )
}

type PropsCampo = { label?: string; obligatorio?: boolean; error?: string | null; ayuda?: string }

export function Input({
  label,
  obligatorio,
  error,
  ayuda,
  className = '',
  id,
  ...props
}: PropsCampo & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Campo label={label} obligatorio={obligatorio} error={error} ayuda={ayuda} htmlFor={id}>
      <input id={id} className={`${CLASE_INPUT} ${bordeCampo(error)} ${className}`.trim()} {...props} />
    </Campo>
  )
}

export function Textarea({
  label,
  obligatorio,
  error,
  ayuda,
  className = '',
  id,
  ...props
}: PropsCampo & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Campo label={label} obligatorio={obligatorio} error={error} ayuda={ayuda} htmlFor={id}>
      <textarea id={id} className={`${CLASE_INPUT} ${bordeCampo(error)} ${className}`.trim()} {...props} />
    </Campo>
  )
}

export function Select({
  label,
  obligatorio,
  error,
  ayuda,
  className = '',
  id,
  children,
  ...props
}: PropsCampo & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Campo label={label} obligatorio={obligatorio} error={error} ayuda={ayuda} htmlFor={id}>
      <select id={id} className={`${CLASE_SELECT} ${bordeCampo(error)} ${className}`.trim()} {...props}>
        {children}
      </select>
    </Campo>
  )
}
