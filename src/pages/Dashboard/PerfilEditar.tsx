import { useState, useEffect, useRef, type FormEvent } from 'react'
import {
  obtenerPerfil,
  actualizarPerfil,
  subirFoto,
  type PerfilCompleto,
} from '../../components/Services/perfil.service'
import { resolverUrlArchivo } from '../../lib/urlArchivos'

function obtenerMensajeError(err: unknown): string {
  const data = (err as { response?: { data?: { message?: unknown } } })?.response
    ?.data?.message
  if (Array.isArray(data)) return data.join(' · ')
  if (typeof data === 'string') return data
  return 'No se pudo realizar la operación. Intenta nuevamente.'
}

function IconCamara() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  )
}

// Editar perfil: foto e información de contacto en un solo panel centrado
// (avatar a la izquierda, campos en grilla a la derecha). El cambio de
// contraseña vive aparte (ver PerfilContrasena.tsx, enlazado desde el menú
// de 'Perfil' del Sidebar) y el cambio de cuenta (Abonado <-> rol base)
// también vive en el propio menú del Sidebar.
function PerfilEditar() {
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
      <div className="max-w-5xl space-y-6">
        <h1 className="text-2xl font-semibold text-primary-900">Configuración</h1>
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

  const inputClass =
    'mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none'
  const inputReadonlyClass =
    'mt-1 w-full rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm text-primary-500'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">Configuración</h1>
        <p className="mt-1 text-sm text-primary-500">
          Información de tu cuenta en SIAPB
        </p>
      </div>

      <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm sm:p-8">
        {(exitoFoto || exitoDatos) && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {exitoFoto && exitoDatos
              ? 'Foto y datos actualizados correctamente.'
              : exitoFoto
                ? 'Foto actualizada correctamente.'
                : 'Datos actualizados correctamente.'}
          </div>
        )}
        {(errorFoto || errorDatos) && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorFoto || errorDatos}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[13rem_1fr]">
          {/* ── Columna izquierda: avatar con insignia de cámara ── */}
          <div className="flex flex-col items-center gap-3 lg:items-start">
            <div className="relative">
              {previewFoto ? (
                <img
                  src={previewFoto}
                  alt="Vista previa"
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-primary-50"
                />
              ) : perfil.foto_url ? (
                <img
                  src={resolverUrlArchivo(perfil.foto_url)}
                  alt="Foto de perfil"
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-primary-50"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-700 text-3xl font-bold text-white ring-4 ring-primary-50">
                  {inicial}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={subiendoFoto}
                aria-label="Cambiar foto de perfil"
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 text-white ring-2 ring-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <IconCamara />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={manejarFoto}
                className="hidden"
              />
            </div>

            <div className="text-center lg:text-left">
              <h3 className="text-base font-semibold text-primary-900">
                {nombreCompleto || usuario}
              </h3>
              <p className="text-sm text-primary-500">{perfil.role}</p>
            </div>

            {previewFoto && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={guardarFoto}
                  disabled={subiendoFoto}
                  className="rounded-full bg-primary-700 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {subiendoFoto ? 'Guardando…' : 'Guardar foto'}
                </button>
                <button
                  type="button"
                  onClick={cancelarFoto}
                  disabled={subiendoFoto}
                  className="rounded-full border border-primary-300 px-4 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            )}
            <p className="text-center text-xs text-primary-400 lg:text-left">
              JPG, PNG, GIF o WEBP. Máx. 2 MB.
            </p>
          </div>

          {/* ── Columna derecha: campos en grilla de 2 columnas ── */}
          <form onSubmit={manejarActualizarDatos} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  Cédula
                </label>
                <input
                  type="text"
                  value={perfil.cedula ?? ''}
                  readOnly
                  className={inputReadonlyClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Usuario
                </label>
                <input type="text" value={usuario} readOnly className={inputReadonlyClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Dirección
                </label>
                <input
                  type="text"
                  value={perfil.direccion ?? ''}
                  readOnly
                  className={inputReadonlyClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={guardandoDatos}
                className="rounded-full bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardandoDatos ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={cancelarDatos}
                disabled={guardandoDatos}
                className="rounded-full border border-primary-300 px-6 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PerfilEditar
