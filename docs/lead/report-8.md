# Report Phase 8 — Export Excel/PDF + "Export Semua ke Excel"

Tanggal: 2026-09-29 · Executor & reviewer: Claude · Scope: backend + frontend.
Impor Excel dan auto-backup (opsional di 00-PLAN) **belum** dikerjakan; bisa ditambah jika diminta.

## Ringkasan
- `GET /api/export/excel` dan `/api/export/pdf` memakai filter **sama persis** dengan daftar transaksi (search, jenis, kategori, metode, periode, urutan).
- `GET /api/export/all?year=` menghasilkan satu xlsx berisi 7 sheet: Transaksi, Harian, Mingguan, Bulanan, Tahunan, Kategori, Budget.
- Frontend: tombol **Export** (Excel/PDF) di halaman Transaksi dan halaman **Export**.
- **58 tes backend lolos** (9 tes export baru + 1 tes pesan validasi). Lint 0 warning, build sukses.

## Backend
**Paket:** `maatwebsite/excel` 3.1.70 (PhpSpreadsheet 1.30.7), `barryvdh/laravel-dompdf` 3.1.2 (dompdf 3.1.6). `composer audit` bersih.

**File baru**
- `app/Http/Controllers/Api/ExportController.php`
- `app/Http/Requests/ExportRequest.php` (turunan `TransactionIndexRequest` + `filterSummary()` untuk header PDF), `ExportAllRequest.php`
- `app/Services/ExportService.php`
- `app/Exports/{TransactionsExport,AllDataExport}.php`, `app/Exports/Sheets/{TransactionsSheet,ArraySheet,Styling,SafeValues}.php`
- `resources/views/exports/transactions-pdf.blade.php`
- `tests/Feature/Api/ExportTest.php`

**Diubah**
- `routes/api.php`: grup `export` dengan `throttle:10,1`
- `app/Services/ReportService.php`: `categoryTotals()` untuk sheet Kategori
- `app/Http/Requests/ApiRequest.php`: perbaikan pesan validasi (bug #1)

**Detail**
- **Excel:** tanggal disimpan sebagai tanggal Excel asli (format dd/mm/yyyy), nominal berupa angka (pengeluaran negatif, sehingga kolom bisa langsung dijumlah = saldo), header tebal dan dibekukan, kolom auto-size, lalu baris total pemasukan, pengeluaran, dan saldo. Sheet transaksi dibaca per chunk (FromQuery).
- **Export semua:** memakai `ReportService` dan `BudgetService` yang sama dengan halaman laporan, sehingga angkanya identik. Harian 365/366 baris + total, Mingguan (minggu ISO) + total, Bulanan 12 + total, Tahunan semua tahun + total, Kategori (total, jumlah transaksi, porsi dari jenisnya), Budget 12 bulan (budget, terpakai, sisa, persen, status).
- **PDF:** A4 berisi judul, nama user, periode, filter aktif, 4 kotak ringkasan, dan tabel. Font subsetting aktif (**±900 KB → 23 KB**). Dibatasi 2.000 baris; di atas itu → 422 "PDF dibatasi 2.000 transaksi (hasil filter: N). Persempit filter atau gunakan export Excel."
- Nama file: `pidu-transaksi-YYYYMMDD-HHmmss.xlsx|pdf`, `pidu-semua-{tahun}-YYYYMMDD-HHmmss.xlsx`.

## Frontend
- `api/export.js`: unduh lewat axios `responseType: 'blob'` (tetap memakai Bearer token), nama file dari `Content-Disposition`. Error berupa blob JSON diubah kembali ke objek, sehingga `getErrorMessage` tetap bekerja.
- `components/ExportMenu.jsx`: dropdown Excel/PDF di header Transaksi. Mengirim filter dan urutan aktif tanpa `page`/`per_page`; disabled jika hasil kosong atau periode kustom tidak valid.
- `pages/export/ExportPage.jsx`:
  - kartu "Export transaksi" (periode termasuk "Semua tanggal" + jenis → Excel/PDF);
  - kartu "Export semua ke Excel" (‹ tahun ›, daftar 7 sheet).
- `PlaceholderPage.jsx` dihapus (semua halaman sudah terisi).

## Bug/risiko yang ditemukan saat review & diperbaiki
1. **Pesan validasi aturan ukuran selama ini berbahasa Inggris** (bug dari Phase 2). Contoh: "The tahun field must be between 2000 and 2100." Penyebab: `ApiRequest` memakai kunci `'between.numeric'`/`'max.string'`, padahal Laravel mencari kunci `'between'` berisi array per tipe. Aturan `max`, `min`, `between`, dan `gt` terdampak (termasuk "Deskripsi maksimal 255 karakter", "Password minimal 8 karakter", dan `per_page`). Sudah diperbaiki, dan tes baru memastikan keempatnya berbahasa Indonesia.
2. **Formula injection di Excel:** binder default PhpSpreadsheet menjadikan teks yang diawali `=` sebagai formula. Deskripsi seperti `=HYPERLINK(...)` akan dieksekusi saat file dibuka. Trait `SafeValues` memaksa nilai seperti itu menjadi teks. Sudah dites.
3. **PDF ±900 KB** karena font DejaVu di-embed utuh. Font subsetting diaktifkan → 23 KB.
4. Header "Nominal" di PDF rata kiri (specificity CSS) → rata kanan.
5. Tombol Export (`outline-secondary`) dan badge sheet (`text-bg-light`) terlihat seperti nonaktif atau terlalu mencolok di dark mode → diganti ke varian yang mengikuti tema.

## Verifikasi
**Backend:** `php artisan test` → **58 passed (337 assertions)**. Isi export dicek dengan membuka xlsx memakai PhpSpreadsheet:
| Cek | Hasil |
|---|---|
| Excel pengeluaran Sep 2026 | Total pengeluaran −7.456.000 (= report-1) |
| Export semua 2026 | 7 sheet; Harian total 44.054.000 / 30.757.000 / saldo 13.297.000 / 472 transaksi (= report-1); Tahunan 248.054.000 / 61.822.000; Budget Belanja 110,03% "Terlampaui" |
| PDF | `%PDF`, filter tertulis di header, total benar |

**Chrome:**
| Cek | Hasil |
|---|---|
| Transaksi `?period=this_month&type=expense&search=makan` → Export Excel & PDF | Request membawa filter yang sama (tanpa page/per_page); dua file terunduh (xlsx 7,5 KB, PDF 22,9 KB); toast "… diunduh." |
| Halaman Export → Export semua 2026 | `pidu-semua-2026-….xlsx` terunduh (39 KB) |
| Tahun 1999 (sengaja invalid) | Toast "Tahun harus antara 2000 dan 2100." (error blob terbaca dan berbahasa Indonesia) |
| 360px + dark | Tidak ada horizontal scroll; dropdown Export di dalam layar |
| Console | Hanya 422 dari uji tahun 1999 yang disengaja |
| Data | 696 transaksi / 44 kategori / 5 budget (= seed); 7 token sisa sesi review dihapus |
| Port 8001/8010 | kosong |
