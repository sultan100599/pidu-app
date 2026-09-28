import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setUnauthorizedHandler, setToken, getToken, resetSessionExpiredFlag } from '../api/client'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setTokenState] = useState(getToken())
  const [initializing, setInitializing] = useState(Boolean(getToken()))
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!getToken()) {
        setInitializing(false)
        return
      }
      try {
        const response = await authApi.me()
        if (!cancelled) setUser(response.data.data)
      } catch {
        setToken(null)
        if (!cancelled) setTokenState(null)
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const handleUnauthorized = useCallback(() => {
    setUser(null)
    setTokenState(null)
    toast.info('Sesi berakhir, silakan login kembali.')
    navigate('/login')
  }, [navigate])

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized)
    return () => setUnauthorizedHandler(null)
  }, [handleUnauthorized])

  async function login(email, password) {
    const response = await authApi.login({ email, password })
    const { token: newToken, user: newUser } = response.data
    setToken(newToken)
    setTokenState(newToken)
    setUser(newUser)
    resetSessionExpiredFlag()
    return newUser
  }

  async function register(payload) {
    const response = await authApi.register(payload)
    const { token: newToken, user: newUser } = response.data
    setToken(newToken)
    setTokenState(newToken)
    setUser(newUser)
    resetSessionExpiredFlag()
    return newUser
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Token mungkin sudah tidak valid; tetap lanjutkan logout lokal.
    }
    setToken(null)
    setTokenState(null)
    setUser(null)
    resetSessionExpiredFlag()
    toast.success('Berhasil logout.')
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, initializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider')
  }
  return context
}
