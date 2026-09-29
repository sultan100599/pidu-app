import assert from 'node:assert/strict'

const storage = new Map([['pidu_locale', 'su']])
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) }
globalThis.document = { documentElement: { lang: '' } }
const { t, getLocale, setLocale, subscribeLocale, locales } = await import('../src/i18n/locale.js')
const { formatDate, formatRupiah, MONTH_NAMES, dayNames } = await import('../src/utils/format.js')
const { greeting, previousPeriod } = await import('../src/utils/dashboard.js')
const { client } = await import('../src/api/client.js')
let passed = 0
async function check(name, run) {
  await run()
  passed++
  console.log('PASS ' + name)
}
await check('saved locale and html lang are applied during module initialization', () => {
  assert.equal(getLocale(), 'su')
  assert.equal(document.documentElement.lang, 'su')
  assert.equal(t('Tambah Budget'), 'Tambihan anggaran')
})
await check('locale cycle persists, notifies subscribers and updates language', () => {
  let changes = 0
  const unsubscribe = subscribeLocale(() => changes++)
  for (const locale of ['id', 'en', 'su', 'id']) {
    setLocale(locale)
    assert.equal(storage.get('pidu_locale'), locale)
    assert.equal(document.documentElement.lang, locale)
  }
  unsubscribe()
  assert.equal(changes, 4)
  assert.deepEqual(locales.map((item) => item.code), ['IN', 'EN', 'SU'])
})
await check('date and month select labels change while Rupiah remains Indonesian', () => {
  const rupiah = formatRupiah(1500000)
  setLocale('en')
  assert.equal(formatDate('2026-02-02', 'long'), 'Monday, 2 February 2026')
  assert.equal(MONTH_NAMES[1], 'February')
  assert.equal(MONTH_NAMES.map((name) => name).length, 12)
  setLocale('su')
  assert.equal(formatDate('2026-02-02', 'long'), 'Senén, 2 Pébruari 2026')
  assert.equal(MONTH_NAMES[1], 'Pébruari')
  assert.equal(dayNames()[4], 'Jumaah')
  assert.equal(formatRupiah(1500000), rupiah)
})
await check('greetings and previous calendar month retain Phase 12 behaviour', () => {
  assert.equal(greeting(5), 'Wilujeng énjing')
  assert.equal(greeting(11), 'Wilujeng siang')
  assert.equal(greeting(15), 'Wilujeng sonten')
  assert.equal(greeting(18), 'Wilujeng wengi')
  setLocale('en')
  assert.equal(greeting(5), 'Good morning')
  assert.deepEqual(previousPeriod({ start_date: '2026-03-01', end_date: '2026-03-31' }), {
    start_date: '2026-02-01', end_date: '2026-02-28', label: 'February 2026',
  })
})
await check('existing client validation and server feedback retranslate', () => {
  setLocale('su')
  assert.equal(t('The amount must be greater than 0.'), 'Nominal kedah langkung ti 0.')
  assert.equal(t('The date field is required.'), 'ping kaping kedah dieusian.')
  assert.equal(t('Transaction saved.'), 'Transaksi parantos disimpen.')
  assert.equal(t('Password minimal 8 karakter.'), 'Kecap akses sahenteuna 8 karakter.')
  assert.equal(t('Minggu 2'), 'Minggu ka-2')
})
await check('combined import summaries translate every sentence', () => {
  setLocale('en')
  assert.equal(t('2 transaksi berhasil diimpor. 3 duplikat dilewati. 4 kategori baru dibuat.'),
    '2 transactions imported. 3 duplicates skipped. 4 new categories created.')
})
await check('interpolated user text remains unchanged', () => {
  assert.equal(t('Edit transaksi {name}', { name: 'Makan siang' }), 'Edit transaction Makan siang')
  const name = 'Makanan.xlsx'
  assert.equal(t('{filename} diunduh.', { filename: name }), 'Downloaded Makanan.xlsx.')
})
await check('API interceptor always uses the current language', async () => {
  for (const locale of ['id', 'en', 'su']) {
    setLocale(locale)
    const response = await client.get('/test', { adapter: async (config) => ({ data: config.headers['Accept-Language'], status: 200, statusText: 'OK', headers: {}, config }) })
    assert.equal(response.data, locale)
  }
})
await check('blocked storage still allows switching and invalid storage falls back to id', async () => {
  localStorage.setItem = () => { throw new Error('blocked') }
  setLocale('en')
  assert.equal(getLocale(), 'en')
  localStorage.getItem = () => 'invalid'
  const fresh = await import('../src/i18n/locale.js?invalid-storage')
  assert.equal(fresh.getLocale(), 'id')
  localStorage.getItem = () => { throw new Error('blocked') }
  const blocked = await import('../src/i18n/locale.js?blocked-storage')
  assert.equal(blocked.getLocale(), 'id')
})
console.log(`${passed}/${passed} checks passed.`)
