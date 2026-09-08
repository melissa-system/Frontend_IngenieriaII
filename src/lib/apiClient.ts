import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { tokenStore } from './tokenStore'

// Base URL del backend: configurable con VITE_API_URL en .env,
// con fallback al puerto local por defecto.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Envia cookies (Refresh Token httpOnly) en cada petición al backend.
  withCredentials: true,
})

// Adjunta automáticamente el Access Token (solo en memoria) al header Authorization.
apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Bandera propia por petición para garantizar un único reintento
// (control de ciclos infinitos cuando el refresh también falla).
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _reintentado?: boolean
  }
}

// Rutas de autenticación que nunca deben disparar el refresh silencioso:
// si /auth/login responde 401 son credenciales malas, no token expirado,
// y refrescar sobre /auth/refresh crearía un bucle.
function esRutaAuth(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')
}

// Perfil activo actual (ver selector de perfil en AuthContext.tsx). apiClient
// no es un componente de React y no tiene acceso al contexto, así que
// AuthContext mantiene esta variable de módulo sincronizada con su propio
// estado (ver el useEffect ahí). Sirve para que el refresh SILENCIOSO de acá
// abajo (cuando expira el Access Token a mitad de sesión) también vuelva a
// pedir el rol correcto — si no, /auth/refresh siempre emite con el rol
// base real de la cuenta, y alguien viendo "como Empleado" perdería ese
// perfil sin aviso en cuanto expirara el token (cada 15 min).
type PerfilActivoInterno = 'base' | 'abonado' | 'empleado'
let perfilActivoActual: PerfilActivoInterno = 'base'
export function establecerPerfilActivoParaRefresh(perfil: PerfilActivoInterno): void {
  perfilActivoActual = perfil
}

// --- Refresh silencioso con cola (single-flight) ---
// Si varias peticiones fallan con 401 al mismo tiempo, todas comparten la MISMA
// promesa de refresh: se ejecuta una sola llamada a /auth/refresh y los demás
// reintentos esperan el resultado.
let promesaRefresh: Promise<string> | null = null

interface AuthResponse {
  accessToken: string
}

async function refrescarSesion(): Promise<string> {
  if (!promesaRefresh) {
    // Se usa axios directo (no apiClient) para que esta llamada no pase por
    // este mismo interceptor y no pueda provocar recursión.
    promesaRefresh = axios
      .post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, null, {
        withCredentials: true,
      })
      .then(async ({ data }) => {
        let token = data.accessToken
        if (perfilActivoActual !== 'base') {
          try {
            const { data: cambio } = await axios.post<AuthResponse>(
              `${API_BASE_URL}/auth/cambiar-perfil`,
              { perfil: perfilActivoActual },
              { headers: { Authorization: `Bearer ${token}` }, withCredentials: true },
            )
            token = cambio.accessToken
          } catch {
            // Si el vínculo ya no aplica o falla la llamada, se sigue con
            // el token base recién emitido en vez de tumbar el refresh.
          }
        }
        tokenStore.set(token)
        return token
      })
      .finally(() => {
        promesaRefresh = null
      })
  }
  return promesaRefresh
}

// --- Notificación de sesión expirada ---
// Se usa un evento de window en lugar de callbacks internos del módulo:
// es inmune a duplicación de instancias del módulo (p. ej. HMR/duplicados
// en dev) y cruza cualquier frontera entre copias del código.
export const EVENTO_SESION_EXPIRADA = 'siapb:sesion-expirada'

export function alExpirarSesion(oyente: () => void): () => void {
  window.addEventListener(EVENTO_SESION_EXPIRADA, oyente)
  return () => {
    window.removeEventListener(EVENTO_SESION_EXPIRADA, oyente)
  }
}

function notificarSesionExpirada(): void {
  window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
}

// Interceptor de respuestas: ante 401 por token expirado, renueva la sesión
// en silencio y reintenta la petición original una sola vez.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig | undefined

    if (
      !error.response ||
      error.response.status !== 401 ||
      !original ||
      original._reintentado ||
      esRutaAuth(original.url ?? '')
    ) {
      return Promise.reject(error)
    }

    original._reintentado = true

    try {
      const nuevoToken = await refrescarSesion()
      // Reintento transparente con el Access Token renovado.
      original.headers.Authorization = `Bearer ${nuevoToken}`
      return apiClient(original)
    } catch {
      // Refresh inválido/expirado o error de red: cerrar sesión localmente.
      tokenStore.clear()
      notificarSesionExpirada()
      return Promise.reject(error)
    }
  },
)

export default apiClient
