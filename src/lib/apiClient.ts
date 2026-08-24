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
      .then(({ data }) => {
        tokenStore.set(data.accessToken)
        return data.accessToken
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
