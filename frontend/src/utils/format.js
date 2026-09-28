const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('id-ID')

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const longDateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatRupiah(n) {
  return rupiahFormatter.format(n ?? 0)
}

export function formatNumber(n) {
  return numberFormatter.format(n ?? 0)
}

export function formatDate(ymd, style = 'short') {
  const date = parseYmd(ymd)
  if (Number.isNaN(date.getTime())) return ''
  return style === 'long' ? longDateFormatter.format(date) : dateFormatter.format(date)
}

export function parseYmd(ymd) {
  const [y, m, d] = String(ymd ?? '').split('-').map(Number)
  return new Date(y || 0, (m || 1) - 1, d || 1)
}

export function toYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
