// Fuerza la descarga DIRECTA de un archivo (Cloudinary o servido por el
// backend), en vez de dejar que el navegador lo abra en línea — comportamiento
// por defecto de <a target="_blank"> para PDFs e imágenes, que los abre en una
// pestaña nueva en lugar de descargarlos.
//
// Se trae el archivo como blob y se dispara la descarga desde ahí (Blob URL +
// clic sintético en un <a download>), así funciona sin depender de
// configuración del lado del servidor (Content-Disposition) ni del origen
// del archivo.
export async function descargarArchivo(url: string, nombreSugerido: string): Promise<void> {
  try {
    const respuesta = await fetch(url)
    if (!respuesta.ok) {
      throw new Error(`No se pudo descargar el archivo (status ${respuesta.status}).`)
    }
    const blob = await respuesta.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = nombreSugerido
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  } catch {
    // Último recurso si el fetch falla (red, CORS, etc.): abrir el archivo
    // directamente. No es ideal (el navegador decide cómo mostrarlo), pero
    // es mejor que dejar a la persona sin ninguna forma de acceder a él.
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

// Extrae una extensión razonable de la URL (con el punto incluido, o cadena
// vacía si no se encuentra) para armar el nombre sugerido de descarga cuando
// no se conoce de antemano el tipo de archivo.
export function extensionDesdeUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const match = /\.([a-zA-Z0-9]+)$/.exec(pathname)
    return match ? `.${match[1]}` : ''
  } catch {
    return ''
  }
}
