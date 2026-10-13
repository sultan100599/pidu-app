import { t } from '../i18n/locale'

const FALLBACK_MESSAGES = {
  429: 'Terlalu banyak percobaan, coba lagi sebentar.',
}

export function getErrorMessage(err) {
  const response = err?.response
  if (response) {
    const message = response.data?.message
    // 500 dan server yang belum menyala (502–504 dari proxy) sama-sama bisa dicoba lagi.
    if (response.status === 500 || (response.status >= 502 && response.status <= 504 && !message)) {
      return t('Server sedang bermasalah. Tunggu sebentar lalu coba lagi.')
    }
    if (message) return t(message)
    if (response.status === 429) return t(FALLBACK_MESSAGES[429])
    if (response.status >= 500) return t('Server sedang bermasalah. Tunggu sebentar lalu coba lagi.')
  }
  return t('Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.')
}

export function getFieldErrors(err) {
  const errors = err?.response?.data?.errors
  if (!errors || typeof errors !== 'object') return {}
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, messages?.[0] ?? '']),
  )
}
