import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { authService } from '@/services/auth.service'
import { clearTokens, setTokens } from '@/services/api'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    authService
      .getMe()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authService.login({ email, password })
    setTokens(tokens)
    const me = await authService.getMe()
    setUser(me)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token') ?? ''
    await authService.logout(refreshToken)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
