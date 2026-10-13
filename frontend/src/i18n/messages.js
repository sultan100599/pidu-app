import areas from './areas.js'
import files from './files.js'
import icons from './icons.js'
import server from './server.json' with { type: 'json' }

const entries = [
  [
    "Bahasa",
    "Language",
    "Basa"
  ],
  [
    "Pilih bahasa",
    "Choose language",
    "Pilih basa"
  ],
  [
    "Dashboard",
    "Dashboard",
    "Dasbor"
  ],
  [
    "Transaksi",
    "Transactions",
    "Transaksi"
  ],
  [
    "Kategori",
    "Categories",
    "Kategori"
  ],
  [
    "Laporan",
    "Reports",
    "Laporan"
  ],
  [
    "Budget",
    "Budget",
    "Anggaran"
  ],
  [
    "Impor",
    "Import",
    "Impor"
  ],
  [
    "Export & Backup",
    "Export & Backup",
    "Ékspor & Cadangan"
  ],
  [
    "Rekap Harian",
    "Daily report",
    "Rekap Poéan"
  ],
  [
    "Rekap Mingguan",
    "Weekly report",
    "Rekap Mingguan"
  ],
  [
    "Rekap Bulanan",
    "Monthly report",
    "Rekap Bulanan"
  ],
  [
    "Rekap Tahunan",
    "Yearly report",
    "Rekap Taunan"
  ],
  [
    "Kalender",
    "Calendar",
    "Kalénder"
  ],
  [
    "Menu",
    "Menu",
    "Menu"
  ],
  [
    "Navigasi utama",
    "Main navigation",
    "Navigasi utama"
  ],
  [
    "Menu navigasi",
    "Navigation menu",
    "Menu navigasi"
  ],
  [
    "Buka menu",
    "Open menu",
    "Buka menu"
  ],
  [
    "Tutup menu",
    "Close menu",
    "Tutup menu"
  ],
  [
    "Ciutkan menu",
    "Collapse menu",
    "Leutikan menu"
  ],
  [
    "Lebarkan menu",
    "Expand menu",
    "Legaan menu"
  ],
  [
    "Menu pengguna",
    "User menu",
    "Menu pangguna"
  ],
  [
    "Keluar",
    "Sign out",
    "Kaluar"
  ],
  [
    "Ganti ke mode terang",
    "Switch to light mode",
    "Gentos kana modeu caang"
  ],
  [
    "Ganti ke mode gelap",
    "Switch to dark mode",
    "Gentos kana modeu poék"
  ],
  [
    "Catat",
    "Record",
    "Catet"
  ],
  [
    "Catat transaksi",
    "Record transaction",
    "Catet transaksi"
  ],
  [
    "Tambah Transaksi",
    "Add transaction",
    "Tambihan transaksi"
  ],
  [
    "Tambah transaksi (pintasan: N)",
    "Add transaction (shortcut: N)",
    "Tambihan transaksi (potong kompas: N)"
  ],
  [
    "Memuat...",
    "Loading...",
    "Nuju dimuat..."
  ],
  [
    "Memuat…",
    "Loading…",
    "Nuju dimuat…"
  ],
  [
    "Coba lagi",
    "Try again",
    "Cobian deui"
  ],
  [
    "Terjadi kesalahan",
    "Something went wrong",
    "Aya kalepatan"
  ],
  [
    "Batal",
    "Cancel",
    "Bolay"
  ],
  [
    "Hapus",
    "Delete",
    "Pupus"
  ],
  [
    "Tutup",
    "Close",
    "Tutup"
  ],
  [
    "Simpan",
    "Save",
    "Simpen"
  ],
  [
    "Edit",
    "Edit",
    "Robih"
  ],
  [
    "Email",
    "Email",
    "Email"
  ],
  [
    "Password",
    "Password",
    "Kecap akses"
  ],
  [
    "Nama",
    "Name",
    "Nami"
  ],
  [
    "Masuk",
    "Sign in",
    "Lebet"
  ],
  [
    "Daftar",
    "Register",
    "Daptar"
  ],
  [
    "Catat pemasukan & pengeluaranmu",
    "Track your income & expenses",
    "Catet panghasilan & pangeluaran anjeun"
  ],
  [
    "Belum punya akun?",
    "Don’t have an account?",
    "Teu acan gaduh akun?"
  ],
  [
    "Sudah punya akun?",
    "Already have an account?",
    "Parantos gaduh akun?"
  ],
  [
    "Akun demo:",
    "Demo account:",
    "Akun démo:"
  ],
  [
    "Isi akun demo",
    "Use demo account",
    "Anggo akun démo"
  ],
  [
    "Daftar ke Pidu",
    "Register with Pidu",
    "Daptar ka Pidu"
  ],
  [
    "Buat akun untuk mulai mencatat",
    "Create an account to start recording",
    "Damel akun kanggo ngamimitian nyatet"
  ],
  [
    "Email wajib diisi.",
    "Email is required.",
    "Email kedah dieusian."
  ],
  [
    "Format email tidak valid.",
    "Enter a valid email address.",
    "Mangga lebetkeun alamat email anu leres."
  ],
  [
    "Password wajib diisi.",
    "Password is required.",
    "Kecap akses kedah dieusian."
  ],
  [
    "Nama wajib diisi.",
    "Name is required.",
    "Nami kedah dieusian."
  ],
  [
    "Password minimal 8 karakter.",
    "Password must be at least 8 characters.",
    "Kecap akses sahenteuna 8 karakter."
  ],
  [
    "Konfirmasi password tidak sama.",
    "Passwords do not match.",
    "Konfirmasi kecap akses teu cocog."
  ],
  [
    "Minimal 8 karakter.",
    "At least 8 characters.",
    "Sahenteuna 8 karakter."
  ],
  [
    "Konfirmasi Password",
    "Confirm password",
    "Konfirmasi kecap akses"
  ],
  [
    "Sembunyikan password",
    "Hide password",
    "Sumputkeun kecap akses"
  ],
  [
    "Tampilkan password",
    "Show password",
    "Tingalikeun kecap akses"
  ],
  [
    "Pemasukan",
    "Income",
    "Panghasilan"
  ],
  [
    "Pengeluaran",
    "Expenses",
    "Pangeluaran"
  ],
  [
    "Saldo",
    "Balance",
    "Saldo"
  ],
  [
    "Jumlah transaksi",
    "Transaction count",
    "Jumlah transaksi"
  ],
  [
    "Cash",
    "Cash",
    "Tunai"
  ],
  [
    "Transfer",
    "Transfer",
    "Transfer"
  ],
  [
    "Debit",
    "Debit",
    "Debit"
  ],
  [
    "Kartu Kredit",
    "Credit card",
    "Kartu kiridit"
  ],
  [
    "E-Wallet",
    "E-wallet",
    "Dompet éléktronik"
  ],
  [
    "QRIS",
    "QRIS",
    "QRIS"
  ],
  [
    "Lainnya",
    "Other",
    "Sanésna"
  ],
  [
    "Aman",
    "On track",
    "Aman"
  ],
  [
    "Hampir habis",
    "Almost used up",
    "Ampir seep"
  ],
  [
    "Terlampaui",
    "Exceeded",
    "Kaliwat"
  ],
  [
    "Semua",
    "All",
    "Sadayana"
  ],
  [
    "Bulan ini",
    "This month",
    "Sasih ieu"
  ],
  [
    "Bulan lalu",
    "Last month",
    "Sasih kamari"
  ],
  [
    "30 hari terakhir",
    "Last 30 days",
    "30 dinten kapengker"
  ],
  [
    "Tahun ini",
    "This year",
    "Taun ieu"
  ],
  [
    "Kustom",
    "Custom",
    "Kustom"
  ],
  [
    "Periode",
    "Period",
    "Periodeu"
  ],
  [
    "Dari",
    "From",
    "Ti"
  ],
  [
    "Sampai",
    "To",
    "Dugi ka"
  ],
  [
    "Hari ini",
    "Today",
    "Dinten ieu"
  ],
  [
    "Tanggal akhir tidak boleh lebih awal dari tanggal mulai.",
    "End date cannot be before start date.",
    "Ping kaping ahir teu kénging sateuacan ping kaping mimiti."
  ],
  [
    "Memuat perbandingan…",
    "Loading comparison…",
    "Nuju dimuat babandingan…"
  ],
  [
    "Perbandingan belum tersedia",
    "Comparison unavailable",
    "Babandingan teu acan sayogi"
  ],
  [
    "belum ada data",
    "no data yet",
    "teu acan aya data"
  ],
  [
    "sama",
    "unchanged",
    "sami"
  ],
  [
    "dari {label}",
    "from {label}",
    "ti {label}"
  ],
  [
    "Selamat pagi",
    "Good morning",
    "Wilujeng énjing"
  ],
  [
    "Selamat siang",
    "Good afternoon",
    "Wilujeng siang"
  ],
  [
    "Selamat sore",
    "Good afternoon",
    "Wilujeng sonten"
  ],
  [
    "Selamat malam",
    "Good evening",
    "Wilujeng wengi"
  ],
  [
    "Tidak ada data",
    "No data",
    "Teu aya data"
  ],
  [
    "Navigasi halaman",
    "Page navigation",
    "Navigasi kaca"
  ],
  [
    "Halaman pertama",
    "First page",
    "Kaca kahiji"
  ],
  [
    "Halaman sebelumnya",
    "Previous page",
    "Kaca sateuacanna"
  ],
  [
    "Halaman berikutnya",
    "Next page",
    "Kaca salajengna"
  ],
  [
    "Halaman terakhir",
    "Last page",
    "Kaca pamungkas"
  ],
  [
    "Halaman {page}",
    "Page {page}",
    "Kaca {page}"
  ],
  [
    "Menampilkan {from}–{to} dari {total}",
    "Showing {from}–{to} of {total}",
    "Mintonkeun {from}–{to} tina {total}"
  ],
  [
    "Pemakaian budget {name}: {percent}%, {status}",
    "Budget usage for {name}: {percent}%, {status}",
    "Pamakéan anggaran {name}: {percent}%, {status}"
  ],
  [
    "{used} dari {amount}",
    "{used} of {amount}",
    "{used} tina {amount}"
  ],
  [
    "sisa {amount}",
    "{amount} remaining",
    "sésa {amount}"
  ],
  [
    "lebih {amount}",
    "{amount} over budget",
    "langkung {amount}"
  ],
  [
    "Ringkasan hari ini",
    "Today’s summary",
    "Ringkesan dinten ieu"
  ],
  [
    "Memuat pengeluaran hari ini…",
    "Loading today’s expenses…",
    "Nuju dimuat pangeluaran dinten ieu…"
  ],
  [
    "Pengeluaran hari ini belum tersedia.",
    "Today’s expenses are unavailable.",
    "Pangeluaran dinten ieu teu acan sayogi."
  ],
  [
    "Belum ada pengeluaran hari ini",
    "No expenses today yet",
    "Teu acan aya pangeluaran dinten ieu"
  ],
  [
    "Pengeluaran hari ini {amount}",
    "Spent today: {amount}",
    "Pangeluaran dinten ieu {amount}"
  ],
  [
    "Memuat budget bulan ini…",
    "Loading this month’s budget…",
    "Nuju dimuat anggaran sasih ieu…"
  ],
  [
    "Budget bulan ini belum tersedia.",
    "This month’s budget is unavailable.",
    "Anggaran sasih ieu teu acan sayogi."
  ],
  [
    "Sisa budget bulan ini {amount}",
    "Budget remaining this month: {amount}",
    "Sésa anggaran sasih ieu {amount}"
  ],
  [
    "Grafik pemasukan dan pengeluaran",
    "Income and expenses chart",
    "Grafik panghasilan sareng pangeluaran"
  ],
  [
    "Grafik pengeluaran per kategori",
    "Expenses by category chart",
    "Grafik pangeluaran per kategori"
  ],
  [
    "Terlalu banyak percobaan, coba lagi sebentar.",
    "Too many attempts. Please try again shortly.",
    "Seueur teuing percobaan. Mangga cobian deui sakedap deui."
  ],
  [
    "Terjadi kesalahan pada server.",
    "A server error occurred.",
    "Aya kalepatan dina server."
  ],
  [
    "Tidak dapat terhubung ke server.",
    "Cannot connect to the server.",
    "Teu tiasa nyambung ka server."
  ],
  [
    "Sesi berakhir, silakan login kembali.",
    "Your session has expired. Please sign in again.",
    "Sési parantos réngsé. Mangga lebet deui."
  ]
]

export const dictionaries = Object.fromEntries(['id', 'en', 'su'].map((locale, index) => [locale,
  Object.fromEntries([...server, ...entries, ...areas, ...files].map((row) => [row[0], row[index]]).concat(icons.map((row) => [row[0], row[index + 1]]))),
]))
