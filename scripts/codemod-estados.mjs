// Migra los estados de carga y confirmación ad-hoc a los componentes estándar.
// Uso (desde la raíz del repo): node scripts/codemod-estados.mjs [--dry] archivos...
import fs from 'node:fs'
import path from 'node:path'

const dry = process.argv.includes('--dry')
const archivos = process.argv.slice(2).filter((a) => !a.startsWith('--'))

for (const f of archivos) {
  let s = fs.readFileSync(f, 'utf8')
  const orig = s
  const usa = new Set()

  // 1. Página completa cargando
  s = s.replace(
    /<div className="flex items-center justify-center py-20">\s*<p className="[^"]*">(Cargando[^<]*)<\/p>\s*<\/div>/g,
    (_, t) => (usa.add('Cargando'), `<Cargando texto="${t.trim()}" />`),
  )
  // 2. Texto suelto "Cargando solicitudes…" / documentos / publicaciones
  s = s.replace(
    /<p className="(?:py-8 text-center )?text-sm text-primary-(?:400|500)">\s*(Cargando (?:solicitudes|documentos|publicaciones|tus datos)[^<]*?)\s*<\/p>/g,
    (_, t) => (usa.add('Cargando'), `<Cargando texto="${t}" />`),
  )
  // 3. Filas de tabla "Cargando ..."
  s = s.replace(
    /<tr>\s*<td colSpan=\{(\d+)\} className="[^"]*">\s*Cargando[^<]*?\s*<\/td>\s*<\/tr>/g,
    (_, n) => (usa.add('FilasEsqueleto'), `<FilasEsqueleto columnas={${n}} />`),
  )
  // 4. Banners verdes de confirmación -> toast uniforme
  s = s.replace(
    /\{(confirmacion|mensaje|mensajeExito|reenvioMensaje|exito) && \(\s*<(?:div|p)[^>]*bg-green-50[^>]*>\s*(?:✓ )?\{\1\}\s*<\/(?:div|p)>\s*\)\}/g,
    (_, v) => (usa.add('Notificar'), `<Notificar mensaje={${v}} />`),
  )

  if (s === orig) continue
  const dir = path.dirname(f)
  const rel = path.relative(dir, 'src/components/ui').split(path.sep).join('/')
  const pref = rel.startsWith('.') ? rel : `./${rel}`
  const imports = []
  if (usa.has('Cargando') || usa.has('FilasEsqueleto')) {
    const nombres = [usa.has('Cargando') ? 'Cargando' : null, usa.has('FilasEsqueleto') ? '{ FilasEsqueleto }' : null]
    const def = usa.has('Cargando') ? 'Cargando' : ''
    const named = usa.has('FilasEsqueleto') ? (def ? ', { FilasEsqueleto }' : '{ FilasEsqueleto }') : ''
    void nombres
    imports.push(`import ${def}${named} from '${pref}/Cargando'`)
  }
  if (usa.has('Notificar')) imports.push(`import { Notificar } from '${pref}/ToastProvider'`)
  const idx = s.search(/^import /m)
  s = s.slice(0, idx) + imports.join('\n') + '\n' + s.slice(idx)
  console.log(`${dry ? '[dry] ' : ''}${f}: ${[...usa].join(', ')}`)
  if (!dry) fs.writeFileSync(f, s)
}
