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

// Abonado o Empleado vinculado a la cuenta (ver GET /auth/perfil). Una
// cuenta puede tener los dos a la vez — ej. alguien de la Junta que
// también es abonado — de ahí el selector de perfil.
interface VinculoAbonado {
  id: number
  nombre: string
}
interface VinculoEmpleado {
  id: number
  nombre: string
  puesto: string
  /** Rol (enum crudo, ej. 'admin') que le correspondería a este vínculo
   * según su puesto — null si el puesto no está mapeado a un rol, en cuyo
   * caso no tiene sentido ofrecer "ver como Empleado" (ver cambiarPerfil). */
  rol: string | null
}
interface Vinculos {
  empleado: VinculoEmpleado | null
  abonado: VinculoAbonado | null
}

const SIN_VINCULOS: Vinculos = { empleado: null, abonado: null }

// 'base': la vista normal según el rol de la cuenta (Administrador, Junta
// Directiva, Fontanero o Abonado). 'abonado'/'empleado': fuerza la vista del
// vínculo correspondiente aunque el rol base de la cuenta sea otro — solo
// tiene sentido si ese vínculo existe (ver cambiarPerfil). Cubre los dos
// sentidos: personal que también es abonado, y abonados con un Empleado
// vinculado (ej. Junta Directiva).
export type PerfilActivo = 'base' | 'abonado' | 'empleado'

interface User {
  id: string
  nombre: string
  username: string
  rol: string
  email: string
  vinculos: Vinculos
  /** Foto de perfil (ver PerfilEditar.tsx). null hasta que carga o si nunca se subió una. */
  fotoUrl: string | null
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  /** 'restoring': intentando recuperar la sesión al recargar la página */
  status: 'restoring' | 'authenticated' | 'unauthenticated'
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  /** Rol efectivo a mostrar: 'Abonado' cuando perfilActivo === 'abonado', si no, user.rol tal cual. */
  rolEfectivo: string | null
  perfilActivo: PerfilActivo
  /** Cambia el perfil visible sin cerrar sesión. Solo tiene efecto si el destino es válido para esta cuenta. */
  cambiarPerfil: (perfil: PerfilActivo) => void
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
    // Se completan aparte con cargarDatosExtendidos(): /auth/login y
    // /auth/refresh no traen esta información, y no vale la pena bloquear
    // el login por ella (si falla, el selector de perfil y la foto
    // simplemente no aparecen).
    vinculos: SIN_VINCULOS,
    fotoUrl: null,
  }
}

function aplicarSesion(data: AuthResponse, setUser: (u: User) => void): void {
  // El Access Token vive únicamente en memoria (nunca en localStorage).
  tokenStore.set(data.accessToken)
  setUser(mapearUsuario(data.user))
}

// GET /auth/perfil ya resuelve ambos vínculos y la foto (ver
// AuthService.obtenerPerfilCompleto); se reutiliza acá solo para completar
// 'vinculos' y 'fotoUrl' sin duplicar esa llamada a la BD en otro endpoint
// nuevo. PerfilEditar.tsx hace su propio fetch completo (PerfilCompleto)
// porque necesita más campos (nombre, cédula, etc.) — este solo toma lo
// que usan el header y el sidebar.
interface RespuestaPerfilExtendida {
  vinculos?: Vinculos
  foto_url?: string | null
  /** Nombre de usuario elegido (ver PerfilEditar.tsx). Si es null, se sigue
   * mostrando el derivado del correo que ya trae mapearUsuario(). */
  username?: string | null
}

async function cargarDatosExtendidos(
  userId: string,
  setUser: (updater: (prev: User | null) => User | null) => void,
): Promise<void> {
  try {
    const { data } = await apiClient.get<RespuestaPerfilExtendida>('/auth/perfil')
    const vinculos = data.vinculos ?? SIN_VINCULOS
    const fotoUrl = data.foto_url ?? null
    setUser((prev) => {
      if (!prev || prev.id !== userId) return prev
      const nombre = data.username ?? prev.nombre
      const username = data.username ?? prev.username
      return { ...prev, vinculos, fotoUrl, nombre, username }
    })
  } catch {
    // Silencioso a propósito: sin vinculos el selector de perfil no
    // aparece y sin foto se sigue mostrando la inicial, pero el resto de
    // la sesión sigue funcionando normal.
  }
}

const PERFIL_ACTIVO_KEY = 'siapb_perfil_activo'

function leerPerfilGuardado(userId: string): PerfilActivo {
  try {
    const guardado = localStorage.getItem(`${PERFIL_ACTIVO_KEY}_${userId}`)
    return guardado === 'abonado' ? 'abonado' : 'base'
  } catch {
    return 'base'
  }
}

function guardarPerfil(userId: string, perfil: PerfilActivo): void {
  try {
    localStorage.setItem(`${PERFIL_ACTIVO_KEY}_${userId}`, perfil)
  } catch {
    // localStorage puede fallar (modo privado, cuota). No es crítico.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] =
    useState<'restoring' | 'authenticated' | 'unauthenticated'>('restoring')
  const [perfilActivo, setPerfilActivo] = useState<PerfilActivo>('base')

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
        setPerfilActivo(leerPerfilGuardado(String(data.user.id)))
        void cargarDatosExtendidos(String(data.user.id), setUser)
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
      setPerfilActivo('base')
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
      setPerfilActivo(leerPerfilGuardado(String(data.user.id)))
      void cargarDatosExtendidos(String(data.user.id), setUser)
    },
    [],
  )

  const logout = useCallback(() => {
    // Limpiar siempre el estado local primero para nunca quedar atrapado logueado;
    // la revocación del Refresh Token en el backend va aparte (fire-and-forget).
    tokenStore.clear()
    setUser(null)
    setStatus('unauthenticated')
    setPerfilActivo('base')
    void apiClient.post('/auth/logout').catch(() => undefined)
  }, [])

  // Solo se puede pasar a 'abonado'/'empleado' si la cuenta realmente tiene
  // ese vínculo (y, para 'empleado', si su puesto mapea a un rol); de lo
  // contrario no hace nada (evita un estado inconsistente si se llama por
  // error o con datos vencidos).
  const cambiarPerfil = useCallback(
    (perfil: PerfilActivo) => {
      if (!user) return
      if (perfil === 'abonado' && !user.vinculos.abonado) return
      if (perfil === 'empleado' && !user.vinculos.empleado?.rol) return
      setPerfilActivo(perfil)
      guardarPerfil(user.id, perfil)
    },
    [user],
  )

  const rolEfectivo = user
    ? perfilActivo === 'abonado'
      ? 'Abonado'
      : perfilActivo === 'empleado'
        ? (ROL_LABELS[user.vinculos.empleado?.rol ?? ''] ?? user.rol)
        : user.rol
    : null

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        status,
        login,
        logout,
        rolEfectivo,
        perfilActivo,
        cambiarPerfil,
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
