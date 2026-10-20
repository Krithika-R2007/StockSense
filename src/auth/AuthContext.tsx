import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchProfile, login as loginApi, logout as logoutApi } from '../api/endpoints'
import type { User } from '../types/auth'
import { clearTokens, getRefreshToken, hasSession, storeTokens } from './storage'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string, remember: boolean) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasSession()) {
      setLoading(false)
      return
    }
    fetchProfile()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      if (!email.trim() || !password.trim()) {
        throw new Error('Invalid credentials.')
      }
      const res = await loginApi(email, password)
      if (!res.accessToken) throw new Error('Invalid credentials.')
      storeTokens(res.accessToken, res.refreshToken, remember)
      setUser(res.user)
    },
    [],
  )

  const logout = useCallback(async () => {
    const rt = getRefreshToken()
    if (rt) await logoutApi(rt).catch(() => undefined)
    clearTokens()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth requires AuthProvider')
  return ctx
}
