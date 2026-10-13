import { client } from './client'

export function login({ email, password }) {
  return client.post('/auth/login', { email, password })
}

export function register({ name, email, password }) {
  return client.post('/auth/register', { name, email, password })
}

export function me() {
  return client.get('/auth/me')
}

export function logout() {
  return client.post('/auth/logout')
}

export function forgotPassword(email) {
  return client.post('/auth/forgot-password', { email })
}

export function resetPassword({ token, email, password }) {
  return client.post('/auth/reset-password', { token, email, password })
}

export function updateAccount(payload) {
  return client.put('/account', payload)
}

export function changePassword({ current_password, password }) {
  return client.put('/account/password', { current_password, password })
}
