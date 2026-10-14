// Definisi menu tunggal untuk Sidebar.
export const MENU = [
  { label: 'Ringkasan', path: '/', icon: 'bi-speedometer2' },
  { label: 'Transaksi', path: '/transactions', icon: 'bi-arrow-left-right' },
  { label: 'Dompet', path: '/wallets', icon: 'bi-wallet2' },
  { label: 'Kategori', path: '/categories', icon: 'bi-tags' },
  // Satu pintu untuk semua rekap; tab Harian/Mingguan/Bulanan/Tahunan/Kalender ada di halamannya.
  { label: 'Laporan', path: '/reports', icon: 'bi-bar-chart' },
  { label: 'Anggaran', path: '/budgets', icon: 'bi-piggy-bank' },
  { label: 'Unggah', path: '/import', icon: 'bi-upload' },
  { label: 'Unduh & Cadangan', path: '/export', icon: 'bi-download' },
]
