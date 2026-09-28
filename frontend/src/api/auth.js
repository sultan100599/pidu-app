import { client } from './client'

export function login({ email, password }) {
  return client.post('/auth/login', { email, password })
}

export function register({ name, email, password, password_confirmation }) {
  return client.post('/auth/register', { name, email, password, password_confirmation })
}

export function me() {
  return client.get('/auth/me')
}

export function logout() {
  return client.post('/auth/logout')
}
