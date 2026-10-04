import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { erroresPorCampo, tieneErroresDeCampo } from '../../components/Services/erroresApi'
import CampoError, { Obligatorio, enfocarPrimerError } from '../../components/common/CampoError'
import { useAuth } from '../../contexts/AuthContext'
import { nombreVisible, obtenerAbonados, type Abonado } from '../../components/Services/abonados.service'
import {
  cambiarEstadoSolicitudCambioMedidor,
  crearSolicitudCambioMedidor,
  obtenerSolicitudesCambioMedidor,
  MOTIVOS_FALLA_MEDIDOR,
  type SolicitudCambioMedidor,
  type MotivoFallaMedidor,
} from '../../components/Services/cambioMedidor.service'
import { descargarArchivo, extensionDesdeUrl } from '../../lib/descargarArchivo'
import {
  FileDropZone,
  validarDocumento,
} from '../../components/common/FileDropZone'
import Toast from '../../components/ui/Toast'
import BarraFiltrosSolicitudes from '../../components/Dashboard/BarraFiltrosSolicitudes'
import PaginadorSolicitudes from '../../components/Dashboard/PaginadorSolicitudes'
import {
  useFiltrosSolicitudes,
  ESTADOS_ABONADO,
} from '../../lib/useFiltrosSolicitudes'
import Modal from '../../components/ui/Modal'
import Table from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import BadgeEstado, { etiquetaEstado } from '../../components/ui/BadgeEstado'
import Tabs from '../../components/ui/Tabs'
import Button from '../../components/ui/Button'

function formatearFecha(fecha: string): string {
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
}

function SolicitudesCambioMedidor() {
  const { rolEfectivo } = useAuth()
  const esAbonado = rolEfectivo === 'Abonado'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">Cambio de Medidor por Daños</h1>
        <p className="mt-1 text-sm text-primary-500">
          {esAbonado
            ? 'Solicitá el cambio o revisión técnica del medidor registrado en tu propiedad'
            : 'Gestioná las solicitudes de cambio o revisión de medidor de los abonados'}
        </p>
      </div>

      {esAbonado ? <VistaAbonado /> : <VistaAdministrador />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista del ABONADO: formulario con motivo, dirección, justificación y
// evidencia fotográfica opcional.
// ---------------------------------------------------------------------------
function VistaAbonado() {
  const [motivoFalla, setMotivoFalla] = useState<MotivoFallaMedidor | ''>('')
  const [direccionExacta, setDireccionExacta] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null)
  const [errorArchivo, setErrorArchivo] = useState('')

  const [solicitudes, setSolicitudes] = useState<SolicitudCambioMedidor[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const enviandoRef = useRef(false)
  const [error, setError] = useState('')
  const [erroresCampo, setErroresCampo] = useState<Partial<Record<string, string>>>({})
  const [mensaje, setMensaje] = useState('')

  // Alterna entre ver el historial y generar una solicitud nueva, en vez de
  // mostrar ambas cosas apiladas en la misma pantalla.
  const [vista, setVista] = useState<'lista' | 'crear'>('lista')

  const tieneAbierta = useMemo(
    () =>
      solicitudes.some((s) => s.estado === 'pendiente' || s.estado === 'en_proceso'),
    [solicitudes],
  )

  const cargar = useCallback(async () => {
    try {
      const lista = await obtenerSolicitudesCambioMedidor()
      setSolicitudes(lista)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar tus solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const handleFileSelect = (file: File) => {
    const errorMsg = validarDocumento(file)
    if (errorMsg) {
      setErrorArchivo(errorMsg)
      setArchivo(null)
      setArchivoPreview(null)
      return
    }
    setErrorArchivo('')
    setArchivo(file)
    if (file.type.startsWith('image/')) {
      setArchivoPreview(URL.createObjectURL(file))
    } else {
      setArchivoPreview(null)
    }
  }

  const handleRemoveFile = () => {
    setArchivo(null)
    setArchivoPreview(null)
    setErrorArchivo('')
  }

  const limpiarFormulario = () => {
    setMotivoFalla('')
    setDireccionExacta('')
    setJustificacion('')
    setArchivo(null)
    setArchivoPreview(null)
    setErrorArchivo('')
  }

  // Al corregir un campo se limpian los errores; se recalculan al enviar.
  useEffect(() => setErroresCampo({}), [motivoFalla, direccionExacta, justificacion])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setErroresCampo({})
    const errs: Record<string, string> = {}
    setMensaje('')

    if (enviandoRef.current) return

    if (!motivoFalla) errs.motivoFalla ??= 'Debes seleccionar un motivo de falla.'

    const direccionLimpia = direccionExacta.trim()
    const justificacionLimpia = justificacion.trim()
    if (direccionLimpia.length < 15) errs.direccion ??= 'Las señas escritas deben tener al menos 15 caracteres.'
    if (justificacionLimpia.length < 10) errs.justificacion ??= 'La justificación debe tener al menos 10 caracteres.'

    enviandoRef.current = true
    if (Object.keys(errs).length > 0) {
      setErroresCampo(errs)
      enfocarPrimerError()
      return
    }

    setEnviando(true)
    try {
      await crearSolicitudCambioMedidor({
        motivoFalla,
        direccionExacta: direccionLimpia,
        justificacion: justificacionLimpia,
        evidencia: archivo,
      })
      setMensaje('Solicitud de cambio de medidor registrada correctamente. Te notificaremos por correo el resultado.')
      limpiarFormulario()
      await cargar()
      setVista('lista')
    } catch (err) {
      setErroresCampo(erroresPorCampo(err, { direccionExacta: 'direccion', idAbonado: 'abonado' }))
      enfocarPrimerError()
      setError(tieneErroresDeCampo(err) ? '' : err instanceof Error ? err.message : 'No se pudo crear la solicitud.')
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs
        pestanas={[
          { valor: 'lista', etiqueta: 'Mis solicitudes' },
          { valor: 'crear', etiqueta: 'Nueva solicitud' },
        ]}
        activa={vista}
        onCambiar={setVista}
      />

      {vista === 'crear' && (
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-primary-900">Nueva solicitud</h2>
        <p className="mt-1 text-sm text-primary-500">
          Completá los datos del problema técnico con tu medidor y adjuntá una fotografía legible.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="motivoFallaAbonado" className="block text-sm font-medium text-primary-700">
              Motivo de la falla
              <Obligatorio />
            </label>
            <select
              id="motivoFallaAbonado"
              value={motivoFalla}
              onChange={(e) => setMotivoFalla(e.target.value as MotivoFallaMedidor)}
              required
              className="mt-1 w-full rounded-full border border-primary-200 px-4 py-2.5 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              {MOTIVOS_FALLA_MEDIDOR.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <CampoError mensaje={erroresCampo.motivoFalla} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="direccionExactaAbonado" className="block text-sm font-medium text-primary-700">
              Dirección exacta o señas escritas
              <Obligatorio />
            </label>
            <input
              id="direccionExactaAbonado"
              type="text"
              value={direccionExacta}
              onChange={(e) => setDireccionExacta(e.target.value)}
              required
              minLength={15}
              maxLength={255}
              placeholder="Ej: 100 m sur de la escuela, casa blanca con portón negro"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            <CampoError mensaje={erroresCampo.direccion} />
            <p className="mt-1 text-xs text-primary-400">
              Mínimo 15 caracteres para que el personal técnico ubique el medidor.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="justificacionAbonado" className="block text-sm font-medium text-primary-700">
              Detalle técnico o justificación
              <Obligatorio />
            </label>
            <textarea
              id="justificacionAbonado"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              required
              minLength={10}
              maxLength={255}
              rows={3}
              placeholder="Describí qué le ocurre al medidor (fuga, números borrosos, rueda detenida, etc.)"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            <CampoError mensaje={erroresCampo.justificacion} />
          </div>

          <div className="sm:col-span-2">
            <FileDropZone
              archivo={archivo}
              archivoPreview={archivoPreview}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              errorArchivo={errorArchivo}
              label="Fotografía o evidencia del medidor"
              ayuda="Se admiten fotos (.jpg, .jpeg, .png) o el documento en .pdf. Máximo 5 MB."
              obligatorio={false}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
        {mensaje && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
            {mensaje}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            type="submit"
            disabled={tieneAbierta || enviando}>
            {enviando ? 'Subiendo solicitud…' : 'Enviar solicitud'}
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              limpiarFormulario()
              setError('')
              setMensaje('')
            }}>
            Cancelar
          </Button>
          {tieneAbierta && (
            <p className="w-full text-center text-xs font-medium text-yellow-700">
              Ya tenés una solicitud en trámite; esperá a que se resuelva antes de crear otra.
            </p>
          )}
        </div>
      </form>
      )}

      {vista === 'lista' && (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-primary-900">Mis solicitudes</h2>

        {cargando ? (
          <p className="text-sm text-primary-400">Cargando solicitudes…</p>
        ) : solicitudes.length === 0 ? (
          <EmptyState
            titulo="Aún no tenés solicitudes de cambio de medidor"
            descripcion="Tus solicitudes aparecerán aquí junto con su estado y seguimiento."
          />
        ) : (
          <Table cabecera={['Código', 'Motivo', 'Dirección', 'Evidencia', 'Estado', 'Fecha']}>
                {solicitudes.map((s) => (
                  <tr key={s.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-800">{s.codigo_solicitud}</td>
                    <td className="px-4 py-3 font-medium text-primary-800">{s.motivo_falla}</td>
                    <td className="max-w-xs px-4 py-3 text-primary-600 truncate">{s.direccion_exacta}</td>
                    <td className="px-4 py-3">
                      {s.evidencia_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            descargarArchivo(
                              s.evidencia_url as string,
                              `evidencia-${s.codigo_solicitud}${extensionDesdeUrl(s.evidencia_url as string)}`,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                        >
                          Descargar
                        </button>
                      ) : (
                        <span className="text-xs text-primary-400">Sin archivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <BadgeEstado estado={s.estado} />
                    </td>
                    <td className="px-4 py-3 text-primary-500">
                      {formatearFecha(s.fecha_creacion)}
                    </td>
                  </tr>
                ))}
              </Table>
        )}
      </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista del ADMINISTRADOR: selección de abonado, formulario de ventanilla,
// tabla completa y modal para gestionar estados y revisar la fotografía.
// ---------------------------------------------------------------------------
function VistaAdministrador() {
  const [abonados, setAbonados] = useState<Abonado[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [abonadoSel, setAbonadoSel] = useState('')
  const [motivoFalla, setMotivoFalla] = useState<MotivoFallaMedidor | ''>('')
  const [direccionExacta, setDireccionExacta] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null)
  const [errorArchivo, setErrorArchivo] = useState('')
  const [cargandoAbonados, setCargandoAbonados] = useState(true)

  const [solicitudes, setSolicitudes] = useState<SolicitudCambioMedidor[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const enviandoRef = useRef(false)
  const [error, setError] = useState('')
  const [erroresCampo, setErroresCampo] = useState<Partial<Record<string, string>>>({})
  const [mensaje, setMensaje] = useState('')

  const [detalle, setDetalle] = useState<SolicitudCambioMedidor | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [gestionando, setGestionando] = useState(false)

  // Alterna entre ver el listado y generar una solicitud nueva, en vez de
  // mostrar ambas cosas apiladas en la misma pantalla.
  const [vista, setVista] = useState<'lista' | 'crear'>('lista')

  const filtrosLista = useFiltrosSolicitudes(solicitudes, {
    estados: ESTADOS_ABONADO,
    camposBusqueda: (s) => [s.codigo_solicitud, s.nombre_abonado, s.numero_abonado, s.motivo_falla],
    estadoDe: (s) => s.estado,
    fechaDe: (s) => s.fecha_creacion,
  })

  const cargar = useCallback(async () => {
    try {
      const lista = await obtenerSolicitudesCambioMedidor()
      setSolicitudes(lista)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    obtenerAbonados()
      .then(setAbonados)
      .catch(() => setError('No se pudieron cargar los abonados.'))
      .finally(() => setCargandoAbonados(false))
    cargar()
  }, [cargar])

  const abonadosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase().replaceAll('-', '')
    if (!texto) return []
    return abonados.filter((a) => {
      const nombre = nombreVisible(a).toLowerCase()
      const cedula = a.cedula.toLowerCase().replaceAll('-', '')
      return nombre.includes(texto) || cedula.includes(texto)
    })
  }, [abonados, busqueda])

  const abonadoElegido = abonados.find((a) => String(a.id) === abonadoSel)

  const handleFileSelect = (file: File) => {
    const errorMsg = validarDocumento(file)
    if (errorMsg) {
      setErrorArchivo(errorMsg)
      setArchivo(null)
      setArchivoPreview(null)
      return
    }
    setErrorArchivo('')
    setArchivo(file)
    if (file.type.startsWith('image/')) {
      setArchivoPreview(URL.createObjectURL(file))
    } else {
      setArchivoPreview(null)
    }
  }

  const handleRemoveFile = () => {
    setArchivo(null)
    setArchivoPreview(null)
    setErrorArchivo('')
  }

  const limpiarFormulario = () => {
    setAbonadoSel('')
    setBusqueda('')
    setMotivoFalla('')
    setDireccionExacta('')
    setJustificacion('')
    setArchivo(null)
    setArchivoPreview(null)
    setErrorArchivo('')
  }

  // Al corregir un campo se limpian los errores; se recalculan al enviar.
  useEffect(() => setErroresCampo({}), [motivoFalla, direccionExacta, justificacion, busqueda])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setErroresCampo({})
    const errs: Record<string, string> = {}
    setMensaje('')

    if (enviandoRef.current) return

    if (!abonadoElegido || abonadoElegido.estado !== 'Activo') errs.abonado ??= 'Seleccioná un abonado activo para la solicitud.'

    if (!motivoFalla) errs.motivoFalla ??= 'Debes seleccionar un motivo de falla.'

    const direccionLimpia = direccionExacta.trim()
    const justificacionLimpia = justificacion.trim()
    if (direccionLimpia.length < 15) errs.direccion ??= 'Las señas escritas deben tener al menos 15 caracteres.'
    if (justificacionLimpia.length < 10) errs.justificacion ??= 'La justificación debe tener al menos 10 caracteres.'

    enviandoRef.current = true
    if (Object.keys(errs).length > 0 || !abonadoElegido) {
      setErroresCampo(errs)
      enfocarPrimerError()
      return
    }

    setEnviando(true)
    try {
      await crearSolicitudCambioMedidor({
        idAbonado: Number(abonadoElegido.id),
        motivoFalla,
        direccionExacta: direccionLimpia,
        justificacion: justificacionLimpia,
        evidencia: archivo,
      })
      setMensaje('Solicitud de cambio de medidor registrada correctamente.')
      limpiarFormulario()
      await cargar()
      setVista('lista')
    } catch (err) {
      setErroresCampo(erroresPorCampo(err, { direccionExacta: 'direccion', idAbonado: 'abonado' }))
      enfocarPrimerError()
      setError(tieneErroresDeCampo(err) ? '' : err instanceof Error ? err.message : 'No se pudo crear la solicitud.')
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  // Resultado de gestionar una solicitud desde el modal. Va separado de
  // mensaje/error, que son del formulario de ventanilla: ese formulario se ve
  // donde la persona está escribiendo, pero el modal se cierra y la deja
  // viendo la lista, así que su resultado se muestra como toast flotante.
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null)

  const gestionar = async (estado: 'en_proceso' | 'aprobado' | 'rechazado') => {
    if (!detalle) return
    setGestionando(true)
    setToast(null)
    try {
      await cambiarEstadoSolicitudCambioMedidor(detalle.id, {
        estado,
        motivoRechazo: estado === 'rechazado' ? motivoRechazo : undefined,
      })
      setToast({
        tipo: 'exito',
        mensaje:
          estado === 'aprobado'
            ? `Solicitud ${detalle.codigo_solicitud} aprobada. Se notificó al abonado por correo.`
            : `Solicitud ${detalle.codigo_solicitud} actualizada a "${etiquetaEstado(estado)}".`,
      })
      setDetalle(null)
      setMotivoRechazo('')
      await cargar()
    } catch (err) {
      setToast({ tipo: 'error', mensaje: err instanceof Error ? err.message : 'No se pudo actualizar la solicitud.' })
    } finally {
      setGestionando(false)
    }
  }

  const abrirDetalle = (s: SolicitudCambioMedidor) => {
    setMotivoRechazo(s.motivo_rechazo ?? '')
    setDetalle(s)
  }

  return (
    <div className="space-y-6">
      <Tabs
        pestanas={[
          { valor: 'lista', etiqueta: 'Solicitudes registradas' },
          { valor: 'crear', etiqueta: 'Generar solicitud' },
        ]}
        activa={vista}
        onCambiar={setVista}
      />

      {vista === 'crear' && (
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-primary-900">Generar solicitud</h2>
        <p className="mt-1 text-sm text-primary-500">
          Creá una solicitud de cambio o reparación de medidor para un abonado del sistema.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Abonado
            </label>

            {abonadoElegido ? (
              <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm shadow-sm">
                <p className="font-medium text-primary-900">{nombreVisible(abonadoElegido)}</p>
                <button
                  type="button"
                  onClick={() => {
                    setAbonadoSel('')
                    setBusqueda('')
                  }}
                  className="shrink-0 rounded-full border border-primary-200 bg-white px-2.5 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="relative mt-1">
                <input
                  id="busquedaAbonadoMedidor"
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o cédula…"
                  className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
                <CampoError mensaje={erroresCampo.abonado} />
                {busqueda.trim() !== '' && (
                  <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-primary-200 bg-white shadow-lg">
                    {cargandoAbonados ? (
                      <li className="px-3 py-2 text-sm text-primary-400">
                        Cargando abonados…
                      </li>
                    ) : abonadosFiltrados.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-primary-400">
                        No se encontraron abonados con «{busqueda.trim()}».
                      </li>
                    ) : (
                      abonadosFiltrados.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setAbonadoSel(String(a.id))
                              setBusqueda('')
                            }}
                            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50"
                          >
                            <span className="font-medium text-primary-800">{nombreVisible(a)}</span>
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-primary-400">{a.cedula}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  a.estado === 'Activo'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {a.estado}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="motivoFallaAdmin" className="block text-sm font-medium text-primary-700">
              Motivo de la falla
              <Obligatorio />
            </label>
            <select
              id="motivoFallaAdmin"
              value={motivoFalla}
              onChange={(e) => setMotivoFalla(e.target.value as MotivoFallaMedidor)}
              required
              className="mt-1 w-full rounded-full border border-primary-200 px-4 py-2 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              {MOTIVOS_FALLA_MEDIDOR.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <CampoError mensaje={erroresCampo.motivoFalla} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="direccionExactaAdmin" className="block text-sm font-medium text-primary-700">
              Dirección exacta o señas escritas
              <Obligatorio />
            </label>
            <input
              id="direccionExactaAdmin"
              type="text"
              value={direccionExacta}
              onChange={(e) => setDireccionExacta(e.target.value)}
              required
              minLength={15}
              maxLength={255}
              placeholder="Ubicación detallada del medidor para el personal técnico"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            <CampoError mensaje={erroresCampo.direccion} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="justificacionAdmin" className="block text-sm font-medium text-primary-700">
              Detalle técnico o justificación
              <Obligatorio />
            </label>
            <textarea
              id="justificacionAdmin"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              required
              minLength={10}
              maxLength={255}
              rows={3}
              placeholder="Motivo de la solicitud reportado por ventanilla"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            <CampoError mensaje={erroresCampo.justificacion} />
          </div>

          <div className="sm:col-span-2">
            <FileDropZone
              archivo={archivo}
              archivoPreview={archivoPreview}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              errorArchivo={errorArchivo}
              label="Fotografía o evidencia del medidor"
              ayuda="Se admiten fotos (.jpg, .jpeg, .png) o el documento en .pdf. Máximo 5 MB."
              obligatorio={false}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
        {mensaje && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
            {mensaje}
          </p>
        )}

        <div className="mt-5 flex justify-center gap-3">
          <Button
            variant="primary"
            type="submit"
            disabled={enviando}>
            {enviando ? 'Subiendo solicitud…' : 'Registrar solicitud'}
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              limpiarFormulario()
              setError('')
              setMensaje('')
            }}>
            Cancelar
          </Button>
        </div>
      </form>
      )}

      {vista === 'lista' && (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-primary-900">Solicitudes registradas</h2>

        {!cargando && solicitudes.length > 0 && (
          <BarraFiltrosSolicitudes
            busca={filtrosLista.busqueda}
            manejarBusqueda={filtrosLista.cambiarBusqueda}
            placeholder="Buscar por código, abonado o número de abonado…"
            orden={filtrosLista.orden}
            cambiarOrden={filtrosLista.cambiarOrden}
            filtroEstado={filtrosLista.filtroEstado}
            cambiarEstado={filtrosLista.cambiarEstado}
            estados={ESTADOS_ABONADO}
          />
        )}

        {cargando ? (
          <p className="text-sm text-primary-400">Cargando solicitudes…</p>
        ) : solicitudes.length === 0 ? (
          <EmptyState
            titulo="No hay solicitudes de cambio de medidor"
            descripcion="Las solicitudes registradas aparecerán aquí."
          />
        ) : filtrosLista.filtradas.length === 0 ? (
          <EmptyState
            titulo="Ninguna solicitud coincide con la búsqueda o los filtros."
            descripcion="Probá con otro término, cambiá el estado o limpiá la búsqueda."
          />
        ) : (
          <Table cabecera={['Código', 'Abonado', 'Motivo', 'Estado', 'Fecha', 'Acciones']} pie={<><PaginadorSolicitudes
              total={filtrosLista.filtradas.length}
              primeraFila={filtrosLista.primeraFila}
              porPagina={filtrosLista.porPagina}
              paginaActual={filtrosLista.paginaActual}
              totalPaginas={filtrosLista.totalPaginas}
              numerosPagina={filtrosLista.numerosPagina}
              busca={filtrosLista.busqueda}
              etiqueta="solicitudes"
              irPagina={filtrosLista.irPagina}
            /></>}>
                {filtrosLista.filasVisibles.map((s) => (
                  <tr key={s.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-800">{s.codigo_solicitud}</td>
                    <td className="px-4 py-3 text-primary-600">
                      <div className="font-medium text-primary-800">{s.nombre_abonado}</div>
                      <div className="text-xs text-primary-400">{s.numero_abonado}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-800">{s.motivo_falla}</td>
                    <td className="px-4 py-3">
                      <BadgeEstado estado={s.estado} />
                    </td>
                    <td className="px-4 py-3 text-primary-500">
                      {formatearFecha(s.fecha_creacion)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="secondary" size="sm"
                        type="button"
                        onClick={() => abrirDetalle(s)}>
                        Ver / gestionar
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
        )}
      </div>
      )}

      {detalle && (
        <ModalDetalle
          solicitud={detalle}
          motivoRechazo={motivoRechazo}
          setMotivoRechazo={setMotivoRechazo}
          gestionando={gestionando}
          onCerrar={() => setDetalle(null)}
          onGestionar={gestionar}
        />
      )}
      {toast && (
        <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal de detalle y resolución de cambio de medidor con vista de evidencia
// ---------------------------------------------------------------------------
function ModalDetalle({
  solicitud,
  motivoRechazo,
  setMotivoRechazo,
  gestionando,
  onCerrar,
  onGestionar,
}: {
  solicitud: SolicitudCambioMedidor
  motivoRechazo: string
  setMotivoRechazo: (v: string) => void
  gestionando: boolean
  onCerrar: () => void
  onGestionar: (estado: 'en_proceso' | 'aprobado' | 'rechazado') => void
}) {
  const esFinal = solicitud.estado === 'aprobado' || solicitud.estado === 'rechazado'

  // Mínimo de caracteres del motivo al rechazar. Un "no" o un "." no le
  // sirven al abonado, que recibe este texto por correo como única
  // explicación del rechazo.
  const MIN_MOTIVO = 10
  const motivoValido = motivoRechazo.trim().length >= MIN_MOTIVO

  // Primer clic en "Rechazar" solo despliega el campo de motivo; el segundo
  // (ya con motivo válido) confirma el rechazo.
  const [mostrarMotivo, setMostrarMotivo] = useState(false)
  function manejarClicRechazar() {
    if (!mostrarMotivo) {
      setMostrarMotivo(true)
      return
    }
    if (motivoValido) onGestionar('rechazado')
  }

  return (
    <Modal size="2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              {solicitud.codigo_solicitud}
            </h3>
            <p className="mt-0.5 text-sm text-primary-500">
              Solicitud de cambio o revisión de medidor
            </p>
          </div>
          <BadgeEstado estado={solicitud.estado} />
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">Abonado</dt>
            <dd className="mt-0.5 text-primary-800">
              {solicitud.nombre_abonado}{' '}
              <span className="text-primary-400">({solicitud.numero_abonado})</span>
              {solicitud.cedula && (
                <span className="ml-2 text-xs text-primary-500">— Cédula: {solicitud.cedula}</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-primary-400">Motivo de falla</dt>
            <dd className="mt-0.5 font-semibold text-primary-900">{solicitud.motivo_falla}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-primary-400">Fecha de creación</dt>
            <dd className="mt-0.5 text-primary-800">{formatearFecha(solicitud.fecha_creacion)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">Dirección exacta</dt>
            <dd className="mt-0.5 text-primary-800">{solicitud.direccion_exacta}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">Detalle o justificación</dt>
            <dd className="mt-0.5 text-primary-800">{solicitud.justificacion}</dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">Evidencia fotográfica</dt>
            <dd className="mt-1">
              {solicitud.evidencia_url ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      descargarArchivo(
                        solicitud.evidencia_url as string,
                        `evidencia-${solicitud.codigo_solicitud}${extensionDesdeUrl(solicitud.evidencia_url as string)}`,
                      )
                    }
                    className="group relative block overflow-hidden rounded-full border border-primary-200 text-left"
                  >
                    <img
                      src={solicitud.evidencia_url}
                      alt="Evidencia del medidor"
                      className="max-h-48 w-auto rounded-lg object-contain transition-transform group-hover:scale-105"
                      onError={(e) => {
                        // Si es PDF o no se puede cargar imagen directa
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline">
                        Descargar archivo ↓
                      </span>
                    </div>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-primary-400">No se adjuntó evidencia.</p>
              )}
            </dd>
          </div>

          {solicitud.motivo_rechazo && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-red-500">Motivo de rechazo</dt>
              <dd className="mt-0.5 text-red-700">{solicitud.motivo_rechazo}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase text-primary-400">Última actualización</dt>
            <dd className="mt-0.5 text-primary-800">{formatearFecha(solicitud.fecha_actualizacion)}</dd>
          </div>
        </dl>

        {esFinal ? (
          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              type="button"
              onClick={onCerrar}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3 border-t border-primary-100 pt-4">
            {mostrarMotivo && (
              <>
                <label htmlFor="motivoRechazoMedidor" className="block text-sm font-medium text-primary-700">
                  Motivo (obligatorio al rechazar)
                </label>
                <textarea
                  id="motivoRechazoMedidor"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  rows={3}
                  placeholder="Ej: La fotografía adjunta no corresponde al medidor o no se aprecia el daño"
                  className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />

                {motivoRechazo.trim().length > 0 && !motivoValido && (
                  <p className="text-xs text-amber-600">
                    Escribe al menos {MIN_MOTIVO} caracteres para poder rechazar
                    (llevas {motivoRechazo.trim().length}).
                  </p>
                )}
              </>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              {solicitud.estado !== 'en_proceso' && (
                <Button
                  variant="info"
                  type="button"
                  onClick={() => onGestionar('en_proceso')}
                  disabled={gestionando}>
                  {gestionando ? 'Guardando...' : 'Marcar en proceso'}
                </Button>
              )}
              <Button
                variant="success"
                type="button"
                onClick={() => onGestionar('aprobado')}
                disabled={gestionando}>
                {gestionando ? 'Guardando...' : 'Aprobar'}
              </Button>
              <Button
                variant="danger"
                type="button"
                onClick={manejarClicRechazar}
                disabled={gestionando || (mostrarMotivo && !motivoValido)}>
                {gestionando ? 'Guardando...' : 'Rechazar'}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={onCerrar}
                disabled={gestionando}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
</Modal>
  )
}

export default SolicitudesCambioMedidor