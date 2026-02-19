import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

interface User {
  id: string
  email: string
  plan: 'free' | 'starter' | 'pro'
  created_at: string
}

interface AuthContextValue {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, confirmPassword: string) => Promise<void>
  setAccessToken: (token: string | null) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchMe = useCallback(async (token: string): Promise<User | null> => {
    try {
      const res = await fetch(`${API_BASE}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [])

  // On mount: try to restore session from httpOnly refresh cookie
  useEffect(() => {
    const restore = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          const token: string = data.access_token
          setAccessToken(token)
          const me = await fetchMe(token)
          setUser(me)
        }
      } catch {
        // Silently fail - user is not logged in
      } finally {
        setIsLoading(false)
      }
    }
    restore()
  }, [fetchMe])

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Login failed.' }))
        throw new Error(err.detail || 'Login failed.')
      }
      const data = await res.json()
      const token: string = data.access_token
      setAccessToken(token)
      const me = await fetchMe(token)
      setUser(me)
    },
    [fetchMe]
  )

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Ignore errors
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const register = useCallback(
    async (email: string, password: string, confirmPassword: string) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, confirm_password: confirmPassword }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Registration failed.' }))
        throw new Error(err.detail || 'Registration failed.')
      }
      const data = await res.json()
      const token: string = data.access_token
      setAccessToken(token)
      const me = await fetchMe(token)
      setUser(me)
    },
    [fetchMe]
  )

  const refreshUser = useCallback(async () => {
    if (accessToken) {
      const me = await fetchMe(accessToken)
      setUser(me)
    }
  }, [accessToken, fetchMe])

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, logout, register, setAccessToken, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
