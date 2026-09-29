# Pidu-App

Aplikasi pencatat keuangan pribadi: catat pemasukan dan pengeluaran, lihat rekap harian sampai tahunan, atur budget per kategori, lalu export ke Excel atau PDF.

Monorepo: **backend** Laravel 12 (REST API, Sanctum) + **frontend** React 19 (Vite, Bootstrap 5, Chart.js).

## Fitur

- **Login / daftar** (token Sanctum, berlaku 30 hari). User baru otomatis mendapat 22 kategori default.
- **Transaksi:** tambah, edit, hapus; filter (cari, jenis, kategori, metode, periode), urutan, dan pagination. Semua filter tersimpan di URL. Ringkasan pemasukan, pengeluaran, dan saldo untuk seluruh hasil filter.
- **Kategori:** pemasukan/pengeluaran, ikon & warna, aktif/nonaktif. Kategori yang masih dipakai tidak bisa dihapus.
- **Dashboard:** ringkasan, rata-rata pengeluaran per hari, rasio pengeluaran, grafik pemasukan vs pengeluaran, pengeluaran per kategori, 5 pengeluaran terbesar, dan status budget.
- **Laporan:** rekap harian, mingguan (minggu Senin–Minggu), bulanan, tahunan, dan kalender. Klik untuk melihat detail per hari.
- **Budget:** batas pengeluaran per kategori per bulan dengan status aman (< 80%), hampir habis (≥ 80%), dan terlampaui (≥ 100%), plus "Salin bulan lalu".
- **Export:** transaksi ke Excel/PDF sesuai filter, dan "Export Semua ke Excel" per tahun (7 sheet: Transaksi, Harian, Mingguan, Bulanan, Tahunan, Kategori, Budget).
- **Impor:** tambah banyak transaksi dari Excel/CSV (template tersedia). File diperiksa dulu (error per baris, pratinjau), baris yang sudah ada dilewati, kategori baru dibuat otomatis. File hasil Export/Backup bisa langsung diimpor ulang.
- **Backup otomatis:** setiap hari (default 23:00) selama `npm start` berjalan: xlsx semua transaksi per user + snapshot database SQLite, 14 terbaru disimpan. Bisa juga "Backup sekarang" dan unduh dari halaman Export & Backup.
- Dark mode, tampilan mobile, dan data tiap user terisolasi (data user lain → 404).

## Prasyarat

- PHP 8.2+ dengan ekstensi `pdo_sqlite`, `mbstring`, `gd`, `zip`, `xml`, `dom` & Composer 2
- Node.js 18+ & npm
- Tidak butuh server database, cukup **SQLite**

## Setup (sekali saja)

```bash
npm run setup
```

Perintah ini menjalankan `composer install`, membuat `.env` dan `database.sqlite` jika belum ada, `key:generate`, `migrate:fresh --seed`, lalu `npm install` di root dan `frontend/`. Script `setup` memakai sintaks cmd Windows; untuk OS lain jalankan manual:

```bash
cd backend
composer install
cp .env.example .env
touch database/database.sqlite
php artisan key:generate
php artisan migrate:fresh --seed
cd ..
npm install
npm --prefix frontend install
```

## Menjalankan

```bash
npm start
```

| | URL |
|---|---|
| Aplikasi (frontend) | http://localhost:8010 |
| Backend API | http://127.0.0.1:8001 (frontend memanggil `/api`, di-proxy oleh Vite) |

**Akun demo** (dari seeder): `demo@pidu.test` / `password`. Berisi data Juni–September 2026 lengkap plus data ringan 2024–2025. Akun kedua `other@pidu.test` / `password` dipakai untuk menguji isolasi data.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm start` | Backend + frontend + scheduler backup (log scheduler disembunyikan) |
| `npm run be` / `npm run fe` | Backend saja / frontend saja |
| `npm test` | Tes backend (PHPUnit) + lint frontend (oxlint) |
| `npm run build` | Build production frontend ke `frontend/dist` |
| `npm run db:reset` | Hapus semua data lalu seed ulang data demo |
| `cd backend && php artisan pidu:backup` | Backup manual (semua user + snapshot database) |

## Struktur

```
backend/                      Laravel 12
  app/Http/Controllers/Api/   controller tipis (auth, transaksi, kategori, dashboard, laporan, budget, export)
  app/Http/Requests/          validasi + pesan Bahasa Indonesia (ApiRequest)
  app/Services/               logika & query agregat (SUM/COUNT/GROUP BY di database)
  app/Support/                Period (rentang tanggal), Money, DateSql (ekspresi tanggal lintas SQLite/MySQL)
  app/Exports/                sheet Excel
  app/Services/Import/        impor Excel/CSV
  tests/Feature/Api/          feature test
frontend/                     React 19 + Vite
  src/api/                    axios client (Bearer token) per resource
  src/pages/                  halaman (transactions, categories, dashboard, reports, budgets, export)
  src/components/             layout, grafik, komponen UI bersama
docs/lead/                    rencana (00-PLAN), brief & laporan tiap phase
```

## Pindah ke MySQL

Semua ekspresi tanggal untuk GROUP BY ada di `App\Support\DateSql` (otomatis `strftime` untuk SQLite atau `DATE_FORMAT`/`YEAR`/`MONTH` untuk MySQL), jadi cukup ubah `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pidu_app
DB_USERNAME=root
DB_PASSWORD=
```

lalu `php artisan migrate:fresh --seed` di `backend/`. Seluruh test suite (76 tes) juga lolos di MariaDB 10.4 (XAMPP), dan angka laporan data demo identik dengan SQLite. Di MySQL, `pidu:backup` hanya membuat xlsx per user; untuk database gunakan `mysqldump`.

## Catatan production

- `.env`: `APP_ENV=production`, `APP_DEBUG=false` (error 500 hanya menampilkan "Terjadi kesalahan pada server.", detail tetap tercatat di `storage/logs`).
- `SANCTUM_EXPIRATION` (menit, default 30 hari). Token kedaluwarsa dibersihkan oleh scheduler (`php artisan schedule:work` atau cron `schedule:run`).
- Export & impor dibatasi 10 request/menit per user; PDF maksimal 2.000 transaksi; impor maksimal 5.000 baris / 5 MB.
- Backup ada di `backend/storage/app/backups` (tidak masuk Git; berisi data keuangan). Atur dengan `PIDU_BACKUP_KEEP`, `PIDU_BACKUP_TIME`. Di server, jalankan scheduler lewat cron: `* * * * * php artisan schedule:run`.
- Frontend production: `npm run build`, lalu sajikan `frontend/dist` sebagai SPA (semua path → `index.html`) dan teruskan `/api` ke backend.
