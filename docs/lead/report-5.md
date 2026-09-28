# Report Phase 5+6 — Dashboard, Grafik, Rekap & Kalender

Tanggal: 2026-09-29 · Executor & reviewer: Claude · Scope: `frontend/` saja (backend tidak diubah).

## Ringkasan
Dashboard dan semua halaman laporan (Harian, Mingguan, Bulanan, Tahunan, Kalender) selesai dan dicek di Chrome. Semua angka cocok dengan report-1. Lint 0 warning, build tanpa peringatan ukuran chunk.

## File
**Baru**
- `api/reports.js` — dashboard, daily, weekly, monthly, yearly, calendar, day
- `hooks/useFetch.js` — pola fetch berbasis key (tanpa race, AbortController, data lama tetap tampil saat refetch)
- `components/PeriodPicker.jsx` (+ hook `usePeriodQuery`, state periode di URL)
- `components/charts/{setup.js,useChartTheme.js,IncomeExpenseChart.jsx,CategoryDoughnut.jsx}`
- `pages/dashboard/DashboardPage.jsx`
- `pages/reports/{DailyReportPage,WeeklyReportPage,MonthlyReportPage,YearlyReportPage,CalendarPage,DayDetailModal,ReportTable,ReportShell,Stepper}.jsx`

**Diubah**
- `App.jsx` — route halaman bergrafik memakai `React.lazy`
- `components/layout/AppLayout.jsx` — `<Suspense>` di sekitar `<Outlet>` (sidebar tetap tampil saat chunk dimuat)
- `context/ThemeContext.jsx` — `data-bs-theme` dipasang langsung saat toggle (lihat bug #1)
- `utils/format.js` — `formatCompact`, `formatYearMonth`, `formatDayMonth`, `MONTH_NAMES`
- `styles/app.css` — tabel laporan, grid kalender, stepper
- `package.json` — `chart.js` ^4.5.1, `react-chartjs-2` ^5.3.1

## Fitur
- **Dashboard:** pemilih periode (default bulan ini, disimpan di URL); 4 kartu ringkasan; rata-rata pengeluaran per hari dan rasio pengeluaran ("—" jika belum ada pemasukan); grafik batang pemasukan vs pengeluaran (per hari ≤ 62 hari, selebihnya per bulan) dengan tooltip Rupiah; doughnut dan daftar pengeluaran per kategori (klik → Transaksi terfilter kategori dan periode yang sama); 5 pengeluaran terbesar; progress budget bulan dari akhir periode (hijau/kuning/merah).
- **Rekap Harian:** periode, total, grafik, tabel dengan baris total, toggle "Sembunyikan hari kosong" (default aktif); klik baris → modal detail hari.
- **Rekap Mingguan:** minggu ISO Senin–Minggu dipotong ke periode; klik baris → Rekap Harian minggu itu.
- **Rekap Bulanan:** ‹ tahun ›; 12 bulan; klik → Rekap Harian bulan itu.
- **Rekap Tahunan:** klik → Rekap Bulanan tahun itu.
- **Kalender:** ‹ bulan › + "Hari ini"; grid Senin–Minggu; hari ini ditandai. Di ≥ 576px sel menampilkan nominal ringkas ("−137 rb") dan jumlah transaksi; di layar lebih kecil hanya titik warna. Klik → modal detail hari (daftar transaksi, total, link "Lihat di Transaksi").
- Baris tabel yang bisa diklik bisa difokus dengan keyboard (Enter/Spasi) dan punya `aria-label`. Grafik diberi `role="img"` + `aria-label`.

## Bug yang ditemukan saat review & diperbaiki
1. **Warna grafik tertinggal satu tema.** ThemeContext memasang `data-bs-theme` di `useEffect` (setelah render), sementara grafik membaca variabel CSS saat render. Sekarang atribut dipasang di `toggleTheme` sebelum `setState`. Sudah dicek: toggle dark → light langsung mengganti warna grid, legend, dan border doughnut.
2. **Bundle > 500 kB** setelah Chart.js masuk. Halaman bergrafik sekarang di-lazy-load: bundle awal 312 kB (sebelumnya 391 kB), Chart.js di chunk terpisah (188 kB), dan login/transaksi tidak memuatnya.
3. **Nominal di sel kalender terpotong** di 360px ("−137..."). Diganti titik warna di < 576px.
4. Lint `react(purity)`: `new Date()` saat render di Kalender dan Bulanan. Sekarang dibekukan dengan `useState(() => new Date())`.
5. Judul budget di Dashboard mengikuti bulan dari akhir periode (backend memakai `end_date`), bukan selalu "bulan ini". Teks kosongnya menjadi "bulan tersebut".

## Verifikasi (Chrome DevTools)
| Cek | Hasil |
|---|---|
| Dashboard Sep 2026 | Pemasukan 11.957.000, pengeluaran 7.456.000, saldo 4.501.000, 124 transaksi, rata-rata **248.533,33**, rasio **62,36%** (= report-1) |
| Budget Sep 2026 | Belanja 110,03% merah, Rokok 114,93% merah, Hiburan 85,23% kuning, Transportasi 89,99% kuning, Makanan 70,01% hijau (= report-1) |
| Rekap Harian | 30 baris (28 berisi data); total = dashboard |
| Rekap Mingguan | 5 minggu: 1–6, 7–13, 14–20, 21–27, **28–30 Sep**; total = total harian |
| Klik minggu 3 | → `/reports/daily?period=custom&start_date=2026-09-14&end_date=2026-09-20`, total 2.930.000 / 1.523.000 |
| Rekap Tahunan | 2024: 102.000.000 / 15.818.000; 2025: 102.000.000 / 15.247.000; 2026: 44.054.000 / 30.757.000 (= report-1) |
| Klik 2025 → Bulanan | 12 baris, total 102.000.000 / 15.247.000 |
| Kalender Sep 2026 | 1 sel kosong (Senin), tanggal 1 = Selasa; 29 Sep (hari ini) ditandai |
| Detail 25 Sep | 6 transaksi; pemasukan 8.500.000, pengeluaran 164.000, saldo 8.336.000 |
| Periode tanpa data (Jan 2023) | Semua 0, rasio "—", empty state, tanpa error |
| Mobile 360px + dark mode | scrollWidth 360 (tanpa horizontal scroll), tidak ada elemen yang meluber |
| Console | bersih |
| lint / build | 0 warning / sukses |
| Port 8001/8010 | kosong setelah selesai |

## Catatan
- **`npm audit`: 2 advisory moderate di `react-router` v6** (open redirect via backslash pada `<Link>`/`navigate`, dan satu advisory SSR yang tidak relevan untuk SPA). Advisory ini sudah ada sejak Phase 3. Perbaikannya upgrade ke react-router v7 (breaking); keputusan ada di user. Risiko di app ini kecil: satu-satunya navigate dari data luar adalah `location.state.from` setelah login, dan nilainya selalu path internal dari router.
- Urutan transaksi di modal detail hari mengikuti backend (`type` asc → pengeluaran dulu, lalu nominal terbesar).
