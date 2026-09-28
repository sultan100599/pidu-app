import { client } from './client'

export function list(params, config = {}) {
  return client.get('/transactions', { params, ...config })
}

export function get(id) {
  return client.get(`/transactions/${id}`)
}

export function create(data) {
  return client.post('/transactions', data)
}

export function update(id, data) {
  return client.put(`/transactions/${id}`, data)
}

export function remove(id) {
  return client.delete(`/transactions/${id}`)
}
