// Revisión automática contra la guía de estilos (diseños/componentes.md).
// Recorre el código de src/ y falla si reaparece un patrón que la guía
// prohíbe: así la lista de revisión no depende de que alguien la recuerde.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve('src')

function archivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return archivos(p)
    return /\.(tsx|ts)$/.test(e.name) ? [p] : []
  })
}

const TODOS = archivos(SRC).map((f) => ({
  ruta: path.relative(SRC, f).split(path.sep).join('/'),
  texto: fs.readFileSync(f, 'utf8'),
}))

function violaciones(filtro: (ruta: string) => boolean, patron: RegExp): string[] {
  const out: string[] = []
  for (const { ruta, texto } of TODOS) {
    if (!filtro(ruta)) continue
    texto.split('\n').forEach((linea, i) => {
      if (patron.test(linea)) out.push(`${ruta}:${i + 1}: ${linea.trim().slice(0, 100)}`)
    })
  }
  return out
}

// Etiquetas de apertura <tag ...> (con llaves anidadas) que cumplen un patrón.
function etiquetas(tag: string, patron: RegExp): string[] {
  const out: string[] = []
  const re = new RegExp(`<${tag}\\b(?:[^>{]|\\{[^}]*\\})*>`, 'g')
  for (const { ruta, texto } of TODOS) {
    if (!ruta.endsWith('.tsx')) continue
    for (const m of texto.matchAll(re)) {
      if (patron.test(m[0])) out.push(`${ruta}:${texto.slice(0, m.index).split('\n').length}`)
    }
  }
  return out
}

describe('guía de estilos (diseños/componentes.md)', () => {
  it('no usa colores fuera de la paleta (gray, slate, zinc, neutral, stone)', () => {
    const v = violaciones(
      (r) => r.endsWith('.tsx'),
      /\b(bg|text|border|divide|ring|placeholder)-(gray|slate|zinc|neutral|stone)-\d+/,
    )
    assert.deepEqual(v, [])
  })

  it('no usa rounded-md', () => {
    assert.deepEqual(violaciones((r) => r.endsWith('.tsx'), /\brounded-md\b/), [])
  })

  it('los botones son rounded-full (nunca rounded-lg), salvo la fila de perfil del sidebar', () => {
    const v = etiquetas('button', /\brounded-lg\b/).filter((x) => !x.startsWith('components/Dashboard/Sidebar.tsx'))
    assert.deepEqual(v, [])
  })

  it('los selects son rounded-full', () => {
    assert.deepEqual(etiquetas('select', /\brounded-(lg|md)\b/), [])
  })

  it('los modales usan <Modal> (sin overlays fixed inset-0 a mano)', () => {
    const permitidos = [
      'components/ui/Modal.tsx',
      'components/common/ModalConfirmacion.tsx',
      'components/Dashboard/DashboardLayout.tsx', // overlay del menú móvil
    ]
    const v = violaciones((r) => r.endsWith('.tsx') && !permitidos.includes(r), /fixed inset-0/)
    assert.deepEqual(v, [])
  })

  it('las tablas usan <Table> (sin <table> a mano)', () => {
    const v = violaciones((r) => r.endsWith('.tsx') && r !== 'components/ui/Table.tsx', /<table\b/)
    assert.deepEqual(v, [])
  })

  it('los títulos h1 del dashboard son text-titulo-pagina font-semibold text-primary-900', () => {
    const v = violaciones(
      (r) => r.startsWith('pages/Dashboard/') || r.startsWith('components/Dashboard/') || r === 'components/ui/PageHeader.tsx',
      /<h1\b(?!.*text-titulo-pagina font-semibold text-primary-900)/,
    )
    assert.deepEqual(v, [])
  })

  it('no repite componentes ya estandarizados (EmptyState, BadgeEstado)', () => {
    const v = violaciones(
      (r) => r.endsWith('.tsx') && !r.startsWith('components/ui/'),
      /^function (EmptyState|BadgeEstado)\b/,
    )
    assert.deepEqual(v, [])
  })

  // ── Estados de interfaz estandarizados (carga, vacío, error, confirmación) ──
  const FUERA_UI = (r: string) => r.endsWith('.tsx') && !r.startsWith('components/ui/')

  it('la carga usa <Cargando> o <FilasEsqueleto> (sin textos "Cargando..." sueltos)', () => {
    const v = violaciones(
      FUERA_UI,
      /^\s*(<(p|span|li|div)\b[^>]*>)?\s*Cargando [a-záéíóú ]+(\.\.\.|…)\s*(<\/\w+>)?\s*$/i,
    ).filter((x) => !/Cargando (roles|abonados|la verificación)/i.test(x))
    assert.deepEqual(v, [])
  })

  it('los errores de carga usan <ErrorState> (sin cajas rojas border-red-200 bg-red-50 p-5/p-6 a mano)', () => {
    const v = violaciones(FUERA_UI, /border-red-200 bg-red-50 p-[56] text-center/)
    assert.deepEqual(v, [])
  })

  it('la confirmación de acciones usa el toast global (sin banners verdes bg-green-50 con mensaje)', () => {
    const v = violaciones(
      FUERA_UI,
      /\b(rounded-lg|rounded-xl) (border border-green-200 )?bg-green-50 (px|p)-[0-9] .*text-green-8/,
    )
    assert.deepEqual(v, [])
  })

  it('existen los componentes de estado', () => {
    for (const f of ['Cargando', 'ErrorState', 'EmptyState', 'ToastProvider', 'Toast']) {
      assert.ok(fs.existsSync(path.join(SRC, 'components/ui', `${f}.tsx`)), `falta ${f}.tsx`)
    }
  })

  // ── Navegación y responsividad ──
  const leer = (r: string) => TODOS.find((t) => t.ruta === r)?.texto ?? ''

  it('el layout del dashboard muestra breadcrumbs y no permite desbordamiento horizontal', () => {
    const l = leer('components/Dashboard/DashboardLayout.tsx')
    assert.match(l, /<Breadcrumbs \/>/)
    assert.match(l, /overflow-x-hidden/)
    assert.match(l, /min-w-0/)
  })

  it('todas las rutas del menú tienen una ruta registrada en AppRoutes', () => {
    const menu = leer('lib/menuConfig.tsx')
    const rutas = leer('routes/AppRoutes.tsx')
    const destinos = [...menu.matchAll(/to: '(\/dashboard[^'?]*)'/g)].map((m) => m[1])
    assert.ok(destinos.length > 10)
    for (const d of destinos) {
      const rel = d.replace('/dashboard/', '').replace('/dashboard', '')
      const ok = rel === '' ? /<Route index/.test(rutas) : rutas.includes(`path="${rel}"`)
      assert.ok(ok, `sin ruta para ${d}`)
    }
  })

  it('botones, pestañas y filtros tienen área táctil de 44 px (pointer-coarse)', () => {
    assert.match(leer('components/ui/Button.tsx'), /pointer-coarse:min-h-11/)
    assert.match(leer('components/ui/Tabs.tsx'), /pointer-coarse:min-h-11/)
    assert.match(leer('components/ui/campos.tsx'), /pointer-coarse:h-11/)
    assert.match(leer('components/Dashboard/Sidebar.tsx'), /pointer-coarse:py-3/)
  })

  it('tablas con scroll horizontal, modales con alto dinámico y formularios de 2 columnas responsivos', () => {
    assert.match(leer('components/ui/Table.tsx'), /overflow-x-auto/)
    assert.match(leer('components/ui/Modal.tsx'), /max-h-\[92dvh\]/)
    const v = violaciones((r) => r.endsWith('.tsx'), /<div className="grid grid-cols-2 gap-4">/)
    assert.deepEqual(v, [])
  })

  // ── Tokens centralizados (src/index.css) ──
  it('los colores de estado usan los tokens (exito, advertencia, error, info, acento), no la paleta cruda de Tailwind', () => {
    const v = violaciones(
      (r) => r.endsWith('.tsx'),
      /(?<![\w-])(?:[a-z-]+:)*(bg|text|border|ring|from|to|via|divide|fill|stroke|placeholder|outline|shadow)-(green|emerald|yellow|amber|red|blue|indigo|purple|orange|sky|teal|pink|rose|lime|cyan)-\d+/,
    )
    assert.deepEqual(v, [])
  })

  it('no hay colores hexadecimales sueltos en componentes (salvo gráficos, firma y PDF)', () => {
    const permitidos = ['pages/Dashboard/Reportes.tsx', 'components/common/FirmaCanvas.tsx']
    const v = violaciones(
      (r) => r.endsWith('.tsx') && !permitidos.includes(r),
      /['"`]#[0-9a-fA-F]{6}['"`]/,
    )
    assert.deepEqual(v, [])
  })

  it('index.css define los tokens de color, forma y tipografía', () => {
    const css = fs.readFileSync('src/index.css', 'utf8')
    for (const t of ['--color-primary-700', '--color-exito-700', '--color-advertencia-700', '--color-error-600', '--color-info-600', '--color-acento-700', '--radius-tarjeta', '--shadow-tarjeta', '--text-titulo-pagina', '--font-title']) {
      assert.ok(css.includes(t), `falta ${t}`)
    }
  })

  // ── Biblioteca de componentes: accesibilidad y estados ──
  it('Button: foco visible, estado deshabilitado y cargando accesible', () => {
    const b = leer('components/ui/Button.tsx')
    assert.match(b, /focus-visible:outline/)
    assert.match(b, /disabled:cursor-not-allowed disabled:opacity-50/)
    assert.match(b, /aria-busy/)
  })

  it('campos: etiqueta ligada (htmlFor/id), aria-invalid y aria-describedby, más Fecha y Archivo', () => {
    const c = leer('components/ui/campos.tsx')
    assert.match(c, /htmlFor=/)
    assert.match(c, /aria-invalid/)
    assert.match(c, /aria-describedby/)
    assert.match(c, /export function Fecha/)
    assert.match(c, /export function Archivo/)
    assert.match(c, /export function Select/)
  })

  it('Modal: role dialog, aria-modal, nombre accesible, Escape y retorno de foco', () => {
    const m = leer('components/ui/Modal.tsx')
    assert.match(m, /role="dialog"/)
    assert.match(m, /aria-modal="true"/)
    assert.match(m, /aria-labelledby/)
    assert.match(m, /'Escape'/)
    assert.match(m, /previo\?\.focus/)
    assert.match(m, /export function ModalConfirmar/)
    assert.match(m, /export function ModalFormulario/)
  })

  it('todos los modales de las vistas usan <ModalTitulo> (nombre accesible)', () => {
    const sin: string[] = []
    for (const { ruta, texto } of TODOS) {
      if (!ruta.endsWith('.tsx') || ruta.startsWith('components/ui/')) continue
      const abiertos = (texto.match(/<Modal\b/g) ?? []).length
      const titulos = (texto.match(/<ModalTitulo\b|<ModalConfirmar\b|<ModalFormulario\b/g) ?? []).length
      if (abiertos > 0 && titulos === 0) sin.push(ruta)
    }
    assert.deepEqual(sin, [])
  })

  it('Table: encabezados con scope, ordenamiento con aria-sort y paginación con aria-current', () => {
    const t = leer('components/ui/Table.tsx')
    assert.match(t, /scope="col"/)
    assert.match(t, /aria-sort/)
    assert.match(leer('components/ui/Paginador.tsx'), /aria-current/)
    assert.match(leer('components/ui/Paginador.tsx'), /aria-label="Paginación"/)
  })

  it('alertas y toasts tienen los 4 tipos (éxito, error, advertencia, info) con role', () => {
    const a = leer('components/ui/Alerta.tsx')
    for (const t of ['exito', 'error', 'advertencia', 'info']) assert.match(a, new RegExp(`${t}:`))
    assert.match(leer('components/ui/Toast.tsx'), /TipoToast = 'exito' \| 'error' \| 'advertencia' \| 'info'/)
    assert.match(a, /role=/)
  })

  it('la paginación de las tablas usa <Paginador> (sin contadores "Mostrando" a mano)', () => {
    const v = violaciones((r) => r.endsWith('.tsx') && !r.startsWith('components/ui/'), /Mostrando\{?'? ?\}?\s*$|^\s*Mostrando\{' '\}/)
    assert.deepEqual(v, [])
  })
})
