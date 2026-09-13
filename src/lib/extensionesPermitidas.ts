// Regla de extensiones permitidas para CUALQUIER subida de archivo del
// sistema (pedido explícito de Meli): imágenes, Word, Excel, PDF y
// PowerPoint — nada más, para no dejar subir archivos disfrazados con una
// extensión inofensiva. Debe reflejar exactamente
// Backend_IngeII/src/common/config/archivos-permitidos.config.ts.

export const EXTENSIONES_PERMITIDAS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
]

// Valor listo para el atributo accept="" de un <input type="file">.
export const ACCEPT_ARCHIVOS_PERMITIDOS = EXTENSIONES_PERMITIDAS.join(',')

export const MENSAJE_FORMATO_NO_PERMITIDO =
  'Solo se permiten imágenes, documentos Word, Excel, PowerPoint o PDF.'

// Valida por extensión del nombre de archivo (primera línea de defensa en
// el navegador; el backend vuelve a validar por tipo MIME real, que no se
// puede falsificar con solo renombrar el archivo).
export function extensionPermitida(nombreArchivo: string): boolean {
  const nombre = nombreArchivo.toLowerCase()
  return EXTENSIONES_PERMITIDAS.some((ext) => nombre.endsWith(ext))
}
