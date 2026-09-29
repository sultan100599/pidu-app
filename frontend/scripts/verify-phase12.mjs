import assert from 'node:assert/strict'
import { previousRange, comparison, greeting, heatLevel } from '../src/utils/dashboard.js'
import { readPreferences, rememberTransaction } from '../src/utils/transactionPreferences.js'

let passed = 0
function check(name, run) {
  run()
  passed += 1
  console.log(`PASS ${name}`)
}

check('30 September days compare with August 2 to 31', () => {
  assert.deepEqual(previousRange({ start_date: '2026-09-01', end_date: '2026-09-30' }), { start_date: '2026-08-02', end_date: '2026-08-31' })
})
check('single day crosses year boundary', () => {
  assert.deepEqual(previousRange({ start_date: '2026-01-01', end_date: '2026-01-01' }), { start_date: '2025-12-31', end_date: '2025-12-31' })
})
check('leap day and DST do not change inclusive length', () => {
  assert.deepEqual(previousRange({ start_date: '2024-03-01', end_date: '2024-03-31' }), { start_date: '2024-01-30', end_date: '2024-02-29' })
})
check('invalid or incomplete range has no comparison', () => {
  for (const range of [null, {}, { start_date: '2026-09-30', end_date: '2026-09-01' }]) assert.equal(previousRange(range), null)
})
check('zero baseline never divides by zero', () => {
  for (const value of [-100, 0, 100]) assert.deepEqual(comparison(value, 0, 'balance'), { text: 'belum ada data', tone: 'muted' })
})
check('expense increase is unfavorable, income increase is favorable', () => {
  assert.deepEqual(comparison(112, 100, 'expense'), { text: '▲ 12%', tone: 'expense' })
  assert.deepEqual(comparison(112, 100, 'income'), { text: '▲ 12%', tone: 'income' })
  assert.deepEqual(comparison(88, 100, 'expense'), { text: '▼ 12%', tone: 'income' })
})
check('negative balance improvement keeps the correct direction', () => {
  assert.deepEqual(comparison(-50, -100, 'balance'), { text: '▲ 50%', tone: 'income' })
  assert.equal(comparison(-150, -100, 'balance').tone, 'expense')
  assert.equal(comparison(100, 100, 'income').text, 'sama')
  assert.equal(comparison(100.01, 100, 'income').text, '▲ <0,1%')
})
check('all heatmap thresholds and an empty month', () => {
  assert.deepEqual([0, 1, 25, 26, 50, 51, 75, 76, 100].map((n) => heatLevel(n, 100)), [0, 1, 1, 2, 2, 3, 3, 4, 4])
  assert.equal(heatLevel(0, 0), 0)
})
check('greeting changes at local hour boundaries', () => {
  assert.deepEqual([4, 5, 10, 11, 14, 15, 17, 18, 23].map(greeting), ['Selamat malam', 'Selamat pagi', 'Selamat pagi', 'Selamat siang', 'Selamat siang', 'Selamat sore', 'Selamat sore', 'Selamat malam', 'Selamat malam'])
})

const storage = new Map()
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
check('frequency and payment are isolated per user', () => {
  rememberTransaction(1, { category_id: '9', payment_method: 'cash' })
  rememberTransaction(1, { category_id: '9', payment_method: 'transfer' })
  rememberTransaction(2, { category_id: '7', payment_method: 'cash' })
  assert.equal(readPreferences(1).counts[9], 2)
  assert.equal(readPreferences(1).payment, 'transfer')
  assert.equal(readPreferences(2).payment, 'cash')
  assert.equal(readPreferences(2).counts[9], undefined)
  assert.equal(readPreferences(2).counts[7], 1)
})
check('malformed storage and invalid methods fall back safely', () => {
  storage.set('pidu:transaction-preferences:3', '{invalid')
  assert.deepEqual(readPreferences(3), { counts: {}, payment: 'cash' })
  storage.set('pidu:transaction-preferences:3', JSON.stringify({ counts: { 7: -1, 8: 'bad', 9: 3 }, payment: 'unknown' }))
  assert.deepEqual(readPreferences(3), { counts: { 9: 3 }, payment: 'cash' })
})
check('blocked storage does not throw or prevent remembering in memory', () => {
  globalThis.localStorage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
  assert.deepEqual(readPreferences(1), { counts: {}, payment: 'cash' })
  assert.equal(rememberTransaction(1, { category_id: '9', payment_method: 'cash' }, { 9: 2 }).counts[9], 3)
})
console.log(`${passed}/${passed} checks passed`)
