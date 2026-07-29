import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

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
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const MOCK_USERS = [
  {
    id: '1',
    nombre: 'Administrador SIAPB',
    username: 'admin',
    password: 'admin123',
    rol: 'Administrador',
    email: 'admin@siapb.cr',
  },
  {
    id: '2',
    nombre: 'Fontanero Principal',
    username: 'fontanero',
    password: 'fontanero123',
    rol: 'Fontanero',
    email: 'fontanero@siapb.cr',
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('siapb_user')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback((username: string, password: string): boolean => {
    const found = MOCK_USERS.find(
      (u) => u.username === username && u.password === password,
    )
    if (!found) return false

    const userData: User = {
      id: found.id,
      nombre: found.nombre,
      username: found.username,
      rol: found.rol,
      email: found.email,
    }
    setUser(userData)
    localStorage.setItem('siapb_user', JSON.stringify(userData))
    return true
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('siapb_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
