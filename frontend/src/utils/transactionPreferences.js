import { PAYMENT_METHODS } from '../constants/enums.js'

const keyFor = (userId) => `pidu:transaction-preferences:${userId}`

export function readPreferences(userId) {
  try {
    if (userId == null) return { counts: {}, payment: 'cash', wallet: null }
    const value = JSON.parse(localStorage.getItem(keyFor(userId)))
    const counts = Object.fromEntries(Object.entries(value?.counts ?? {}).filter(([id, count]) => /^\d+$/.test(id) && Number.isSafeInteger(count) && count > 0))
    return {
      counts,
      payment: Object.hasOwn(PAYMENT_METHODS, value?.payment) ? value.payment : 'cash',
      wallet: Number.isSafeInteger(value?.wallet) ? value.wallet : null,
    }
  } catch {
    return { counts: {}, payment: 'cash', wallet: null }
  }
}

export function rememberTransaction(userId, form, fallbackCounts = {}) {
  const saved = readPreferences(userId)
  const counts = { ...fallbackCounts, ...saved.counts }
  counts[form.category_id] = (counts[form.category_id] ?? 0) + 1
  const next = { counts, payment: form.payment_method, wallet: form.wallet_id ? Number(form.wallet_id) : saved.wallet }
  try {
    if (userId != null) localStorage.setItem(keyFor(userId), JSON.stringify(next))
  } catch { /* Preferensi opsional; simpan transaksi tetap berhasil saat storage diblokir. */ }
  return next
}
