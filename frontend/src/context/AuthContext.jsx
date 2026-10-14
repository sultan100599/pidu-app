import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '../i18n/toast'
import { setUnauthorizedHandler, setToken, getToken, resetSessionExpiredFlag } from '../api/client'
import * as authApi from '../api/auth'
import { getErrorMessage } from '../utils/errors'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setTokenState] = useState(getToken())
  const [initializing, setInitializing] = useState(Boolean(getToken()))
  const [bootError, setBootError] = useState(null)
  const [bootRetrying, setBootRetrying] = useState(false)
  const navigate = useNavigate()

  const retryRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const response = await authApi.me()
        if (!cancelled) setUser(response.data.data)
      } catch (err) {
        if (cancelled) return
        // Token hanya dibersihkan untuk 401 (token benar-benar tidak valid).
        // Error jaringan / 5xx: token dibiarkan, user bisa mencoba lagi.
        if (err.response?.status === 401) {
          setToken(null)
          setTokenState(null)
          setUser(null)
        } else {
          setBootError(getErrorMessage(err))
        }
      } finally {
        if (!cancelled) {
          setInitializing(false)
          setBootRetrying(false)
        }
      }
    }

    // Tombol "Coba lagi" (event handler): boleh setState sinkron, lalu ulangi me().
    retryRef.current = () => {
      setBootError(null)
      setBootRetrying(true)
      // initializing=true mencegah ProtectedRoute/GuestRoute redirect selama
      // user masih null (carry-over review-3: user harus kembali ke halaman asal).
      setInitializing(true)
      bootstrap()
    }

    if (getToken()) {
      bootstrap()
    }

    return () => {
      cancelled = true
    }
  }, [])

  const retryBootstrap = useCallback(() => {
    retryRef.current?.()
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

  // Bersihkan sesi di perangkat ini, mis. setelah keluar dari semua perangkat atau hapus akun.
  function endSession(message = 'Berhasil logout.') {
    setToken(null)
    setTokenState(null)
    setUser(null)
    resetSessionExpiredFlag()
    toast.success(message)
    navigate('/login')
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Token mungkin sudah tidak valid; tetap lanjutkan logout lokal.
    }
    endSession()
  }

  return (
    <AuthContext.Provider
      value={{ user, token, initializing, bootError, bootRetrying, retryBootstrap, login, register, logout, endSession, setUser }}
    >
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
