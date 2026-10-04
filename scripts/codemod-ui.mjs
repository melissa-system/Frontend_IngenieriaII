// Codemod de la guía de estilos: aplica de forma mecánica (y verificable con
// build/lint/tests) los reemplazos por los componentes de src/components/ui.
// Uso: node scripts/codemod-ui.mjs [--dry] archivo1.tsx archivo2.tsx ...
//
// Transformaciones:
//  1. Botones: rounded-lg / rounded-md -> rounded-full dentro de cada <button ...>.
//  2. Colores: gray-N -> primary-N (la guía solo permite la escala primary).
//  3. Modales hechos a mano (overlay + panel) -> <Modal size layer scroll>.
//  4. Tablas simples (cabecera con <th> de texto) -> <Table cabecera pie>.
import fs from 'node:fs'
import path from 'node:path'

const dry = process.argv.includes('--dry')
const files = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const SRC = path.resolve('src')

function relUi(file, nombre) {
  let rel = path.relative(path.dirname(path.resolve(file)), path.join(SRC, 'components/ui', nombre))
  rel = rel.split(path.sep).join('/')
  return rel.startsWith('.') ? rel : './' + rel
}

// Busca el cierre del <tag> que empieza en `start` (posición del '<'), contando
// aperturas/cierres del mismo tag. Devuelve el índice del '<' del cierre.
function cierreDe(src, start, tag) {
  let depth = 0
  const re = new RegExp(`<${tag}(?=[\\s>/])|</${tag}>`, 'g')
  re.lastIndex = start
  let m
  while ((m = re.exec(src))) {
    if (m[0].startsWith('</')) {
      depth--
      if (depth === 0) return m.index
    } else {
      // ¿autocerrado? busca el '>' del tag respetando llaves y comillas
      const end = finDeTag(src, m.index)
      if (src[end - 1] === '/') continue
      depth++
    }
  }
  return -1
}

// Índice del '>' que cierra la etiqueta de apertura que empieza en `start`.
function finDeTag(src, start) {
  let i = start
  let brace = 0
  let quote = null
  for (; i < src.length; i++) {
    const c = src[i]
    if (quote) {
      if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c
      continue
    }
    if (c === '{') brace++
    else if (c === '}') brace--
    else if (c === '>' && brace === 0 && src[i - 1] !== '=') return i
  }
  return -1
}

const stats = {}
function cuenta(f, k, n = 1) {
  stats[f] ??= {}
  stats[f][k] = (stats[f][k] ?? 0) + n
}

function botones(src, f) {
  let out = ''
  let pos = 0
  const re = /<(?:button|select)(?=[\s>])/g
  let m
  while ((m = re.exec(src))) {
    const end = finDeTag(src, m.index)
    if (end < 0) continue
    const tag = src.slice(m.index, end + 1)
    const nuevo = tag.replace(/\brounded-(lg|md)\b/g, () => {
      cuenta(f, 'botonesRedondeo')
      return 'rounded-full'
    })
    out += src.slice(pos, m.index) + nuevo
    pos = end + 1
    re.lastIndex = end + 1
  }
  return out + src.slice(pos)
}

function colores(src, f) {
  return src.replace(/\b((?:[a-z-]+:)*(?:bg|text|border|divide|ring|placeholder)-)gray-(\d{2,3})\b/g, (_, pre, n) => {
    cuenta(f, 'grayAPrimary')
    return `${pre}primary-${n}`
  })
}

// Variante con constantes modalBgCls / modalCls (Proveedores, Averías)
function modalesConstantes(src, f, usados) {
  if (!/const modalBgCls = 'fixed inset-0 z-50 flex items-center justify-center bg-black\/40 p-4'/.test(src)) return src
  let out = src
  const re = /<div className=\{modalBgCls\}>\s*<div className=\{modalCls\}>/g
  let m
  while ((m = re.exec(out))) {
    const ini = m.index
    const cierrePanel = cierreDe(out, ini + m[0].indexOf('<div', 5), 'div')
    const cierreOuter = cierreDe(out, ini, 'div')
    if (cierrePanel < 0 || cierreOuter < 0) continue
    if (out.slice(cierrePanel + 6, cierreOuter).trim() !== '') continue
    out =
      out.slice(0, ini) +
      '<Modal size="2xl">' +
      out.slice(ini + m[0].length, cierrePanel).replace(/\s+$/, '\n') +
      '</Modal>' +
      out.slice(cierreOuter + 6)
    usados.add('Modal')
    cuenta(f, 'modales')
    re.lastIndex = 0
  }
  if (!/modalBgCls|modalCls/.test(out.replace(/^.*const modal(?:Bg)?Cls.*$/gm, ''))) {
    out = out.replace(/^[ \t]*const modalBgCls = .*\n/m, '').replace(/^[ \t]*const modalCls = .*\n/m, '')
  }
  return out
}

function modales(src, f, usados) {
  const reOpen =
    /<div className="fixed inset-0 z-(50|\[60\]|\[70\]) flex items-center justify-center bg-black\/40 p-4">\s*<div className="([^"]*)">/g
  let out = src
  let m
  let guard = 0
  while ((m = reOpen.exec(out)) && guard++ < 200) {
    const [todo, capa, panel] = m
    const size = /max-w-(md|lg|xl|2xl)\b/.exec(panel)?.[1]
    if (!size || !/rounded-xl bg-white p-6 shadow-xl/.test(panel)) continue
    const scroll = /max-h-\[90vh\]/.test(panel) && /overflow-y-auto/.test(panel)
    const resto = panel
      .replace(/max-h-\[90vh\]|overflow-y-auto|w-full|max-w-(md|lg|xl|2xl)|rounded-xl|bg-white|p-6|shadow-xl/g, '')
      .trim()
    if (resto) continue // el panel trae clases extra: se revisa a mano
    const layer = capa === '50' ? '' : ` layer={${capa.replace(/[[\]]/g, '')}}`
    const props = ` size="${size}"${layer}${scroll ? '' : ' scroll={false}'}`
    const ini = m.index
    const cierrePanel = cierreDe(out, ini + todo.indexOf('<div', 5) , 'div')
    const cierreOuter = cierreDe(out, ini, 'div')
    if (cierrePanel < 0 || cierreOuter < 0) continue
    const entre = out.slice(cierrePanel + '</div>'.length, cierreOuter)
    if (entre.trim() !== '') continue
    const nuevoCierre = '</Modal>'
    out =
      out.slice(0, ini) +
      `<Modal${props}>` +
      out.slice(ini + todo.length, cierrePanel).replace(/\s+$/, '\n') +
      nuevoCierre +
      out.slice(cierreOuter + '</div>'.length)
    usados.add('Modal')
    cuenta(f, 'modales')
    reOpen.lastIndex = 0
  }
  return out
}

function tablas(src, f, usados) {
  const reOpen =
    /<div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">\s*<table className="min-w-full divide-y divide-primary-100 text-sm">\s*<thead className="bg-primary-50">\s*<tr>([\s\S]*?)<\/tr>\s*<\/thead>\s*<tbody className="divide-y divide-primary-(?:50|100)">/g
  let out = src
  let m
  let guard = 0
  while ((m = reOpen.exec(out)) && guard++ < 200) {
    const [todo, ths] = m
    const re = /<th className="px-4 py-3 (?:text-left )?font-medium text-primary-700">([^<>{}]*)<\/th>/g
    const labels = []
    let t
    let resto = ths
    while ((t = re.exec(ths))) {
      labels.push(t[1].trim())
      resto = resto.replace(t[0], '')
    }
    if (labels.length === 0 || resto.trim() !== '') continue
    const ini = m.index
    const cierreWrap = cierreDe(out, ini, 'div')
    if (cierreWrap < 0) continue
    const finTbody = out.indexOf('</tbody>', ini + todo.length)
    // tbody sin anidar: la última </tbody> antes del cierre del wrapper
    const cierreTbody = out.lastIndexOf('</tbody>', cierreWrap)
    const afterTable = out.indexOf('</table>', cierreTbody)
    if (cierreTbody < 0 || afterTable < 0 || afterTable > cierreWrap || finTbody < 0) continue
    const filas = out.slice(ini + todo.length, cierreTbody)
    const pie = out.slice(afterTable + '</table>'.length, cierreWrap).trim()
    const cab = `[${labels.map((l) => `'${l.replace(/'/g, "\\'")}'`).join(', ')}]`
    const pieProp = pie ? ` pie={<>${pie}</>}` : ''
    out =
      out.slice(0, ini) +
      `<Table cabecera={${cab}}${pieProp}>` +
      filas +
      `</Table>` +
      out.slice(cierreWrap + '</div>'.length)
    usados.add('Table')
    cuenta(f, 'tablas')
    reOpen.lastIndex = 0
  }
  return out
}

// <button className="..."> con clases estándar -> <Button variant size>
function componenteBoton(src, f, usados) {
  let out = ''
  let pos = 0
  const re = /<button(?=[\s>])/g
  let m
  let n = 0
  while ((m = re.exec(src))) {
    const end = finDeTag(src, m.index)
    if (end < 0) break
    const tag = src.slice(m.index, end + 1)
    const cls = /className="([^"]*)"/.exec(tag)
    const cierre = cierreDe(src, m.index, 'button')
    if (!cls || !/\btype=/.test(tag) || cierre < 0 || /className=\{/.test(tag)) {
      re.lastIndex = end + 1
      continue
    }
    const toks = cls[1].split(/\s+/).filter(Boolean)
    const tiene = (t) => toks.includes(t)
    let variant = null
    if (tiene('bg-primary-700') && tiene('text-white')) variant = 'primary'
    else if (tiene('bg-red-500')) variant = 'danger'
    else if (tiene('bg-green-500')) variant = 'success'
    else if (tiene('bg-blue-500')) variant = 'info'
    else if (tiene('border') && tiene('border-primary-200') && tiene('text-primary-700') && !toks.some((t) => /^bg-/.test(t))) variant = 'secondary'
    if (!variant || !tiene('rounded-full')) {
      re.lastIndex = end + 1
      continue
    }
    const size = tiene('text-xs') ? 'sm' : 'md'
    const descartar = /^(rounded-full|border|border-primary-200|text-primary-700|text-white|bg-(primary-700|red-500|green-500|blue-500|white)|hover:bg-(primary-800|red-600|green-600|blue-600|primary-50)|disabled:[\w:-]+|transition(-colors)?|font-(medium|semibold)|px-\d(\.\d)?|py-\d(\.\d)?|text-(xs|sm))$/
    const extra = toks.filter((t) => !descartar.test(t)).join(' ')
    let nuevoTag = tag.replace('<button', '<Button')
    const props = ` variant="${variant}"${size === 'sm' ? ' size="sm"' : ''}`
    nuevoTag = nuevoTag.replace(/className="[^"]*"/, extra ? `className="${extra}"` : '')
    nuevoTag = nuevoTag.replace('<Button', `<Button${props}`).replace(/\s+>$/, '>').replace(/\s{2,}\n/g, '\n')
    nuevoTag = nuevoTag.replace(/<Button( variant="\w+"(?: size="sm")?)\n([ \t]*)/, (_, v, ind) => `<Button\n${ind}${v.trim()}\n${ind}`)
    out += src.slice(pos, m.index) + nuevoTag + src.slice(end + 1, cierre) + '</Button>'
    pos = cierre + '</button>'.length
    re.lastIndex = pos
    n++
  }
  if (!n) return src
  usados.add('Button')
  cuenta(f, 'botonesComponente', n)
  return out + src.slice(pos)
}

// Encabezado de página: <div flex...><div><h1/><p/></div> [acción] </div> -> <PageHeader>
function pageHeader(src, f, usados) {
  const re =
    /<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">\s*<div>\s*<h1 className="text-2xl font-semibold text-primary-900">\s*([^<>{}]+?)\s*<\/h1>\s*<p className="mt-1 text-sm text-primary-500">\s*([\s\S]*?)\s*<\/p>\s*<\/div>/g
  let out = src
  let m
  let n = 0
  while ((m = re.exec(out))) {
    const ini = m.index
    const cierre = cierreDe(out, ini, 'div')
    if (cierre < 0) continue
    const accion = out.slice(ini + m[0].length, cierre).trim()
    const desc = m[2].trim()
    const descProp = /^\{[\s\S]*\}$/.test(desc) ? `descripcion=${desc}` : `descripcion="${desc.replace(/"/g, '&quot;')}"`
    const accProp = accion ? `\n        accion={\n          <>\n${accion}\n          </>\n        }` : ''
    const nuevo = `<PageHeader\n        titulo="${m[1].trim()}"\n        ${descProp}${accProp}\n      />`
    out = out.slice(0, ini) + nuevo + out.slice(cierre + 6)
    re.lastIndex = 0
    n++
  }
  if (!n) return src
  usados.add('PageHeader')
  cuenta(f, 'pageHeader', n)
  return out
}

function tabs(src, f, usados) {
  const re =
    /<div className="flex gap-6 border-b border-primary-100">\s*<button\s+type="button"\s+onClick=\{\(\) => setVista\('lista'\)\}\s+className=\{`[^`]*`\}\s*>\s*([^<>{}]+?)\s*<\/button>\s*<button\s+type="button"\s+onClick=\{\(\) => setVista\('crear'\)\}\s+className=\{`[^`]*`\}\s*>\s*([^<>{}]+?)\s*<\/button>\s*<\/div>/g
  let n = 0
  const out = src.replace(re, (_, a, b) => {
    n++
    return `<Tabs\n        pestanas={[\n          { valor: 'lista', etiqueta: '${a}' },\n          { valor: 'crear', etiqueta: '${b}' },\n        ]}\n        activa={vista}\n        onCambiar={setVista}\n      />`
  })
  if (n) {
    usados.add('Tabs')
    cuenta(f, 'tabs', n)
  }
  return out
}

function emptyState(src, f, usados) {
  const ini = src.search(/^function EmptyState\b/m)
  if (ini < 0) return src
  const fin = src.indexOf('\n}\n', ini)
  if (fin < 0) return src
  usados.add('EmptyState')
  cuenta(f, 'emptyStateDuplicado')
  return src.slice(0, ini) + src.slice(fin + 4).replace(/^\n/, '')
}

function quitarTopLevel(src, re) {
  const ini = src.search(re)
  if (ini < 0) return src
  const fin = src.indexOf('\n}\n', ini)
  if (fin < 0) return src
  return src.slice(0, ini) + src.slice(fin + 4).replace(/^\n/, '')
}

// BadgeEstado duplicado (estadoColor + ESTADO_LABELS/ESTADO_COLOR + BadgeEstado)
function badgeEstado(src, f, usados) {
  if (!/^function BadgeEstado\b/m.test(src)) return src
  let out = src
  out = quitarTopLevel(out, /^function BadgeEstado\b/m)
  out = quitarTopLevel(out, /^function estadoColor\b/m)
  out = quitarTopLevel(out, /^const ESTADO_LABELS\b/m)
  out = quitarTopLevel(out, /^const ESTADO_COLOR\b/m)
  usados.add('BadgeEstado')
  cuenta(f, 'badgeEstadoDuplicado')
  return out
}

function asegurarImports(src, file, usados) {
  let out = src
  for (const nombre of usados) {
    if (new RegExp(`import[^;\\n]*\\b${nombre}\\b[^;\\n]*from`).test(out)) continue
    const linea = `import ${nombre} from '${relUi(file, nombre)}'\n`
    // después del último import completo
    const re = /^import[\s\S]*?from\s+['"][^'"]+['"][ \t]*;?[ \t]*$/gm
    let last = 0
    let mm
    while ((mm = re.exec(out))) last = mm.index + mm[0].length
    out = out.slice(0, last) + '\n' + linea.trimEnd() + out.slice(last)
  }
  return out
}

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8')
  const usados = new Set()
  let src = original
  src = botones(src, file)
  src = colores(src, file)
  src = modales(src, file, usados)
  src = modalesConstantes(src, file, usados)
  src = tablas(src, file, usados)
  src = componenteBoton(src, file, usados)
  src = tabs(src, file, usados)
  src = pageHeader(src, file, usados)
  src = emptyState(src, file, usados)
  src = badgeEstado(src, file, usados)
  src = asegurarImports(src, file, usados)
  if (src !== original && !dry) fs.writeFileSync(file, src)
  console.log(path.basename(file), JSON.stringify(stats[file] ?? {}))
}
