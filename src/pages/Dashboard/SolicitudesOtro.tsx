import Cargando from '../../components/ui/Cargando'
import { Notificar } from '../../components/ui/ToastProvider'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { erroresPorCampo, tieneErroresDeCampo } from '../../components/Services/erroresApi'
import CampoError, { Obligatorio, enfocarPrimerError } from '../../components/common/CampoError'
import { useAuth } from '../../contexts/AuthContext'
import { nombreVisible, obtenerAbonados, type Abonado } from '../../components/Services/abonados.service'
import {
  cambiarEstadoSolicitudOtro,
  crearSolicitudOtro,
  obtenerSolicitudesOtro,
  type SolicitudOtro,
} from '../../components/Services/otro.service'
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

// Colores para el distintivo de estado: amarillo (pendiente), azul (en
// proceso), verde (aprobado), rojo (rechazado).
function formatearFecha(fecha: string): string {
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
}

// Estado vacío compartido (mismo esquema visual que el resto del Dashboard).
function SolicitudesOtro() {
  const { rolEfectivo } = useAuth()
  const esAbonado = rolEfectivo === 'Abonado'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-titulo-pagina font-semibold text-primary-900">Otras solicitudes</h1>
        <p className="mt-1 text-sm text-primary-500">
          {esAbonado
            ? 'Solicitá un trámite que no encaja en los tipos predefinidos'
            : 'Gestioná las solicitudes de trámites no predefinidos de los abonados'}
        </p>
      </div>

      {esAbonado ? (
        <VistaAbonado />
      ) : (
        <VistaAdministrador />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista del ABONADO: un formulario para crear su solicitud y la tabla con sus
// propias solicitudes. Quien crea es siempre el abonado logueado.
// ---------------------------------------------------------------------------
function VistaAbonado() {
  const [asunto, setAsunto] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [adjunto, setAdjunto] = useState<File | null>(null)
  const [adjuntoPreview, setAdjuntoPreview] = useState<string | null>(null)
  const [errorArchivo, setErrorArchivo] = useState('')

  // Libera la URL del preview cuando el componente se desmonta o el archivo cambia
  useEffect(() => {
    return () => { if (adjuntoPreview) URL.revokeObjectURL(adjuntoPreview) }
  }, [adjuntoPreview])

  const [solicitudes, setSolicitudes] = useState<SolicitudOtro[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [erroresCampo, setErroresCampo] = useState<Partial<Record<string, string>>>({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const enviandoRef = useRef(false)

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
      const lista = await obtenerSolicitudesOtro()
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

  const handleFileSelect = (archivo: File) => {
    const errorMsg = validarDocumento(archivo)
    if (errorMsg) {
      setErrorArchivo(errorMsg)
      setAdjunto(null)
      if (adjuntoPreview) URL.revokeObjectURL(adjuntoPreview)
      setAdjuntoPreview(null)
      return
    }
    setErrorArchivo('')
    setAdjunto(archivo)
    if (adjuntoPreview) URL.revokeObjectURL(adjuntoPreview)
    setAdjuntoPreview(archivo.type.startsWith('image/') ? URL.createObjectURL(archivo) : null)
  }

  const handleRemoveFile = () => {
    setAdjunto(null)
    if (adjuntoPreview) URL.revokeObjectURL(adjuntoPreview)
    setAdjuntoPreview(null)
    setErrorArchivo('')
  }

  const limpiarFormulario = () => {
    setAsunto('')
    setJustificacion('')
    setAdjunto(null)
    if (adjuntoPreview) URL.revokeObjectURL(adjuntoPreview)
    setAdjuntoPreview(null)
    setErrorArchivo('')
  }

  // Al corregir un campo se limpian los errores; se recalculan al enviar.
  useEffect(() => setErroresCampo({}), [asunto, justificacion])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setErroresCampo({})
    const errs: Record<string, string> = {}
    setMensaje('')

    if (enviandoRef.current) return
    const asuntoLimpio = asunto.trim()
    const justificacionLimpia = justificacion.trim()
    if (asuntoLimpio.length < 20) errs.justificacion ??= 'El asunto debe tener al menos 20 caracteres.'
    if (asuntoLimpio.length > 150) errs.asunto ??= 'El asunto no puede superar los 150 caracteres.'
    if (justificacionLimpia.length < 20) errs.justificacion ??= 'La justificación debe tener al menos 20 caracteres.'

    enviandoRef.current = true
    if (Object.keys(errs).length > 0) {
      setErroresCampo(errs)
      enfocarPrimerError()
      return
    }

    setEnviando(true)
    try {
      await crearSolicitudOtro({
        asunto: asuntoLimpio,
        justificacion: justificacionLimpia,
        adjunto: adjunto ?? undefined,
      })
      setMensaje('Solicitud registrada correctamente. Te notificaremos por correo el resultado.')
      setAsunto('')
      setJustificacion('')
      setAdjunto(null)
      if (adjuntoPreview) URL.revokeObjectURL(adjuntoPreview)
      setAdjuntoPreview(null)
      await cargar()
      setVista('lista')
    } catch (err) {
      setErroresCampo(erroresPorCampo(err, { idAbonado: 'abonado' }))
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
          Describí brevemente el trámite que necesitás; si aplica, adjuntá el documento de soporte.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="asunto" className="block text-sm font-medium text-primary-700">
              Asunto
              <Obligatorio />
            </label>
            <input
              id="asunto"
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              required
              minLength={20}
              maxLength={150}
              placeholder="Ej: Constancia de no adeudar para trámite bancario"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            <CampoError mensaje={erroresCampo.asunto} />
            <p className="mt-1 text-xs text-primary-400">
              Resumen corto del trámite (entre 20 y 150 caracteres).
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="justificacion" className="block text-sm font-medium text-primary-700">
              Justificación
              <Obligatorio />
            </label>
            <textarea
              id="justificacion"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              required
              minLength={20}
              maxLength={2000}
              rows={4}
              placeholder="Explicá en detalle el trámite que solicitás y el motivo"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            <CampoError mensaje={erroresCampo.justificacion} />
          </div>

          <div className="sm:col-span-2">
            <FileDropZone
              archivo={adjunto}
              archivoPreview={adjuntoPreview}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              errorArchivo={errorArchivo}
              label="Documento de soporte"
              ayuda="Opcional. Se admiten fotos (.jpg, .jpeg, .png) o el documento en .pdf. Máximo 5 MB."
              obligatorio={false}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-error-50 px-3 py-2 text-xs font-medium text-error-600">
            {error}
          </p>
        )}
        <Notificar mensaje={mensaje} />

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            type="submit"
            disabled={tieneAbierta || enviando}>
            {enviando ? 'Enviando solicitud…' : 'Enviar solicitud'}
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
            <p className="w-full text-center text-xs font-medium text-advertencia-700">
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
          <Cargando texto="Cargando solicitudes…" />
        ) : solicitudes.length === 0 ? (
          <EmptyState
            titulo="Aún no tenés solicitudes registradas"
            descripcion="Tus solicitudes aparecerán aquí junto con su estado."
          />
        ) : (
          <Table cabecera={['Código', 'Asunto', 'Justificación', 'Estado', 'Fecha']}>
                {solicitudes.map((s) => (
                  <tr key={s.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-800">{s.codigo_solicitud}</td>
                    <td className="max-w-xs px-4 py-3 text-primary-600">{s.asunto}</td>
                    <td className="max-w-xs px-4 py-3 text-primary-600">{s.justificacion}</td>
                    <td className="px-4 py-3">
                      <BadgeEstado estado={s.estado} />
                      {s.motivo_rechazo && s.estado === 'aprobado' && (
                        <p className="mt-1 text-xs text-primary-500">Comentario: {s.motivo_rechazo}</p>
                      )}
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
// Vista del ADMINISTRADOR: formulario para crear solicitudes para un abonado,
// la lista completa y el modal de detalle para aprobar/rechazar.
// ---------------------------------------------------------------------------
function VistaAdministrador() {
  const [abonados, setAbonados] = useState<Abonado[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [abonadoSel, setAbonadoSel] = useState('')
  const [asunto, setAsunto] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [adjunto, setAdjunto] = useState<File | null>(null)
  const [adjuntoPreview, setAdjuntoPreview] = useState<string | null>(null)
  const [errorArchivo, setErrorArchivo] = useState('')
  const [cargandoAbonados, setCargandoAbonados] = useState(true)

  const [solicitudes, setSolicitudes] = useState<SolicitudOtro[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [erroresCampo, setErroresCampo] = useState<Partial<Record<string, string>>>({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const enviandoRef = useRef(false)

  const [detalle, setDetalle] = useState<SolicitudOtro | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [gestionando, setGestionando] = useState(false)

  // Alterna entre ver el listado y generar una solicitud nueva, en vez de
  // mostrar ambas cosas apiladas en la misma pantalla.
  const [vista, setVista] = useState<'lista' | 'crear'>('lista')

  const filtrosLista = useFiltrosSolicitudes(solicitudes, {
    estados: ESTADOS_ABONADO,
    camposBusqueda: (s) => [
      s.codigo_solicitud,
      s.nombre_abonado,
      s.numero_abonado,
      s.asunto,
      s.tipo_solicitud,
    ],
    estadoDe: (s) => s.estado,
    fechaDe: (s) => s.fecha_creacion,
  })

  // Libera la URL del preview cuando el componente se desmonta o el archivo cambia
  useEffect(() => {
    return () => { if (adjuntoPreview) URL.revokeObjectURL(adjuntoPreview) }
  }, [adjuntoPreview])

  const cargar = useCallback(async () => {
    try {
      const lista = await obtenerSolicitudesOtro()
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

  // Búsqueda client-side por nombre o cédula (sin nº de abonado). La cédula
  // se compara ignorando los guiones, para que "1-2222-3333" y "122223333"
  // den el mismo resultado.
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

  const handleFileSelect = (archivo: File) => {
    const errorMsg = validarDocumento(archivo)
    if (errorMsg) {
      setErrorArchivo(errorMsg)
      setAdjunto(null)
      if (adjuntoPreview) URL.revokeObjectURL(adjuntoPreview)
      setAdjuntoPreview(null)
      return
    }
    setErrorArchivo('')
    setAdjunto(archivo)
    if (adjuntoPreview) URL.revokeObjectURL(adjuntoPreview)
    setAdjuntoPreview(archivo.type.startsWith('image/') ? URL.createObjectURL(archivo) : null)
  }

  const handleRemoveFile = () => {
    setAdjunto(null)
    if (adjuntoPreview) URL.revokeObjectURL(adjuntoPreview)
    setAdjuntoPreview(null)
    setErrorArchivo('')
  }

  const limpiarFormulario = () => {
    setAbonadoSel('')
    setBusqueda('')
    setAsunto('')
    setJustificacion('')
    setAdjunto(null)
    if (adjuntoPreview) URL.revokeObjectURL(adjuntoPreview)
    setAdjuntoPreview(null)
    setErrorArchivo('')
  }

  // Al corregir un campo se limpian los errores; se recalculan al enviar.
  useEffect(() => setErroresCampo({}), [asunto, justificacion, busqueda])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setErroresCampo({})
    const errs: Record<string, string> = {}
    setMensaje('')
    if (enviandoRef.current) return
    if (!abonadoElegido || abonadoElegido.estado !== 'Activo') errs.abonado ??= 'Seleccioná un abonado activo para la solicitud.'
    const asuntoLimpio = asunto.trim()
    const justificacionLimpia = justificacion.trim()
    if (asuntoLimpio.length < 20) errs.asunto ??= 'El asunto debe tener al menos 20 caracteres.'
    if (asuntoLimpio.length > 150) errs.asunto ??= 'El asunto no puede superar los 150 caracteres.'
    if (justificacionLimpia.length < 20) errs.justificacion ??= 'La justificación debe tener al menos 20 caracteres.'

    enviandoRef.current = true
    if (Object.keys(errs).length > 0 || !abonadoElegido) {
      setErroresCampo(errs)
      enfocarPrimerError()
      return
    }

    setEnviando(true)
    try {
      await crearSolicitudOtro({
        idAbonado: Number(abonadoElegido.id),
        asunto: asuntoLimpio,
        justificacion: justificacionLimpia,
        adjunto: adjunto ?? undefined,
      })
      setMensaje('Solicitud registrada correctamente.')
      setAsunto('')
      setJustificacion('')
      setAdjunto(null)
      if (adjuntoPreview) URL.revokeObjectURL(adjuntoPreview)
      setAdjuntoPreview(null)
      await cargar()
      setVista('lista')
    } catch (err) {
      setErroresCampo(erroresPorCampo(err, { idAbonado: 'abonado' }))
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
      await cambiarEstadoSolicitudOtro(detalle.id, {
        estado,
        motivoRechazo:
          estado === 'aprobado' || estado === 'rechazado' ? motivoRechazo : undefined,
      })
      setToast({
        tipo: 'exito',
        mensaje:
          estado === 'aprobado'
            ? `Solicitud ${detalle.codigo_solicitud} aprobada. Resolución documentada y notificada por correo.`
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

  const abrirDetalle = (s: SolicitudOtro) => {
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
          Creá una solicitud de trámite no predefinido para un abonado del sistema.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-primary-700">
              Abonado
            </label>

            {abonadoElegido ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-exito-200 bg-exito-50 px-3 py-2.5 text-sm shadow-sm">
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
                  id="busquedaAbonado"
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
                                    ? 'bg-exito-100 text-exito-700'
                                    : 'bg-error-100 text-error-700'
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
            <label htmlFor="asunto" className="block text-sm font-medium text-primary-700">
              Asunto
            </label>
            <input
              id="asunto"
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              required
              minLength={20}
              maxLength={150}
              placeholder="Resumen corto del trámite"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            <CampoError mensaje={erroresCampo.asunto} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="justificacion" className="block text-sm font-medium text-primary-700">
              Justificación
            </label>
            <textarea
              id="justificacion"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              required
              minLength={20}
              maxLength={2000}
              rows={3}
              placeholder="Descripción detallada del trámite"
              className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            <CampoError mensaje={erroresCampo.justificacion} />
          </div>

          <div className="sm:col-span-2">
            <FileDropZone
              archivo={adjunto}
              archivoPreview={adjuntoPreview}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              errorArchivo={errorArchivo}
              label="Documento de soporte"
              ayuda="Opcional. Se admiten fotos (.jpg, .jpeg, .png) o el documento en .pdf. Máximo 5 MB."
              obligatorio={false}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-error-50 px-3 py-2 text-xs font-medium text-error-600">
            {error}
          </p>
        )}
        <Notificar mensaje={mensaje} />

        <div className="mt-5 flex justify-center gap-3">
          <Button
            variant="primary"
            type="submit"
            disabled={enviando}>
            {enviando ? 'Registrando…' : 'Registrar solicitud'}
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

        {cargando ? (
          <Cargando texto="Cargando solicitudes…" />
        ) : solicitudes.length === 0 ? (
          <EmptyState
            titulo="No hay solicitudes registradas"
            descripcion="Las solicitudes de trámites no predefinidos aparecerán aquí."
          />
        ) : (
          <div className="space-y-3">
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
            {filtrosLista.filtradas.length === 0 ? (
              <EmptyState
                titulo="Ninguna solicitud coincide con la búsqueda o los filtros."
                descripcion="Probá con otro término, cambiá el estado o limpiá la búsqueda."
              />
            ) : (
              <Table cabecera={['Código', 'Abonado', 'Asunto', 'Estado', 'Fecha', 'Acciones']} pie={<><PaginadorSolicitudes
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
                        <td className="max-w-xs px-4 py-3 text-primary-600">
                          <span className="font-medium text-primary-700">{s.asunto}</span>
                          {s.adjunto_url && (
                            <span className="mt-0.5 block text-xs text-primary-400">
                              Con documento adjunto
                            </span>
                          )}
                        </td>
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

// Modal de detalle de una solicitud: muestra toda la información y permite
// aprobar o rechazar. Las solicitudes aprobadas/rechazadas ya no admiten
// cambios (estado final). A diferencia de las demás, acá el comentario es
// obligatorio tanto al aprobar como al rechazar (es la resolución del trámite).
function ModalDetalle({
  solicitud,
  motivoRechazo,
  setMotivoRechazo,
  gestionando,
  onCerrar,
  onGestionar,
}: {
  solicitud: SolicitudOtro
  motivoRechazo: string
  setMotivoRechazo: (v: string) => void
  gestionando: boolean
  onCerrar: () => void
  onGestionar: (estado: 'en_proceso' | 'aprobado' | 'rechazado') => void
}) {
  const esFinal = solicitud.estado === 'aprobado' || solicitud.estado === 'rechazado'
 
  // Mínimo de caracteres del comentario de resolución. En este tipo de
  // trámite es obligatorio tanto al aprobar como al rechazar: es la única
  // constancia de qué se resolvió.
  const MIN_MOTIVO = 10
  const motivoValido = motivoRechazo.trim().length >= MIN_MOTIVO

  // Acá el comentario es obligatorio tanto al aprobar como al rechazar, así
  // que el primer clic en cualquiera de los dos solo despliega el campo; el
  // segundo clic (ya con el comentario válido) confirma esa misma acción.
  const [mostrarMotivo, setMostrarMotivo] = useState(false)
  function manejarClic(estado: 'aprobado' | 'rechazado') {
    if (!mostrarMotivo) {
      setMostrarMotivo(true)
      return
    }
    if (motivoValido) onGestionar(estado)
  }

  return (
    <Modal size="2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              {solicitud.codigo_solicitud}
            </h3>
            <p className="mt-0.5 text-sm text-primary-500">
              Solicitud de trámite no predefinido
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
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">Asunto</dt>
            <dd className="mt-0.5 font-medium text-primary-900">{solicitud.asunto}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">Justificación</dt>
            <dd className="mt-0.5 text-primary-800">{solicitud.justificacion}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-primary-400">Documento de soporte</dt>
            <dd className="mt-0.5 text-primary-800">
              {solicitud.adjunto_url ? (
                <button
                  type="button"
                  onClick={() =>
                    descargarArchivo(
                      solicitud.adjunto_url as string,
                      `adjunto-${solicitud.codigo_solicitud}${extensionDesdeUrl(solicitud.adjunto_url as string)}`,
                    )
                  }
                  className="font-medium text-primary-700 underline hover:text-primary-800"
                >
                  Descargar documento adjunto
                </button>
              ) : (
                <span className="text-primary-400">Sin documento adjunto</span>
              )}
            </dd>
          </div>
          {solicitud.motivo_rechazo && (
            <div className="sm:col-span-2">
              <dt
                className={`text-xs font-medium uppercase ${
                  solicitud.estado === 'rechazado' ? 'text-error-600' : 'text-exito-700'
                }`}
              >
                {solicitud.estado === 'rechazado' ? 'Motivo de rechazo' : 'Comentario del administrador'}
              </dt>
              <dd
                className={`mt-0.5 ${
                  solicitud.estado === 'rechazado' ? 'text-error-700' : 'text-exito-700'
                }`}
              >
                {solicitud.motivo_rechazo}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase text-primary-400">Fecha de creación</dt>
            <dd className="mt-0.5 text-primary-800">{formatearFecha(solicitud.fecha_creacion)}</dd>
          </div>
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
                <p className="text-xs text-primary-500">
                  Este trámite no actualiza ningún dato del abonado: dejá un comentario que documente
                  cómo se resolvió. Se enviará por correo al solicitante.
                </p>
                <label htmlFor="motivo" className="block text-sm font-medium text-primary-700">
                  Comentario de la resolución (obligatorio al aprobar o rechazar)
                </label>
                <textarea
                  id="motivo"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  rows={3}
                  placeholder="Ej: se gestionó la constancia solicitada y se entregó al abonado"
                  className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />

                {motivoRechazo.trim().length > 0 && !motivoValido && (
                  <p className="text-xs text-advertencia-700">
                    Escribe al menos {MIN_MOTIVO} caracteres para resolver la
                    solicitud (llevas {motivoRechazo.trim().length}).
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
                onClick={() => manejarClic('aprobado')}
                disabled={gestionando || (mostrarMotivo && !motivoValido)}>
                {gestionando ? 'Guardando...' : 'Aprobar'}
              </Button>
              <Button
                variant="danger"
                type="button"
                onClick={() => manejarClic('rechazado')}
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

export default SolicitudesOtro