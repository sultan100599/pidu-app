import { toYmd } from './format'

// Preset periode untuk filter transaksi. Tanggal dihitung dengan objek Date
// lokal + toYmd (bukan toISOString) supaya sesuai timezone user.
export const PERIOD_PRESETS = [
  { value: 'all', label: 'Semua' },
  { value: 'this_month', label: 'Bulan ini' },
  { value: 'last_month', label: 'Bulan lalu' },
  { value: 'last_30_days', label: '30 hari terakhir' },
  { value: 'this_year', label: 'Tahun ini' },
  { value: 'custom', label: 'Kustom' },
]

// null = tanpa batas tanggal (semua tanggal).
export function getPeriodRange(period, customStart, customEnd) {
  const today = new Date()
  switch (period) {
    case 'this_month':
      return {
        start_date: toYmd(new Date(today.getFullYear(), today.getMonth(), 1)),
        end_date: toYmd(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      }
    case 'last_month':
      return {
        start_date: toYmd(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        end_date: toYmd(new Date(today.getFullYear(), today.getMonth(), 0)),
      }
    case 'last_30_days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 29)
      return { start_date: toYmd(start), end_date: toYmd(today) }
    }
    case 'this_year':
      return {
        start_date: toYmd(new Date(today.getFullYear(), 0, 1)),
        end_date: toYmd(new Date(today.getFullYear(), 11, 31)),
      }
    case 'custom':
      if (customStart && customEnd) return { start_date: customStart, end_date: customEnd }
      return null
    default:
      return null
  }
}

export function isCustomRangeInvalid(period, start, end) {
  return period === 'custom' && Boolean(start) && Boolean(end) && end < start
}
