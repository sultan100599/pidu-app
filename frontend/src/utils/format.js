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

const compactFormatter = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 })

// Angka ringkas untuk sumbu grafik / sel kalender: 1.250.000 → "1,3 jt".
export function formatCompact(n) {
  return compactFormatter.format(n ?? 0)
}

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const shortMonthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' })

// 'Y-m' → "Sep 2026"
export function formatYearMonth(ym) {
  const [y, m] = String(ym).split('-').map(Number)
  return shortMonthFormatter.format(new Date(y, (m || 1) - 1, 1))
}

const dayMonthFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })

// 'Y-m-d' → "28 Sep"
export function formatDayMonth(ymd) {
  return dayMonthFormatter.format(parseYmd(ymd))
}

// 25266 → "24,7 KB"
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toLocaleString('id-ID', { maximumFractionDigits: 1 })} ${units[unit]}`
}
