import { client } from './client'

export function dashboard(params, config = {}) {
  return client.get('/dashboard', { params, ...config })
}

export function daily(params, config = {}) {
  return client.get('/reports/daily', { params, ...config })
}

export function weekly(params, config = {}) {
  return client.get('/reports/weekly', { params, ...config })
}

export function monthly(params, config = {}) {
  return client.get('/reports/monthly', { params, ...config })
}

export function yearly(params, config = {}) {
  return client.get('/reports/yearly', { params, ...config })
}

export function calendar(params, config = {}) {
  return client.get('/reports/calendar', { params, ...config })
}

export function day(date, config = {}) {
  return client.get(`/reports/day/${date}`, config)
}
