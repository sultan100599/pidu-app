import { client } from './client'

export function list(params) {
  return client.get('/categories', { params })
}

export function create(data) {
  return client.post('/categories', data)
}

export function update(id, data) {
  return client.put(`/categories/${id}`, data)
}

export function toggle(id) {
  return client.patch(`/categories/${id}/toggle`)
}

export function remove(id) {
  return client.delete(`/categories/${id}`)
}
