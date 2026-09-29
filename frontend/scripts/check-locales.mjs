import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { dictionaries } from '../src/i18n/messages.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const keys = Object.keys(dictionaries.id).sort()
const placeholders = (text) => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort()
for (const locale of ['id', 'en', 'su']) {
  assert.deepEqual(Object.keys(dictionaries[locale]).sort(), keys, `Missing keys: ${locale}`)
  for (const key of keys) {
    const value = dictionaries[locale][key]
    assert.equal(typeof value, 'string', `Missing translation: ${locale}: ${key}`)
    assert.ok(value.trim(), `Empty translation: ${locale}: ${key}`)
    assert.ok(!value.includes('—'), `Em dash: ${locale}: ${key}`)
    assert.deepEqual(placeholders(value), placeholders(dictionaries.id[key]), `Interpolation mismatch: ${locale}: ${key}`)
  }
}
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)])
}
const missing = []
const invariant = new Set(['Pidu-App', 'Excel', 'PDF', 'Excel (.xlsx)'])
for (const file of files(join(root, 'frontend/src')).filter((path) => /\.[jt]sx?$/.test(path) && !path.includes('i18n'))) {
  const source = readFileSync(file, 'utf8')
  const matches = [
    ...source.matchAll(/\b(?:t|translate)\('([^']+)'/g),
    ...source.matchAll(/\b(?:title|subtitle|description|label|confirmLabel|prevLabel|nextLabel|emptyTitle)="([^"]+)"/g),
  ]
  for (const [, key] of matches) {
    if (!Object.hasOwn(dictionaries.id, key) && !invariant.has(key)) missing.push(`${file}: ${key}`)
  }
}
assert.deepEqual(missing, [], 'Untranslated source keys')
process.stdout.write(execFileSync('php', ['backend/scripts/frontend-locales.php', '--check'], { cwd: root, encoding: 'utf8' }))
console.log(`PASS: ${keys.length} keys in id/en/su; values, interpolation, source references and server snapshot checked.`)
