import { client } from './client'

export function list(config = {}) {
  return client.get('/recurring', config)
}

export function create(data) {
  return client.post('/recurring', data)
}

export function update(id, data) {
  return client.put(`/recurring/${id}`, data)
}

export function toggle(id) {
  return client.patch(`/recurring/${id}/toggle`)
}

export function remove(id) {
  return client.delete(`/recurring/${id}`)
}
