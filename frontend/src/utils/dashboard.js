import { formatDate, formatDayMonth, MONTH_NAMES } from './format'

const pad = (n) => String(n).padStart(2, '0')
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`
// m 1-12; hari ke-0 bulan berikutnya = hari terakhir bulan m.
const lastDayOf = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate()

// Periode pembanding untuk kartu ringkasan, beserta label yang mudah dibaca:
// - satu bulan kalender penuh → bulan sebelumnya ("Agustus 2026")
// - satu tahun penuh → tahun sebelumnya ("2025")
// - rentang lain → rentang sama panjang tepat sebelumnya ("2 Agu – 31 Agu 2026")
export function previousPeriod(range) {
  if (!range) return null
  const [sy, sm, sd] = range.start_date.split('-').map(Number)
  const [ey, em, ed] = range.end_date.split('-').map(Number)
  if ([sy, sm, sd, ey, em, ed].some((n) => !Number.isFinite(n))) return null

  if (sd === 1 && sy === ey && sm === em && ed === lastDayOf(ey, em)) {
    const py = sm === 1 ? sy - 1 : sy
    const pm = sm === 1 ? 12 : sm - 1
    return { start_date: ymd(py, pm, 1), end_date: ymd(py, pm, lastDayOf(py, pm)), label: `${MONTH_NAMES[pm - 1]} ${py}` }
  }
  if (sy === ey && sm === 1 && sd === 1 && em === 12 && ed === 31) {
    return { start_date: ymd(sy - 1, 1, 1), end_date: ymd(sy - 1, 12, 31), label: String(sy - 1) }
  }

  const start = Date.UTC(sy, sm - 1, sd)
  const end = Date.UTC(ey, em - 1, ed)
  if (end < start) return null
  const day = 86400000
  const length = end - start + day
  const prevStart = new Date(start - length).toISOString().slice(0, 10)
  const prevEnd = new Date(start - day).toISOString().slice(0, 10)
  const label = prevStart === prevEnd ? formatDate(prevEnd) : `${formatDayMonth(prevStart)} – ${formatDate(prevEnd)}`
  return { start_date: prevStart, end_date: prevEnd, label }
}

export function comparison(current, previous, kind) {
  if (previous === 0) return { text: 'belum ada data', tone: 'muted' }
  const difference = current - previous
  if (difference === 0) return { text: 'sama', tone: 'muted' }
  const percentage = Math.abs(difference / previous * 100)
  const formatted = percentage < 0.1 ? '<0,1' : percentage.toLocaleString('id-ID', { maximumFractionDigits: 1 })
  return {
    text: `${difference > 0 ? '▲' : '▼'} ${formatted}%`,
    tone: (kind === 'expense' ? difference < 0 : difference > 0) ? 'income' : 'expense',
  }
}

export function greeting(hour) {
  if (hour >= 5 && hour < 11) return 'Selamat pagi'
  if (hour >= 11 && hour < 15) return 'Selamat siang'
  if (hour >= 15 && hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export function heatLevel(expense, maximum) {
  return expense > 0 && maximum > 0 ? Math.min(4, Math.ceil(expense / maximum * 4)) : 0
}
