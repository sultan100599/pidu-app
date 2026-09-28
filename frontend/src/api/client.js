import axios from 'axios'

const TOKEN_KEY = 'pidu_token'

export const client = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
})

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

let onUnauthorized = null
let sessionExpiredToastShown = false

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const isLoginRequest = url.includes('/auth/login')

    if (status === 401 && !isLoginRequest && getToken()) {
      setToken(null)
      if (!sessionExpiredToastShown && onUnauthorized) {
        sessionExpiredToastShown = true
        // Handler dipanggil sekali saja; AuthContext me-reset flag ini saat user login lagi.
        onUnauthorized()
      }
    }
    return Promise.reject(error)
  },
)

export function resetSessionExpiredFlag() {
  sessionExpiredToastShown = false
}
