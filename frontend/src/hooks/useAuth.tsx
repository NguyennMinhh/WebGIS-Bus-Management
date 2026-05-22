import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import * as authApi from '../services/authApi'
import type { AuthUser, LoginInput, RegisterInput } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (payload: LoginInput) => Promise<AuthUser>
  register: (payload: RegisterInput) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<AuthUser>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const currentUser = await authApi.getCurrentUser()
    setUser(currentUser)
    return currentUser
  }, [])

  useEffect(() => {
    refreshUser()
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [refreshUser])

  const login = useCallback(async (payload: LoginInput) => {
    const currentUser = await authApi.login(payload)
    setUser(currentUser)
    return currentUser
  }, [])

  const register = useCallback(async (payload: RegisterInput) => {
    const currentUser = await authApi.register(payload)
    setUser(currentUser)
    return currentUser
  }, [])

  const logout = useCallback(async () => {
    const currentUser = await authApi.logout()
    setUser(currentUser)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [isLoading, login, logout, refreshUser, register, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
