const FALLBACK_MESSAGES = {
  429: 'Terlalu banyak percobaan, coba lagi sebentar.',
}

export function getErrorMessage(err) {
  const response = err?.response
  if (response) {
    const message = response.data?.message
    if (message) return message
    if (response.status === 429) return FALLBACK_MESSAGES[429]
    if (response.status >= 500) return 'Terjadi kesalahan pada server.'
  }
  return 'Tidak dapat terhubung ke server.'
}

export function getFieldErrors(err) {
  const errors = err?.response?.data?.errors
  if (!errors || typeof errors !== 'object') return {}
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, messages?.[0] ?? '']),
  )
}
