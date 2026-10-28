import { useId } from 'react'
import PhoneInput from 'react-phone-number-input'
import type { Props } from 'react-phone-number-input'
import es from 'react-phone-number-input/locale/es'
import flags from 'react-phone-number-input/flags'
import 'react-phone-number-input/style.css'
import { Campo } from './campos'
import { normalizarTelefono } from '../../lib/telefono'

// Campo de teléfono con selector de país (bandera + código, ej. 🇨🇷 +506).
// Costa Rica viene seleccionado, pero se puede elegir cualquier otro país para
// números extranjeros. El valor que entrega es E.164 (+50688888888) o ''.
// Las banderas son SVG, así que se ven igual en Windows, Mac y celulares.
const PAISES_PRIMERO: NonNullable<Props<object>['countryOptionsOrder']> = ['CR', 'NI', 'PA', 'US', 'MX', 'CO', 'ES', '|', '...']

export default function Telefono({
  label,
  obligatorio,
  error,
  ayuda,
  value,
  onChange,
  id,
  disabled,
  placeholder = '8888 8888',
}: {
  label?: string
  obligatorio?: boolean
  error?: string | null
  ayuda?: string
  value: string
  onChange: (valor: string) => void
  id?: string
  disabled?: boolean
  placeholder?: string
}) {
  const auto = useId()
  const cid = id ?? auto
  const campo = (
    <PhoneInput
      id={cid}
      international
      defaultCountry="CR"
      countryCallingCodeEditable={false}
      limitMaxLength
      labels={es}
      flags={flags}
      countryOptionsOrder={PAISES_PRIMERO}
      value={normalizarTelefono(value) || undefined}
      onChange={(v) => onChange(v ?? '')}
      disabled={disabled}
      placeholder={placeholder}
      aria-invalid={error ? true : undefined}
      className={`telefono-input ${error ? 'telefono-input--error' : ''}`.trim()}
    />
  )
  if (!label) return campo
  return (
    <Campo label={label} obligatorio={obligatorio} error={error} ayuda={ayuda} htmlFor={cid}>
      {campo}
    </Campo>
  )
}
