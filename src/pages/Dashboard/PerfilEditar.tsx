import ErrorState from '../../components/ui/ErrorState'
import Cargando from '../../components/ui/Cargando'
import { useState, useEffect, useRef, type FormEvent } from 'react'
import {
  erroresPorCampo,
  tieneErroresDeCampo,
} from '../../components/Services/erroresApi'
import {
  correo as reglaCorreo,
  formatearTelefono,
  hayErrores,
  maximo,
  MB,
  requerido,
  telefono as telefonoRegla,
  validarArchivo,
  validarCampos,
  type ErroresFormulario,
} from '../../lib/validaciones'
import CampoError, { Obligatorio, bordeCampo, enfocarPrimerError } from '../../components/common/CampoError'

type CampoPerfil = 'correo' | 'telefono' | 'usuario'
import {
  obtenerPerfil,
  actualizarPerfil,
  subirFoto,
  type PerfilCompleto,
} from '../../components/Services/perfil.service'
import { resolverUrlArchivo } from '../../lib/urlArchivos'
import Button from '../../components/ui/Button'

// obtenerPerfil/actualizarPerfil/subirFoto (perfil.service.ts) ya extraen el
// mensaje del backend y lo relanzan como Error normal (err.message) — acá
// solo se usa eso. No leer err.response.*: en este punto ya no es el error
// crudo de axios, así que esa ruta nunca tiene datos y tapaba el mensaje
// real con el genérico de abajo.
function obtenerMensajeError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
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
  const [usuarioInput, setUsuarioInput] = useState('')
  const correoInicialRef = useRef('')
  const telefonoInicialRef = useRef('')
  const usuarioInicialRef = useRef('')
  const [guardandoDatos, setGuardandoDatos] = useState(false)
  const [errorDatos, setErrorDatos] = useState<string | null>(null)
  const [erroresPerfil, setErroresPerfil] = useState<ErroresFormulario<CampoPerfil>>({})
  const [exitoDatos, setExitoDatos] = useState(false)

  useEffect(() => {
    let cancelado = false
    obtenerPerfil()
      .then((data: PerfilCompleto) => {
        if (cancelado) return
        setPerfil(data)
        setCorreo(data.email)
        setTelefono(data.telefono ?? '')
        const usuarioActual = data.username ?? data.email.split('@')[0]
        setUsuarioInput(usuarioActual)
        correoInicialRef.current = data.email
        telefonoInicialRef.current = data.telefono ?? ''
        usuarioInicialRef.current = usuarioActual
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
      <Cargando texto="Cargando perfil…" />
    )
  }

  if (errorCarga) {
    return (
      <div className="max-w-5xl space-y-6">
        <h1 className="text-2xl font-semibold text-primary-900">Configuración</h1>
        <ErrorState mensaje={errorCarga} onReintentar={() => window.location.reload()} />
      </div>
    )
  }

  if (!perfil) return null

  const nombreCompleto = [perfil.nombre, perfil.apellido1, perfil.apellido2]
    .filter(Boolean)
    .join(' ')
  const usuario = perfil.username ?? perfil.email.split('@')[0]
  const inicial = (perfil.nombre ?? perfil.email).charAt(0).toUpperCase()

  // ── Handlers ────────────────────────────────────────────────────

  function manejarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    // Mismo límite que el backend: imágenes JPG, PNG, GIF o WEBP de hasta 2 MB.
    const errorArchivo = validarArchivo(archivo, {
      extensiones: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      maxBytes: 2 * MB,
      mensajeTipo: 'La foto debe ser una imagen JPG, PNG, GIF o WEBP.',
    })
    if (errorArchivo) {
      setErrorFoto(errorArchivo)
      e.target.value = ''
      return
    }
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

    // Checklist común (PBI 511): mismo formato de correo, teléfono y nombre
    // de usuario que valida el backend.
    const nuevos = validarCampos<CampoPerfil>(
      {
        correo: [requerido('El correo electrónico'), reglaCorreo(), maximo('El correo', 150)],
        telefono: [telefonoRegla()],
        usuario: [
          (v) =>
            !v.trim() || /^[a-zA-Z0-9._-]{3,30}$/.test(v.trim())
              ? null
              : 'El nombre de usuario debe tener entre 3 y 30 caracteres: letras, números, ".", "_" o "-", sin espacios.',
        ],
      },
      { correo: correo, telefono, usuario: usuarioInput },
    )
    setErroresPerfil(nuevos)
    enfocarPrimerError()
    if (hayErrores(nuevos)) return

    setGuardandoDatos(true)
    try {
      const actualizado = await actualizarPerfil({
        email: correo.trim(),
        telefono: telefono.trim(),
        ...(usuarioInput.trim() !== usuarioInicialRef.current
          ? { username: usuarioInput.trim() }
          : {}),
      })
      setPerfil(actualizado)
      correoInicialRef.current = actualizado.email
      telefonoInicialRef.current = actualizado.telefono ?? ''
      const usuarioActualizado =
        actualizado.username ?? actualizado.email.split('@')[0]
      setUsuarioInput(usuarioActualizado)
      usuarioInicialRef.current = usuarioActualizado
      setExitoDatos(true)
    } catch (err) {
      setErroresPerfil(erroresPorCampo<CampoPerfil>(err, { email: 'correo', username: 'usuario' }))
      enfocarPrimerError()
      setErrorDatos(
        tieneErroresDeCampo(err)
          ? null
          : obtenerMensajeError(err),
      )
    } finally {
      setGuardandoDatos(false)
    }
  }

  function cancelarDatos() {
    setCorreo(correoInicialRef.current)
    setTelefono(telefonoInicialRef.current)
    setUsuarioInput(usuarioInicialRef.current)
    setErrorDatos(null)
    setExitoDatos(false)
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:outline-none'
  const inputReadonlyClass =
    'mt-1 w-full rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm text-primary-500'
  const inputConError = (error?: string) =>
    `${inputClass.replace('border-primary-200', '').replace('focus:border-primary-500', '')} ${bordeCampo(error)}`

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
              <Button
                variant="primary"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={subiendoFoto}
                aria-label="Cambiar foto de perfil"
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center ring-2 ring-white">
                <IconCamara />
              </Button>
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
                <Button
                  variant="primary" size="sm"
                  type="button"
                  onClick={guardarFoto}
                  disabled={subiendoFoto}>
                  {subiendoFoto ? 'Guardando…' : 'Guardar foto'}
                </Button>
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
          <form onSubmit={manejarActualizarDatos} noValidate className="space-y-5">
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
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={usuarioInput}
                  onChange={(e) => setUsuarioInput(e.target.value)}
                  placeholder={usuario}
                  minLength={3}
                  maxLength={30}
                  title='Entre 3 y 30 caracteres: letras, números, ".", "_" o "-", sin espacios'
                  className={inputConError(erroresPerfil.usuario)}
                />
                <CampoError mensaje={erroresPerfil.usuario} />
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
                  <Obligatorio />
                </label>
                <input
                  type="email"
                  value={correo}
                  maxLength={150}
                  onChange={(e) => setCorreo(e.target.value)}
                  className={inputConError(erroresPerfil.correo)}
                />
                <CampoError mensaje={erroresPerfil.correo} />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={telefono}
                  inputMode="numeric"
                  onChange={(e) => setTelefono(formatearTelefono(e.target.value))}
                  placeholder="8741-8543"
                  className={inputConError(erroresPerfil.telefono)}
                />
                <CampoError mensaje={erroresPerfil.telefono} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="primary"
                type="submit"
                disabled={guardandoDatos}>
                {guardandoDatos ? 'Guardando…' : 'Guardar cambios'}
              </Button>
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
