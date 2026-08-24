import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import apiClient, { alExpirarSesion } from '../lib/apiClient'
import { tokenStore } from '../lib/tokenStore'

interface User {
  id: string
  nombre: string
  username: string
  rol: string
  email: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  /** 'restoring': intentando recuperar la sesión al recargar la página */
  status: 'restoring' | 'authenticated' | 'unauthenticated'
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// Contrato esperado del backend: POST /auth/login y /auth/refresh responden
// { accessToken, user } y dejan el Refresh Token en una cookie httpOnly.
interface BackendUser {
  id: number | string
  email: string
  role?: string
}

interface AuthResponse {
  accessToken: string
  user: BackendUser
}

// Mapea el enum de roles del backend a la etiqueta en español usada por el menú.
const ROL_LABELS: Record<string, string> = {
  super_admin: 'Junta Directiva',
  admin: 'Administrador',
  fontanero: 'Fontanero',
  abonado: 'Abonado',
}

// La tabla usuarios aún no tiene campo de nombre propio; se deriva del correo
// hasta que exista (los consumidores solo leen user.nombre / user.rol).
function mapearUsuario(backendUser: BackendUser): User {
  const email = backendUser.email ?? ''
  const username = email.split('@')[0]
  return {
    id: String(backendUser.id),
    nombre: username,
    username,
    rol: ROL_LABELS[backendUser.role ?? ''] ?? backendUser.role ?? 'Abonado',
    email,
  }
}

function aplicarSesion(data: AuthResponse, setUser: (u: User) => void): void {
  // El Access Token vive únicamente en memoria (nunca en localStorage).
  tokenStore.set(data.accessToken)
  setUser(mapearUsuario(data.user))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] =
    useState<'restoring' | 'authenticated' | 'unauthenticated'>('restoring')

  // Al recargar la página el Access Token se pierde (memoria volátil);
  // se intenta restaurar la sesión con el Refresh Token de la cookie httpOnly.
  useEffect(() => {
    let cancelado = false
    void apiClient
      .post<AuthResponse>('/auth/refresh')
      .then(({ data }) => {
        if (cancelado) return
        aplicarSesion(data, setUser)
        setStatus('authenticated')
      })
      .catch(() => {
        // Sin sesión activa o refresh expirado: se queda deslogueado.
        if (!cancelado) setStatus('unauthenticated')
      })
    return () => {
      cancelado = true
    }
  }, [])

  // Cuando el interceptor no logra renovar el Access Token (refresh inválido,
  // expirado o error de red), se limpia la sesión y ProtectedRoute
  // redirige automáticamente al login.
  useEffect(() => {
    return alExpirarSesion(() => {
      setUser(null)
      setStatus('unauthenticated')
    })
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      })
      aplicarSesion(data, setUser)
      setStatus('authenticated')
    },
    [],
  )

  const logout = useCallback(() => {
    // Limpiar siempre el estado local primero para nunca quedar atrapado logueado;
    // la revocación del Refresh Token en el backend va aparte (fire-and-forget).
    tokenStore.clear()
    setUser(null)
    setStatus('unauthenticated')
    void apiClient.post('/auth/logout').catch(() => undefined)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        status,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
