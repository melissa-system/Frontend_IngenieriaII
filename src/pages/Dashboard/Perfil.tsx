import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../lib/apiClient'
import {
  obtenerPerfil,
  actualizarPerfil,
  subirFoto,
  type PerfilCompleto,
} from '../../components/Services/perfil.service'

// Espejo client-side de las reglas de fortaleza que aplica el backend en
// CambiarPasswordDto (min 8 caracteres, mayuscula, numero).
function validarFortaleza(pw: string): string | null {
  if (pw.length < 8) {
    return 'La nueva contraseña debe tener al menos 8 caracteres'
  }
  if (!/[A-Z]/.test(pw)) {
    return 'La nueva contraseña debe incluir al menos una letra mayúscula'
  }
  if (!/[0-9]/.test(pw)) {
    return 'La nueva contraseña debe incluir al menos un número'
  }
  return null
}

function obtenerMensajeError(err: unknown): string {
  const data = (err as { response?: { data?: { message?: unknown } } })?.response
    ?.data?.message
  if (Array.isArray(data)) return data.join(' · ')
  if (typeof data === 'string') return data
  return 'No se pudo realizar la operación. Intenta nuevamente.'
}

function Perfil() {
  const { logout } = useAuth()

  // ── Estado del perfil ───────────────────────────────────────────
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  // ── Estado de foto ──────────────────────────────────────────────
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [errorFoto, setErrorFoto] = useState<string | null>(null)
  const [exitoFoto, setExitoFoto] = useState(false)
  const [previewFoto, setPreviewFoto] = useState<string | null>(null)
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Estado de actualizar datos ──────────────────────────────────
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const correoInicialRef = useRef('')
  const telefonoInicialRef = useRef('')
  const [guardandoDatos, setGuardandoDatos] = useState(false)
  const [errorDatos, setErrorDatos] = useState<string | null>(null)
  const [exitoDatos, setExitoDatos] = useState(false)

  // ── Estado de contraseña ────────────────────────────────────────
  const [passwordActual, setPasswordActual] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [enviandoPassword, setEnviandoPassword] = useState(false)
  const [errorPassword, setErrorPassword] = useState<string | null>(null)
  const [exitoPassword, setExitoPassword] = useState(false)

  useEffect(() => {
    let cancelado = false
    obtenerPerfil()
      .then((data: PerfilCompleto) => {
        if (cancelado) return
        setPerfil(data)
        setCorreo(data.email)
        setTelefono(data.telefono ?? '')
        correoInicialRef.current = data.email
        telefonoInicialRef.current = data.telefono ?? ''
      })
      .catch(() => {
        if (!cancelado) setErrorCarga('No se pudo cargar el perfil.')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => { cancelado = true }
  }, [])

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-primary-500">Cargando perfil…</p>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold text-primary-900">Mi Perfil</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorCarga}
        </div>
      </div>
    )
  }

  if (!perfil) return null

  const nombreCompleto = [perfil.nombre, perfil.apellido1, perfil.apellido2]
    .filter(Boolean)
    .join(' ')
  const usuario = perfil.email.split('@')[0]
  const inicial = (perfil.nombre ?? perfil.email).charAt(0).toUpperCase()

  // ── Handlers ────────────────────────────────────────────────────

  function manejarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setErrorFoto(null)
    setExitoFoto(false)
    setArchivoSeleccionado(archivo)
    setPreviewFoto(URL.createObjectURL(archivo))
  }

  function cancelarFoto() {
    setPreviewFoto(null)
    setArchivoSeleccionado(null)
    setErrorFoto(null)
    setExitoFoto(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function guardarFoto() {
    if (!archivoSeleccionado) return
    setSubiendoFoto(true)
    setErrorFoto(null)
    try {
      const { foto_url } = await subirFoto(archivoSeleccionado)
      setPerfil((prev: PerfilCompleto | null) => (prev ? { ...prev, foto_url } : prev))
      setExitoFoto(true)
      setPreviewFoto(null)
      setArchivoSeleccionado(null)
    } catch (err) {
      setErrorFoto(obtenerMensajeError(err))
    } finally {
      setSubiendoFoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function manejarActualizarDatos(e: FormEvent) {
    e.preventDefault()
    setErrorDatos(null)
    setExitoDatos(false)

    setGuardandoDatos(true)
    try {
      const actualizado = await actualizarPerfil({
        email: correo.trim(),
        telefono: telefono.trim(),
      })
      setPerfil(actualizado)
      correoInicialRef.current = actualizado.email
      telefonoInicialRef.current = actualizado.telefono ?? ''
      setExitoDatos(true)
    } catch (err) {
      setErrorDatos(obtenerMensajeError(err))
    } finally {
      setGuardandoDatos(false)
    }
  }

  function cancelarDatos() {
    setCorreo(correoInicialRef.current)
    setTelefono(telefonoInicialRef.current)
    setErrorDatos(null)
    setExitoDatos(false)
  }

  function cancelarPassword() {
    setPasswordActual('')
    setNuevaPassword('')
    setConfirmarPassword('')
    setErrorPassword(null)
    setExitoPassword(false)
  }

  async function manejarCambioPassword(e: FormEvent) {
    e.preventDefault()
    setErrorPassword(null)
    setExitoPassword(false)

    const falloFortaleza = validarFortaleza(nuevaPassword)
    if (falloFortaleza) {
      setErrorPassword(falloFortaleza)
      return
    }
    if (nuevaPassword !== confirmarPassword) {
      setErrorPassword('Las contraseñas nuevas no coinciden')
      return
    }
    if (nuevaPassword === passwordActual) {
      setErrorPassword('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setEnviandoPassword(true)
    try {
      await apiClient.post('/auth/cambiar-password', {
        passwordActual,
        nuevaPassword,
      })
      setExitoPassword(true)
      setPasswordActual('')
      setNuevaPassword('')
      setConfirmarPassword('')
      setTimeout(logout, 1800)
    } catch (err) {
      setErrorPassword(obtenerMensajeError(err))
    } finally {
      setEnviandoPassword(false)
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none'
  const inputReadonlyClass =
    'mt-1 w-full rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm text-primary-500'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">Mi Perfil</h1>
        <p className="mt-1 text-sm text-primary-500">
          Información de tu cuenta en SIAPB
        </p>
      </div>

      {/* ─── Tarjeta 1: Información de usuario ───────────────────── */}
      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900">
          Información de usuario
        </h2>

        <div className="mt-5 flex items-center gap-4">
          {perfil.foto_url ? (
            <img
              src={`http://localhost:3000${perfil.foto_url}`}
              alt="Foto de perfil"
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-700 text-xl font-bold text-white">
              {inicial}
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-primary-900">
              {nombreCompleto || usuario}
            </h3>
            <p className="text-sm text-primary-500">{perfil.role}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              readOnly
              className={inputReadonlyClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Nombre completo
            </label>
            <input
              type="text"
              value={nombreCompleto}
              readOnly
              className={inputReadonlyClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Correo electrónico
            </label>
            <input
              type="text"
              value={perfil.email}
              readOnly
              className={inputReadonlyClass}
            />
          </div>
          {perfil.cedula && (
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Cédula
              </label>
              <input
                type="text"
                value={perfil.cedula}
                readOnly
                className={inputReadonlyClass}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Tarjeta 2: Foto de perfil ──────────────────────────── */}
      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900">
          Foto de perfil
        </h2>
        <p className="mt-1 text-sm text-primary-500">
          JPG, PNG, GIF o WEBP. Tamaño máximo: 2 MB.
        </p>

        {exitoFoto && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Foto actualizada correctamente.
          </div>
        )}
        {errorFoto && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorFoto}
          </div>
        )}

        <div className="mt-5 flex flex-col items-center gap-4">
          {previewFoto ? (
            <img
              src={previewFoto}
              alt="Vista previa"
              className="h-28 w-28 rounded-lg object-cover"
            />
          ) : perfil.foto_url ? (
            <img
              src={`http://localhost:3000${perfil.foto_url}`}
              alt="Foto de perfil"
              className="h-28 w-28 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-primary-700 text-3xl font-bold text-white">
              {inicial}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={manejarFoto}
            className="hidden"
          />

          {previewFoto ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={guardarFoto}
                disabled={subiendoFoto}
                className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {subiendoFoto ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={cancelarFoto}
                disabled={subiendoFoto}
                className="rounded-full border border-primary-300 px-5 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendoFoto}
              className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {subiendoFoto ? 'Subiendo…' : 'Cambiar foto'}
            </button>
          )}
        </div>
      </div>

      {/* ─── Tarjeta 3: Actualizar datos ────────────────────────── */}
      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900">
          Actualizar datos
        </h2>
        <p className="mt-1 text-sm text-primary-500">
          Solo puedes modificar el correo y teléfono.
        </p>

        {exitoDatos && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Datos actualizados correctamente.
          </div>
        )}
        {errorDatos && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorDatos}
          </div>
        )}

        <form onSubmit={manejarActualizarDatos} className="mt-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Nombre completo
            </label>
            <input
              type="text"
              value={nombreCompleto}
              readOnly
              className={inputReadonlyClass}
            />
          </div>
          {perfil.cedula && (
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Cédula
              </label>
              <input
                type="text"
                value={perfil.cedula}
                readOnly
                className={inputReadonlyClass}
              />
            </div>
          )}
          {perfil.direccion && (
            <div>
              <label className="block text-sm font-medium text-primary-700">
                Dirección
              </label>
              <input
                type="text"
                value={perfil.direccion}
                readOnly
                className={inputReadonlyClass}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Correo electrónico
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Teléfono
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="8741-8543"
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={guardandoDatos}
              className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardandoDatos ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={cancelarDatos}
              disabled={guardandoDatos}
              className="rounded-full border border-primary-300 px-5 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* ─── Tarjeta 4: Cambiar contraseña ───────────────────────── */}
      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900">
          Cambiar contraseña
        </h2>
        <p className="mt-1 text-sm text-primary-500">
          Mínimo 8 caracteres, una letra mayúscula y un número.
        </p>

        {exitoPassword && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Contraseña actualizada correctamente. Cierra sesión e inicia con tu
            nueva contraseña…
          </div>
        )}
        {errorPassword && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorPassword}
          </div>
        )}

        <form onSubmit={manejarCambioPassword} className="mt-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Contraseña actual
            </label>
            <input
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={enviandoPassword || exitoPassword}
              className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviandoPassword ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
            <button
              type="button"
              onClick={cancelarPassword}
              disabled={enviandoPassword}
              className="rounded-full border border-primary-300 px-5 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Perfil
