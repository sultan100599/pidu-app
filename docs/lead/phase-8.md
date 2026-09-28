# PHASE 8 — Export Excel/PDF + "Export Semua ke Excel"

Executor & reviewer: Claude. Backend + frontend. Impor Excel & auto-backup (opsional di plan) **tidak** dikerjakan di phase ini; bisa ditambah kemudian jika diminta.

## Backend
- Paket: `maatwebsite/excel` (xlsx) + `barryvdh/laravel-dompdf` (pdf), sesuai keputusan di 00-PLAN.
- `GET /api/export/excel` dan `GET /api/export/pdf`: filter **sama persis** dengan `GET /api/transactions` (search, type, category_id, payment_method, start_date/end_date atau year/month, sort, dir). Tanpa periode = semua tanggal. Data milik user saja.
  - Excel: satu sheet "Transaksi" (Tanggal sebagai tanggal Excel, Jenis, Kategori, Deskripsi, Catatan, Metode, Nominal sebagai angka), header tebal, freeze baris header, auto-size, lalu baris total pemasukan/pengeluaran/saldo.
  - PDF: A4, judul, periode, ringkasan filter, total, tabel transaksi. Dibatasi 2.000 baris (dompdf berat); jika lebih → 422 dengan pesan "gunakan Excel".
- `GET /api/export/all?year=` (default tahun ini): satu file xlsx multi-sheet: **Transaksi, Harian, Mingguan, Bulanan, Tahunan, Kategori, Budget**, memakai ReportService/BudgetService yang sudah ada (angka sama dengan halaman laporan).
- Nama file: `pidu-transaksi-YYYYMMDD-HHmmss.xlsx|pdf`, `pidu-semua-{year}-YYYYMMDD-HHmmss.xlsx`.
- Tes feature: isi export mengikuti filter + isolasi user, isi 7 sheet, PDF valid (`%PDF`), batas baris PDF, 401 tanpa token, 422 filter invalid.

## Frontend
- `api/export.js`: unduh via axios `responseType: 'blob'` (tetap memakai Bearer token), nama file dari `Content-Disposition`, error blob JSON diubah jadi pesan.
- Halaman Transaksi: tombol "Export" (Excel / PDF) memakai filter aktif di URL.
- Halaman `/export`: (1) export transaksi dengan pilihan periode + jenis → Excel/PDF; (2) "Export Semua ke Excel" per tahun.

## Review
`php artisan test` + lint/build; di Chrome: unduh file benar-benar terjadi (nama file, ukuran), isi xlsx dicek (sheet & total cocok dengan laporan), PDF terbuka; 360px + dark. `report-8.md`, commit, **tanya user** sebelum Phase 9.
