import { client } from './client'

export function list(config = {}) {
  return client.get('/wallets', config)
}

export function create(data) {
  return client.post('/wallets', data)
}

export function update(id, data) {
  return client.put(`/wallets/${id}`, data)
}

export function toggle(id) {
  return client.patch(`/wallets/${id}/toggle`)
}

export function remove(id) {
  return client.delete(`/wallets/${id}`)
}

export function transfers(params, config = {}) {
  return client.get('/transfers', { params, ...config })
}

export function createTransfer(data) {
  return client.post('/transfers', data)
}

export function removeTransfer(id) {
  return client.delete(`/transfers/${id}`)
}
