// Definisi menu tunggal: dipakai Sidebar dan penentu judul halaman di Topbar.
export const MENU = [
  { label: 'Dashboard', path: '/', icon: 'bi-speedometer2' },
  { label: 'Transaksi', path: '/transactions', icon: 'bi-arrow-left-right' },
  { label: 'Kategori', path: '/categories', icon: 'bi-tags' },
  {
    label: 'Laporan',
    children: [
      { label: 'Rekap Harian', path: '/reports/daily', icon: 'bi-calendar-day' },
      { label: 'Rekap Mingguan', path: '/reports/weekly', icon: 'bi-calendar-week' },
      { label: 'Rekap Bulanan', path: '/reports/monthly', icon: 'bi-calendar-month' },
      { label: 'Rekap Tahunan', path: '/reports/yearly', icon: 'bi-calendar-range' },
      { label: 'Kalender', path: '/reports/calendar', icon: 'bi-calendar2-week' },
    ],
  },
  { label: 'Budget', path: '/budgets', icon: 'bi-piggy-bank' },
  { label: 'Impor', path: '/import', icon: 'bi-upload' },
  { label: 'Export & Backup', path: '/export', icon: 'bi-download' },
]

function flatten(menu = MENU) {
  return menu.flatMap((item) => item.children ?? item)
}

// Cari item menu yang paling spesifik untuk sebuah pathname (prefix terpanjang).
export function findMenuItem(pathname) {
  const candidates = flatten().filter(
    (item) => item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  )
  if (candidates.length === 0) return null
  return candidates.reduce((a, b) => (a.path.length >= b.path.length ? a : b))
}
