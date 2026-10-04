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

  it('los títulos h1 del dashboard son text-2xl font-semibold text-primary-900', () => {
    const v = violaciones(
      (r) => r.startsWith('pages/Dashboard/') || r.startsWith('components/Dashboard/') || r === 'components/ui/PageHeader.tsx',
      /<h1\b(?!.*text-2xl font-semibold text-primary-900)/,
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
})
