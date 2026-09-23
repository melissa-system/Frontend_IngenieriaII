import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { obtenerAbonados, type Abonado } from '../../components/Services/abonados.service'
import { obtenerMiResumen, type MiResumen } from '../../components/Services/abonados.service'
import { obtenerAverias, type AveriaBackend } from '../../components/Services/averias.service'

type Rango = 'este-mes' | 'este-trimestre' | 'este-ano' | 'personalizado'

const DIAS_SEMANA_CORTOS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

function getRange(rango: Rango): { desde: string; hasta: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')

  if (rango === 'este-mes') {
    return { desde: `${y}-${m}-01`, hasta: `${y}-${m}-${d}` }
  }
  if (rango === 'este-trimestre') {
    const trimestreInicio = Math.floor((now.getMonth()) / 3) * 3 + 1
    const mi = String(trimestreInicio).padStart(2, '0')
    return { desde: `${y}-${mi}-01`, hasta: `${y}-${m}-${d}` }
  }
  if (rango === 'este-ano') {
    return { desde: `${y}-01-01`, hasta: `${y}-${m}-${d}` }
  }
  return { desde: `${y}-${m}-01`, hasta: `${y}-${m}-${d}` }
}

function fechaEnRango(fecha: string, desde: string, hasta: string): boolean {
  return fecha >= desde && fecha <= hasta
}

// Tarjeta de KPI con dos variantes: "dark" para las métricas más
// destacadas (fondo degradado del azul institucional, con el ícono
// repetido en grande y semitransparente de fondo) y "light" para el
// resto (fondo blanco con el ícono en una insignia circular). Ambas
// variantes se quedan dentro de la paleta primary-* — sin colores nuevos.
function StatCard({
  title,
  value,
  subtitle,
  to,
  icon,
  variant = 'light',
}: {
  title: string
  value: string
  subtitle: string
  to: string
  icon: React.ReactNode
  variant?: 'dark' | 'light'
}) {
  if (variant === 'dark') {
    return (
      <Link
        to={to}
        className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 p-4 text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -top-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-white/10 transition-transform duration-300 group-hover:scale-110 [&>svg]:h-12 [&>svg]:w-12 sm:h-28 sm:w-28 sm:[&>svg]:h-16 sm:[&>svg]:w-16"
        >
          {icon}
        </span>
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white sm:h-9 sm:w-9">
          {icon}
        </span>
        <p className="relative mt-3 truncate text-xs font-medium text-primary-200 sm:mt-4 sm:text-sm">{title}</p>
        <p className="relative mt-1 text-2xl font-semibold sm:text-3xl">{value}</p>
        <p className="relative mt-1 truncate text-[11px] text-primary-300 sm:text-xs">{subtitle}</p>
      </Link>
    )
  }

  return (
    <Link
      to={to}
      className="block rounded-2xl border border-primary-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md sm:p-5"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-700 sm:h-9 sm:w-9">
        {icon}
      </span>
      <p className="mt-3 truncate text-xs font-medium text-primary-500 sm:mt-4 sm:text-sm">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-primary-900 sm:text-3xl">{value}</p>
      <p className="mt-1 truncate text-[11px] text-primary-400 sm:text-xs">{subtitle}</p>
    </Link>
  )
}

// Íconos outline, mismo estilo que el landing (ver diseños/iconos.md):
// viewBox 24x24, stroke="currentColor", trazos redondeados.
function IconAveria() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.732 0-2.813-1.874-1.948-3.374L10.7 4.7c.866-1.5 3.032-1.5 3.898 0l7.005 12.125ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

function IconSolicitud() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function IconStock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  )
}

function IconAbonado() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function IconUsuarios() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3.75 8.25a6.75 6.75 0 0 0-13.5 0M21 15.75a5.25 5.25 0 0 0-3.702-5.02M3 15.75a5.25 5.25 0 0 1 3.702-5.02M18 7.5a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0ZM10.5 7.5a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  )
}

function IconCalendario() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

// Escala de "urgencia" para una avería abierta según sus días sin resolver:
// pocas horas/1 día es normal (celeste), 2-4 días ya amerita atención
// (ámbar), 5+ días es urgente (rojo). Se usa tanto en el calendario como en
// la lista de seguimientos para que el color signifique lo mismo en los dos.
function colorSeveridad(diasAbierta: number): { bg: string; text: string; dot: string } {
  if (diasAbierta >= 5) return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' }
  if (diasAbierta >= 2) return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' }
  return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' }
}

function IconPublicaciones() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
    </svg>
  )
}

// Fila compacta de alerta (no la tarjeta grande de antes): pensada para
// vivir varias juntas dentro de una sola tarjeta contenedora, como una
// mini-lista de pendientes en vez de un bloque de KPIs por separado.
function AlertRow({
  icon,
  color,
  mensaje,
  count,
  to,
}: {
  icon: React.ReactNode
  color: string
  mensaje: string
  count: number
  to: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-primary-50"
    >
      <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${color}`}>
        {icon}
      </span>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-primary-800">{mensaje}</p>
      <span className="flex h-6 min-w-6 flex-none items-center justify-center rounded-full bg-primary-100 px-1.5 text-xs font-bold text-primary-700 group-hover:bg-primary-700 group-hover:text-white">
        {count}
      </span>
    </Link>
  )
}

// Tile de navegación rápida hacia otra sección del dashboard — para que el
// panel principal también sirva como punto de partida, no solo de lectura.
function QuickLink({
  icon,
  label,
  to,
}: {
  icon: React.ReactNode
  label: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-primary-100 bg-white px-3 py-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition-colors group-hover:bg-primary-700 group-hover:text-white">
        {icon}
      </span>
      <span className="text-xs font-medium text-primary-700">{label}</span>
    </Link>
  )
}

function DashboardHome() {
  const { rolEfectivo } = useAuth()

  if (rolEfectivo === 'Abonado') {
    return <DashboardAbonado />
  }

  return <DashboardHomeContenido />
}

function DashboardHomeContenido() {
  const [rango, setRango] = useState<Rango>('este-mes')
  const [desdeCustom, setDesdeCustom] = useState('')
  const [hastaCustom, setHastaCustom] = useState('')
  const { user } = useAuth()
  const primerNombre = user?.nombre?.split(' ')[0] ?? ''

  // El panel solo muestra lo que viene del backend real: Abonados y
  // Averías. Se carga una sola vez al entrar; mientras carga, las tarjetas
  // simplemente muestran 0 en vez de un spinner, que no vale la pena acá.
  const [abonadosReales, setAbonadosReales] = useState<Abonado[]>([])
  useEffect(() => {
    let cancelado = false
    obtenerAbonados()
      .then((data) => {
        if (!cancelado) setAbonadosReales(data)
      })
      .catch(() => {
        // Silencioso a propósito: si falla, el panel simplemente muestra 0
        // para Abonados en vez de romper el resto del dashboard.
      })
    return () => {
      cancelado = true
    }
  }, [])

  const [averiasReales, setAveriasReales] = useState<AveriaBackend[]>([])
  useEffect(() => {
    let cancelado = false
    obtenerAverias()
      .then((data) => {
        if (!cancelado) setAveriasReales(data)
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [])

  const { desde, hasta } = useMemo(() => {
    if (rango === 'personalizado' && desdeCustom && hastaCustom) {
      return { desde: desdeCustom, hasta: hastaCustom }
    }
    return getRange(rango)
  }, [rango, desdeCustom, hastaCustom])

  const abonadosFiltrados = useMemo(
    () => abonadosReales.filter((a) => fechaEnRango(a.fecha_registro, desde, hasta)),
    [abonadosReales, desde, hasta],
  )

  const averiasFiltradas = useMemo(
    () => averiasReales.filter((a) => fechaEnRango(a.fecha_reporte?.slice(0, 10) ?? '', desde, hasta)),
    [averiasReales, desde, hasta],
  )

  const totalAbonados = abonadosFiltrados.length
  const activos = abonadosFiltrados.filter((a) => a.estado === 'Activo').length
  const inactivos = totalAbonados - activos
  const pctActivos = totalAbonados > 0 ? Math.round((activos / totalAbonados) * 100) : 0

  const totalAverias = averiasFiltradas.length
  const averiasPendientes = averiasFiltradas.filter((a) => a.estado === 'Pendiente').length
  const averiasEnProceso = averiasFiltradas.filter((a) => a.estado === 'En proceso').length
  const averiasFinalizadas = averiasFiltradas.filter((a) => a.estado === 'Finalizado').length
  const averiasActivas = averiasPendientes + averiasEnProceso

  const averiasSinAsignar = averiasReales.filter(
    (a) => a.estado === 'Pendiente' && !a.empleado,
  ).length

  // Estas dos vienen directo de abonadosReales (no del filtro de rango):
  // "inactivos" refleja el estado del abonado, y "sin cuenta" detecta
  // abonados con correo registrado pero sin usuario vinculado todavía (ej.
  // si el correo de bienvenida falló o nadie lo vinculó a mano después).
  const abonadosInactivosTotal = abonadosReales.filter((a) => a.estado === 'Inactivo').length
  const abonadosSinCuenta = abonadosReales.filter((a) => !a.usuario_id).length

  // Solo alertas basadas en datos reales — nada de mock. Si algún día se
  // agrega otra alerta acá, que sea sobre un dato que de verdad viene del
  // backend, no una aproximación.
  const alertasActivas = useMemo(
    () =>
      [
        {
          key: 'averias',
          icon: <IconAveria />,
          color: 'bg-red-100 text-red-600',
          mensaje: 'Averías sin asignar',
          count: averiasSinAsignar,
          to: '/dashboard/averias',
        },
        {
          key: 'abonados-inactivos',
          icon: <IconAbonado />,
          color: 'bg-blue-100 text-blue-600',
          mensaje: 'Abonados inactivos',
          count: abonadosInactivosTotal,
          to: '/dashboard/abonados',
        },
        {
          key: 'abonados-sin-cuenta',
          icon: <IconAbonado />,
          color: 'bg-purple-100 text-purple-600',
          mensaje: 'Abonados sin cuenta vinculada',
          count: abonadosSinCuenta,
          to: '/dashboard/abonados',
        },
      ].filter((a) => a.count > 0),
    [averiasSinAsignar, abonadosInactivosTotal, abonadosSinCuenta],
  )

  // Averías todavía sin resolver (Pendiente o En proceso), con sus días de
  // antigüedad desde que se reportaron — es el dato real que alimenta tanto
  // el calendario como la lista de "Requieren seguimiento" de abajo.
  const averiasAbiertas = useMemo(() => {
    const hoyMs = Date.now()
    return averiasReales
      .filter((a) => a.estado !== 'Finalizado')
      .map((a) => {
        const fechaKey = a.fecha_reporte.slice(0, 10)
        const fechaMs = new Date(`${fechaKey}T00:00:00`).getTime()
        const diasAbierta = Number.isNaN(fechaMs)
          ? 0
          : Math.max(0, Math.floor((hoyMs - fechaMs) / (1000 * 60 * 60 * 24)))
        return { ...a, fechaKey, diasAbierta }
      })
      .sort((a, b) => b.diasAbierta - a.diasAbierta)
  }, [averiasReales])

  // Calendario del mes actual: cada celda marca el día con más antigüedad
  // entre las averías abiertas reportadas ese día (si hay más de una).
  const celdasCalendario = useMemo(() => {
    const hoy = new Date()
    const anio = hoy.getFullYear()
    const mes = hoy.getMonth()
    const primerDiaSemana = new Date(anio, mes, 1).getDay()
    const totalDias = new Date(anio, mes + 1, 0).getDate()
    const hoyKey = hoy.toISOString().slice(0, 10)

    const severidadPorDia = new Map<string, number>()
    for (const a of averiasAbiertas) {
      const actual = severidadPorDia.get(a.fechaKey)
      if (actual === undefined || a.diasAbierta > actual) {
        severidadPorDia.set(a.fechaKey, a.diasAbierta)
      }
    }

    const celdas: Array<{ dia: number; fechaKey: string; diasAbierta: number | null; esHoy: boolean }> = []
    for (let i = 0; i < primerDiaSemana; i++) {
      celdas.push({ dia: 0, fechaKey: '', diasAbierta: null, esHoy: false })
    }
    for (let d = 1; d <= totalDias; d++) {
      const fechaKey = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      celdas.push({
        dia: d,
        fechaKey,
        diasAbierta: severidadPorDia.get(fechaKey) ?? null,
        esHoy: fechaKey === hoyKey,
      })
    }
    return celdas
  }, [averiasAbiertas])

  const nombreMesActual = new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric' }).format(new Date())

  return (
    <div className="space-y-6">
      {/* Encabezado: saludo + selector de rango, sin fondo pesado — el
          rango solo afecta a las dos tarjetas de abajo (Abonados/Averías),
          por eso vive junto a ellas y no como una franja aparte. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">
            {primerNombre ? `Hola, ${primerNombre}` : 'Panel de control'}
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            Esto es lo que está pasando en SIAPB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={rango}
            onChange={(e) => setRango(e.target.value as Rango)}
            className="h-10 rounded-full border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="este-mes">Este mes</option>
            <option value="este-trimestre">Este trimestre</option>
            <option value="este-ano">Este a&ntilde;o</option>
            <option value="personalizado">Personalizado</option>
          </select>

          {rango === 'personalizado' && (
            <>
              <input
                type="date"
                value={desdeCustom}
                onChange={(e) => setDesdeCustom(e.target.value)}
                className="rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
              />
              <span className="text-sm text-primary-400">a</span>
              <input
                type="date"
                value={hastaCustom}
                onChange={(e) => setHastaCustom(e.target.value)}
                className="rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none"
              />
            </>
          )}
        </div>
      </div>

      {/* Hero: dos tarjetas protagonistas con datos reales (Abonados y
          Averías), cada una con su propio desglose en vez de repetir el
          mismo molde de KPI 4 veces. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Link
          to="/dashboard/abonados"
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 flex h-32 w-32 items-center justify-center rounded-full bg-white/5 text-white/10 transition-transform duration-300 group-hover:scale-110 [&>svg]:h-20 [&>svg]:w-20"
          >
            <IconAbonado />
          </span>
          <div className="relative flex items-center gap-2 text-primary-200">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              <IconAbonado />
            </span>
            <p className="text-sm font-medium">Abonados</p>
          </div>
          <p className="relative mt-4 text-4xl font-semibold">{totalAbonados}</p>
          <p className="relative mt-1 text-sm text-primary-300">
            registrados {rango === 'este-ano' ? 'este año' : rango === 'este-trimestre' ? 'este trimestre' : rango === 'este-mes' ? 'este mes' : 'en el rango'}
          </p>

          <div className="relative mt-5 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${pctActivos}%` }}
            />
          </div>
          <div className="relative mt-2 flex items-center justify-between text-xs text-primary-200">
            <span>{activos} activos ({pctActivos}%)</span>
            <span>{inactivos} inactivos</span>
          </div>
        </Link>

        <Link
          to="/dashboard/averias"
          className="group relative overflow-hidden rounded-3xl border border-primary-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 flex h-32 w-32 items-center justify-center rounded-full bg-primary-50 text-primary-100 transition-transform duration-300 group-hover:scale-110 [&>svg]:h-20 [&>svg]:w-20"
          >
            <IconAveria />
          </span>
          <div className="relative flex items-center gap-2 text-primary-500">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-700">
              <IconAveria />
            </span>
            <p className="text-sm font-medium">Averías activas</p>
          </div>
          <p className="relative mt-4 text-4xl font-semibold text-primary-900">{averiasActivas}</p>
          <p className="relative mt-1 text-sm text-primary-400">
            de {totalAverias} reportadas en el rango
          </p>

          <div className="relative mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
              {averiasPendientes} pendientes
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {averiasEnProceso} en proceso
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              {averiasFinalizadas} finalizadas
            </span>
          </div>
        </Link>
      </div>

      {/* Alertas: lista compacta, solo si hay algo real que atender. */}
      {alertasActivas.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white p-3 shadow-sm sm:p-4">
          <p className="px-2 pt-1 text-xs font-semibold tracking-wide text-primary-400 uppercase">
            Por revisar
          </p>
          <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-3">
            {alertasActivas.map((a) => (
              <AlertRow key={a.key} icon={a.icon} color={a.color} mensaje={a.mensaje} count={a.count} to={a.to} />
            ))}
          </div>
        </div>
      )}

      {/* Accesos rápidos: el panel también es punto de partida, no solo
          lectura de números. */}
      <div>
        <p className="mb-3 text-xs font-semibold tracking-wide text-primary-400 uppercase">
          Accesos rápidos
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          <QuickLink icon={<IconAbonado />} label="Abonados" to="/dashboard/abonados" />
          <QuickLink icon={<IconAveria />} label="Averías" to="/dashboard/averias" />
          <QuickLink icon={<IconSolicitud />} label="Solicitudes" to="/dashboard/solicitudes" />
          <QuickLink icon={<IconStock />} label="Inventario" to="/dashboard/inventario/articulos" />
          <QuickLink icon={<IconUsuarios />} label="Usuarios" to="/dashboard/seguridad" />
          <QuickLink icon={<IconPublicaciones />} label="Publicaciones" to="/dashboard/administrativo" />
        </div>
      </div>

      {/* Seguimientos: calendario del mes marcando días con averías
          abiertas (por antigüedad) + lista de las que más atención
          necesitan. Reemplaza los gráficos de antes, que duplicaban lo que
          ya muestra Reportes — esto es accionable, no otra estadística. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-700">
              <IconCalendario />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-primary-900">Seguimientos</h2>
              <p className="text-xs text-primary-400 capitalize">{nombreMesActual}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA_CORTOS.map((d, i) => (
              <p key={i} className="text-[11px] font-semibold text-primary-300">
                {d}
              </p>
            ))}
            {celdasCalendario.map((c, i) => {
              if (c.dia === 0) return <div key={i} />
              const severidad = c.diasAbierta !== null ? colorSeveridad(c.diasAbierta) : null
              return (
                <div
                  key={i}
                  title={
                    c.diasAbierta !== null
                      ? `${c.diasAbierta === 0 ? 'Reportada hoy' : `${c.diasAbierta} día(s) sin resolver`}`
                      : undefined
                  }
                  className={`flex aspect-square items-center justify-center rounded-lg text-[11px] font-medium ${
                    severidad ? `${severidad.bg} ${severidad.text}` : 'text-primary-600'
                  } ${c.esHoy ? 'ring-2 ring-primary-700' : ''}`}
                >
                  {c.dia}
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-primary-500">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> reciente
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 2-4 días
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> 5+ días
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary-900">Requieren seguimiento</h2>
            <Link
              to="/dashboard/averias"
              className="text-xs font-semibold text-primary-600 hover:text-primary-800"
            >
              Ver todas
            </Link>
          </div>
          <p className="mt-1 text-sm text-primary-400">Averías abiertas, de más antigua a más reciente</p>

          {averiasAbiertas.length === 0 ? (
            <p className="py-16 text-center text-sm text-primary-400">
              No hay averías pendientes en este momento.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-primary-50">
              {averiasAbiertas.slice(0, 6).map((a) => {
                const severidad = colorSeveridad(a.diasAbierta)
                return (
                  <Link
                    key={a.id}
                    to="/dashboard/averias"
                    className="flex items-center gap-3 py-3 hover:bg-primary-50/50"
                  >
                    <span className={`h-2.5 w-2.5 flex-none rounded-full ${severidad.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-primary-900">{a.tipo_averia}</p>
                      <p className="truncate text-xs text-primary-400">
                        {a.empleado ? `Asignada a ${a.empleado.nombre}` : 'Sin fontanero asignado'}
                      </p>
                    </div>
                    <span className={`flex-none rounded-full px-2.5 py-1 text-xs font-semibold ${severidad.bg} ${severidad.text}`}>
                      {a.diasAbierta === 0 ? 'Hoy' : `${a.diasAbierta} día${a.diasAbierta === 1 ? '' : 's'}`}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Dashboard personalizado para abonados: muestra datos personales,
// resumen de solicitudes y averías, y las 5 más recientes de cada una.
function DashboardAbonado() {
  const [resumen, setResumen] = useState<MiResumen | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false
    obtenerMiResumen()
      .then((data) => {
        if (!cancelado) setResumen(data)
      })
      .catch((err) => {
        if (!cancelado) setError(err.message || 'No se pudo cargar tu resumen.')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => { cancelado = true }
  }, [])

  if (cargando) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-50 via-primary-50 to-white p-4 sm:p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-primary-200/50" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-primary-200/30" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-primary-100/50" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!resumen) return null

  const { abonado, estadisticas, solicitudesRecientes, averiasRecientes } = resumen
  const nombreCompleto = [abonado.nombre, abonado.apellido1, abonado.apellido2]
    .filter(Boolean)
    .join(' ')

  const ESTADO_COLORS: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    en_proceso: 'bg-blue-100 text-blue-700',
    aprobado: 'bg-green-100 text-green-700',
    rechazado: 'bg-red-100 text-red-700',
    Pendiente: 'bg-yellow-100 text-yellow-700',
    'En proceso': 'bg-blue-100 text-blue-700',
    Finalizado: 'bg-green-100 text-green-700',
  }

  return (
    <div className="space-y-6">
      {/* Panel de bienvenida + KPIs */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-50 via-primary-50 to-white p-4 sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary-200/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-primary-300/20 blur-3xl" />
        <div className="relative">
          <h1 className="text-2xl font-semibold text-primary-900">
            Bienvenido, {nombreCompleto}
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            Resumen de tu cuenta como abonado
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <StatCard
            variant="dark"
            icon={<IconSolicitud />}
            title="Mis Solicitudes"
            value={String(estadisticas.totalSolicitudes)}
            subtitle="Total realizadas"
            to="/dashboard/solicitudes"
          />
          <StatCard
            variant="light"
            icon={<IconAveria />}
            title="Mis Reportes de Averías"
            value={String(estadisticas.totalAverias)}
            subtitle="Total reportados"
            to="/dashboard/solicitudes/otro"
          />
        </div>
      </div>

      {/* Datos personales */}
      <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900">Mis datos personales</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Columna 1 */}
          <div>
            <p className="text-xs font-medium text-primary-500">Nombre completo</p>
            <p className="mt-1 text-sm text-primary-900">{nombreCompleto}</p>
          </div>
          {/* Columna 2 */}
          <div>
            <p className="text-xs font-medium text-primary-500">Cédula</p>
            <p className="mt-1 text-sm text-primary-900">{abonado.cedula}</p>
          </div>
          {/* Columna 3 */}
          <div>
            <p className="text-xs font-medium text-primary-500">Teléfono</p>
            <p className="mt-1 text-sm text-primary-900">{abonado.telefono}</p>
          </div>
          {/* Columna 1 */}
          <div>
            <p className="text-xs font-medium text-primary-500">Dirección</p>
            <p className="mt-1 text-sm text-primary-900">{abonado.direccion}</p>
          </div>
          {/* Columna 2 */}
          <div>
            <p className="text-xs font-medium text-primary-500">Correo electrónico</p>
            <p className="mt-1 text-sm text-primary-900">{abonado.correo}</p>
          </div>
          {/* Columna 3 */}
          <div>
            <p className="text-xs font-medium text-primary-500">Tipo de abonado</p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${abonado.tipo_abonado === 'Jurídica' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {abonado.tipo_abonado}
            </span>
          </div>
          {/* Columna 1 */}
          <div>
            <p className="text-xs font-medium text-primary-500">Fecha de registro</p>
            <p className="mt-1 text-sm text-primary-900">
              {new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(abonado.fecha_registro))}
            </p>
          </div>
          {/* Columna 2 */}
          <div>
            <p className="text-xs font-medium text-primary-500">Número de abonado</p>
            <p className="mt-1 text-sm text-primary-900">{abonado.numero_abonado}</p>
          </div>
          {/* Columna 3 */}
          <div>
            <p className="text-xs font-medium text-primary-500">Estado</p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${abonado.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {abonado.estado}
            </span>
          </div>
        </div>
      </div>

      {/* Listas de solicitudes y averías */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Últimas solicitudes */}
        <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary-900">Últimas solicitudes</h2>
            <Link to="/dashboard/solicitudes" className="text-sm font-medium text-primary-600 hover:text-primary-800">
              Ver todas
            </Link>
          </div>
          {solicitudesRecientes.length === 0 ? (
            <p className="mt-4 text-sm text-primary-400">Aún no has realizado solicitudes.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {solicitudesRecientes.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl bg-primary-50/50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary-900">{s.codigo_solicitud}</p>
                    <p className="text-xs text-primary-500">{s.tipo_solicitud}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ESTADO_COLORS[s.estado] || 'bg-gray-100 text-gray-600'}`}>
                      {s.estado}
                    </span>
                    <span className="text-[11px] text-primary-400">
                      {new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'short' }).format(new Date(s.fecha_creacion))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Últimas averías */}
        <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary-900">Últimos reportes de averías</h2>
          </div>
          {averiasRecientes.length === 0 ? (
            <p className="mt-4 text-sm text-primary-400">Aún no has reportado averías.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {averiasRecientes.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-xl bg-primary-50/50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary-900">{a.codigo_averia}</p>
                    <p className="text-xs text-primary-500">{a.tipo_averia}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ESTADO_COLORS[a.estado] || 'bg-gray-100 text-gray-600'}`}>
                      {a.estado}
                    </span>
                    <span className="text-[11px] text-primary-400">
                      {new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'short' }).format(new Date(a.fecha_reporte))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardHome