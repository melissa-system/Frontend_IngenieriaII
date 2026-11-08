import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
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
      {ayuda && !error && (
        <p id={htmlFor ? `${htmlFor}-ayuda` : undefined} className="mt-1 text-xs text-primary-500">
          {ayuda}
        </p>
      )}
      <CampoError mensaje={error} id={htmlFor ? `${htmlFor}-error` : undefined} />
    </div>
  )
}

type PropsCampo = { label?: string; obligatorio?: boolean; error?: string | null; ayuda?: string }

// Atributos de accesibilidad comunes: el campo queda ligado a su etiqueta
// (htmlFor/id), marcado como inválido y descrito por su error o ayuda, para
// que el lector de pantalla los anuncie al enfocarlo.
function aria(id: string, error?: string | null, ayuda?: string, obligatorio?: boolean) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-required': obligatorio || undefined,
    'aria-describedby': error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined,
  } as const
}

export function Input({
  label,
  obligatorio,
  error,
  ayuda,
  className = '',
  id,
  ...props
}: PropsCampo & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId()
  const cid = id ?? auto
  return (
    <Campo label={label} obligatorio={obligatorio} error={error} ayuda={ayuda} htmlFor={cid}>
      <input {...aria(cid, error, ayuda, obligatorio)} className={`${CLASE_INPUT} ${bordeCampo(error)} ${className}`.trim()} {...props} />
    </Campo>
  )
}

/** Campo de fecha (input type="date" con la misma apariencia y error integrado). */
export function Fecha(props: PropsCampo & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <Input {...props} type="date" />
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
  const auto = useId()
  const cid = id ?? auto
  return (
    <Campo label={label} obligatorio={obligatorio} error={error} ayuda={ayuda} htmlFor={cid}>
      <textarea {...aria(cid, error, ayuda, obligatorio)} className={`${CLASE_INPUT} ${bordeCampo(error)} ${className}`.trim()} {...props} />
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
  const auto = useId()
  const cid = id ?? auto
  return (
    <Campo label={label} obligatorio={obligatorio} error={error} ayuda={ayuda} htmlFor={cid}>
      <select {...aria(cid, error, ayuda, obligatorio)} className={`${CLASE_SELECT} ${bordeCampo(error)} ${className}`.trim()} {...props}>
        {children}
      </select>
    </Campo>
  )
}

/** Campo de archivo simple (para casos sin arrastrar y soltar; con vista previa
 *  y drag-and-drop se usa FileDropZone). Muestra el nombre y el error integrado. */
export function Archivo({
  label,
  obligatorio,
  error,
  ayuda,
  className = '',
  id,
  ...props
}: PropsCampo & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const auto = useId()
  const cid = id ?? auto
  return (
    <Campo label={label} obligatorio={obligatorio} error={error} ayuda={ayuda} htmlFor={cid}>
      <input
        {...aria(cid, error, ayuda, obligatorio)}
        type="file"
        className={`mt-1 block w-full rounded-campo border bg-white text-sm text-primary-700 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100 focus:ring-1 focus:ring-primary-500 focus:outline-none ${bordeCampo(error)} ${className}`.trim()}
        {...props}
      />
    </Campo>
  )
}
