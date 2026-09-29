import { client } from './client'
import { download } from './download'

export function template() {
  return download('/import/template')
}

// dryRun=true → hanya validasi (tidak menyimpan). skipDuplicates hanya berlaku saat menyimpan.
export function transactions(file, { dryRun = true, skipDuplicates = true } = {}) {
  const form = new FormData()
  form.append('file', file)
  form.append('dry_run', dryRun ? '1' : '0')
  form.append('skip_duplicates', skipDuplicates ? '1' : '0')
  return client.post('/import/transactions', form)
}
