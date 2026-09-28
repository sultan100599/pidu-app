import { client } from './client'

export function list(params, config = {}) {
  return client.get('/budgets', { params, ...config })
}

export function create(data) {
  return client.post('/budgets', data)
}

export function update(id, data) {
  return client.put(`/budgets/${id}`, data)
}

export function remove(id) {
  return client.delete(`/budgets/${id}`)
}
