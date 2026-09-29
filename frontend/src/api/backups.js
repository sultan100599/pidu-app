import { client } from './client'
import { download as downloadFile } from './download'

export function list(config = {}) {
  return client.get('/backups', config)
}

export function create() {
  return client.post('/backups')
}

export function download(name) {
  return downloadFile(`/backups/${encodeURIComponent(name)}`)
}
