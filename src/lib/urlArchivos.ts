// Mismo criterio que apiClient.ts para resolver la URL base del backend.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Resuelve la URL final de un archivo servido por el backend.
//
// Convive con dos formatos, según cuándo se subió el archivo:
//   - Archivos NUEVOS (desde la migración a Cloudinary): el valor guardado ya
//     es la URL completa del archivo en la nube. Se usa tal cual.
//   - Archivos VIEJOS (anteriores a la migración): el valor es una ruta
//     relativa dentro del servidor (ej: '/uploads/usuarios/foto-123.jpg'),
//     que el backend sigue exponiendo como estático (ver useStaticAssets en
//     main.ts). Para esos se antepone la URL base del backend.
//
// La distinción se hace por el prefijo http, que solo tienen las URLs de la
// nube. Cuando ya no queden archivos viejos en la base de datos, esta función
// se puede simplificar a `return ruta`.
export function resolverUrlArchivo(ruta: string): string {
  if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
    return ruta
  }
  // Las rutas viejas ya vienen con '/' inicial; se normaliza por si acaso.
  return `${API_BASE_URL}${ruta.startsWith('/') ? '' : '/'}${ruta}`
}