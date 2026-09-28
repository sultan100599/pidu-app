# PHASE 5+6 — Dashboard + Charts + Rekap (Harian/Mingguan/Bulanan/Tahunan) + Kalender

Executor: Claude (sejak Phase 4). Hanya `frontend/`; backend sudah final (lihat report-2).

## API yang dipakai
- `GET /api/dashboard` (periode + filter) → `period, summary{income,expense,balance,avg_daily_expense,expense_ratio|null,transaction_count}, chart{granularity:day|month,labels,income[],expense[]}, category_breakdown[{category_id,name,icon,color,total,percentage}], top_categories, largest_transactions[Trx], budgets[Budget]`
- `GET /api/reports/daily|weekly` (periode + filter) → `period, totals{income,expense,balance,count}, rows[...]`
- `GET /api/reports/monthly?year` → `year, totals, rows[12]`; `GET /api/reports/yearly` → `totals, rows`
- `GET /api/reports/calendar?year&month` → `year, month, label, totals, days[{date,income,expense,count}]`
- `GET /api/reports/day/{Y-m-d}` → `date, totals, transactions[Trx]`

## Rencana
- Dependency: `chart.js` + `react-chartjs-2`; registrasi komponen Chart.js sekali (`charts/setup.js`), tanpa import `chart.js/auto`.
- `hooks/useFetch(key, fetcher)`: pola key-based dari Phase 4 (tanpa race, data lama tetap tampil saat refetch, AbortController).
- `components/PeriodPicker`: preset + kustom, disinkronkan ke URL (dipakai Dashboard, Rekap Harian, Rekap Mingguan).
- Chart: warna dari variabel CSS Bootstrap (`--bs-success`, `--bs-danger`, …), ikut dark mode; tooltip `formatRupiah`, sumbu Y ringkas ("1,2 jt").
- **Dashboard:** ringkasan + rata-rata harian + rasio pengeluaran, grafik pemasukan vs pengeluaran, doughnut + daftar pengeluaran per kategori (klik → Transaksi terfilter), 5 transaksi terbesar, budget bulan ini.
- **Rekap Harian / Mingguan:** periode, total, grafik, tabel + baris total. Harian: toggle "sembunyikan hari kosong"; klik baris → modal detail hari.
- **Rekap Bulanan:** pemilih tahun (‹ tahun ›), grafik 12 bulan, tabel; klik baris → Rekap Harian bulan itu.
- **Rekap Tahunan:** grafik + tabel; klik baris → Rekap Bulanan tahun itu.
- **Kalender:** navigasi bulan (‹ Hari ini ›), grid Senin–Minggu, sel berisi pemasukan/pengeluaran ringkas, hari ini ditandai; klik tanggal → modal detail hari (daftar transaksi + total + link ke Transaksi).
- Semua halaman: state loading/empty/error, mobile 360px tanpa horizontal scroll (tabel dalam `table-responsive`), dark mode.

## Review (wajib sebelum selesai)
Lint + build; cek di Chrome: angka Dashboard Sep 2026 = report-1 (income 11.957.000, expense 7.456.000, avg 248.533,33, ratio 62,36%); Σ harian = Σ mingguan = total; bulanan 12 baris; tahunan 2024–2026; kalender Sep 2026 dimulai Selasa (1 Sep); desktop + 360px + dark mode; console bersih. Tulis `report-5.md`, commit, lalu **tanya user** sebelum Phase 7.
