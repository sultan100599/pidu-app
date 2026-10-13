const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  // Rupiah tanpa sen: nilai berdesimal (rata-rata, animasi) dibulatkan saat ditampilkan.
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('id-ID')

export const dateLocale = () => getLocale() === 'en' ? 'en-GB' : 'id-ID'
const suMonths = ['Januari', 'Pébruari', 'Maret', 'April', 'Méi', 'Juni', 'Juli', 'Agustus', 'Séptémber', 'Oktober', 'Nopémber', 'Désémber']
export const dayNames = () => getLocale() === 'su'
  ? ['Senén', 'Salasa', 'Rebo', 'Kemis', 'Jumaah', 'Saptu', 'Minggu']
  : Array.from({ length: 7 }, (_, day) => new Intl.DateTimeFormat(dateLocale(), { weekday: 'long' }).format(new Date(2026, 8, 28 + day)))
export const monthNames = () => getLocale() === 'su' ? suMonths
  : Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat(dateLocale(), { month: 'long' }).format(new Date(2026, month, 1)))

function dateText(date, { day = true, year = true, long = false } = {}) {
  if (getLocale() === 'su') {
    const month = suMonths[date.getMonth()]
    return (long ? dayNames()[(date.getDay() + 6) % 7] + ', ' : '') +
      (day ? date.getDate() + ' ' : '') + (long ? month : month.slice(0, 3)) + (year ? ' ' + date.getFullYear() : '')
  }
  return new Intl.DateTimeFormat(dateLocale(), {
    day: day ? 'numeric' : undefined, month: long ? 'long' : 'short',
    year: year ? 'numeric' : undefined, weekday: long ? 'long' : undefined,
  }).format(date)
}

export function formatRupiah(n) {
  return rupiahFormatter.format(n ?? 0)
}

export function formatNumber(n) {
  return numberFormatter.format(n ?? 0)
}

export function formatDate(ymd, style = 'short') {
  const date = parseYmd(ymd)
  if (Number.isNaN(date.getTime())) return ''
  return dateText(date, { long: style === 'long' })
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

export const MONTH_NAMES = new Proxy([], { get: (_, property) => {
  const months = monthNames()
  const value = months[property]
  return typeof value === 'function' ? value.bind(months) : value
} })

// 'Y-m' → "Sep 2026"
export function formatYearMonth(ym) {
  const [y, m] = String(ym).split('-').map(Number)
  return dateText(new Date(y, (m || 1) - 1, 1), { day: false })
}


// 'Y-m-d' → "28 Sep"
export function formatDayMonth(ymd) {
  return dateText(parseYmd(ymd), { year: false })
}

export function formatDateTime(value) {
  const date = new Date(value)
  return dateText(date) + ' ' + new Intl.DateTimeFormat(dateLocale(), { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
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
import { getLocale } from '../i18n/locale.js'
