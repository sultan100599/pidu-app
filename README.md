# Pidu-App

Aplikasi pencatat keuangan pribadi: catat pemasukan dan pengeluaran per dompet, lihat rekap harian sampai tahunan, atur anggaran per kategori, lalu unduh ke Excel atau PDF. Tersedia dalam Bahasa Indonesia, English, dan Basa Sunda.

> **Status: masih dikembangkan.** Bisa dijalankan dan dipakai di komputer sendiri. Belum di-hosting, dan email lupa password belum tersambung ke Gmail.

Monorepo: **backend** Laravel 12 (REST API, Sanctum, SQLite) + **frontend** React 19 (Vite, Bootstrap 5, Chart.js).

**English summary:** Pidu is a personal finance tracker with a Laravel 12 REST API and a React 19 frontend. It tracks income and expenses across wallets, with transfers, recurring transactions, monthly budgets, reports from daily to yearly, Excel/PDF downloads, Excel import, and automatic backups. Covered by 112 backend feature tests and 16 Playwright end-to-end tests.

## Cara proyek ini dibuat

Pidu dibangun bertahap dalam 19 fase dengan bantuan AI coding agent. Sebagian besar kode ditulis oleh Claude Code; beberapa fase awal memakai Kimi dan Codex.

Peran saya (Sultan Nur Iskandar) adalah product owner dan reviewer:
- menentukan fitur dan prioritas tiap fase;
- memilih arah tampilan;
- memeriksa hasil di browser;
- memutuskan perbaikan mana yang dikerjakan.

Brief dan laporan setiap fase ada di [`docs/lead/`](docs/lead).

## Fitur

- **Masuk / daftar / lupa password** (token Sanctum, berlaku 30 hari). User baru otomatis mendapat 22 kategori bawaan.
- **Ringkasan:** saldo, rata-rata pengeluaran per hari, grafik pemasukan vs pengeluaran, pengeluaran per kategori, 5 pengeluaran terbesar, perbandingan dengan periode sebelumnya, dan status anggaran.
- **Transaksi:** tambah, ubah, hapus (bisa dibatalkan); filter cari, jenis, kategori, dompet, dan periode yang tersimpan di URL. Tombol `N` untuk catat cepat.
- **Dompet:** Tunai, rekening, dan e-wallet dengan saldo awal, tujuan Pribadi atau Usaha, serta **pindah saldo** antar dompet.
- **Transaksi rutin:** tagihan atau gaji bulanan yang tercatat otomatis.
- **Kategori:** pemasukan/pengeluaran, ikon dan warna, aktif/nonaktif. Kategori yang masih dipakai tidak bisa dihapus.
- **Laporan:** rekap harian, mingguan (Senin sampai Minggu), bulanan, tahunan, dan kalender.
- **Anggaran:** batas pengeluaran per kategori per bulan. Statusnya aman (< 80%), hampir habis (≥ 80%), atau terlampaui (≥ 100%). Ada juga tombol "Salin bulan lalu".
- **Unduh & Cadangan:**
  - Unduh transaksi ke Excel/PDF sesuai filter.
  - Unduh satu workbook per tahun berisi 7 sheet.
  - Cadangan otomatis tiap hari selama `npm start` berjalan.
- **Unggah:** tambah banyak transaksi dari Excel/CSV. File diperiksa dulu: error ditampilkan per baris, ada pratinjau, dan baris yang sudah ada dilewati.
- **Akun:**
  - Ubah nama dan password.
  - Atur jam pengingat catat.
  - Keluar dari semua perangkat.
  - Hapus akun beserta seluruh datanya.
- **Lainnya:**
  - Tema terang/gelap.
  - Tampilan HP dengan navigasi bawah.
  - Tiga bahasa.
  - Data tiap user terisolasi (data user lain → 404).

## Prasyarat

- PHP 8.2+ dengan ekstensi `pdo_sqlite`, `mbstring`, `gd`, `zip`, `xml`, `dom` & Composer 2
- Node.js 18+ & npm
- Tidak butuh server database, cukup **SQLite**

## Setup (sekali saja)

```bash
npm run setup
```

Perintah ini menjalankan:
- `composer install`;
- membuat `.env` dan `database.sqlite` jika belum ada;
- `key:generate`;
- `migrate:fresh --seed`;
- `npm install` di root dan `frontend/`.

Script `setup` memakai sintaks cmd Windows. Untuk OS lain, jalankan manual:

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

**Akun demo** (dari seeder): `demo@pidu.test` / `password`, berisi data contoh sampai hari seeder dijalankan. Akun kedua `other@pidu.test` / `password` dipakai untuk menguji isolasi data.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm start` | Backend + frontend + scheduler (cadangan, transaksi rutin) |
| `npm run be` / `npm run fe` | Backend saja / frontend saja |
| `npm test` | Tes backend (PHPUnit) + lint frontend (oxlint) |
| `npm run test:e2e` | Tes end-to-end Playwright dengan backend dan database terpisah |
| `npm run build` | Build production frontend ke `frontend/dist` |
| `npm run db:reset` | Hapus semua data lalu seed ulang data demo |
| `cd backend && php artisan pidu:backup` | Cadangan manual (semua user + snapshot database) |

## Struktur

```
backend/                      Laravel 12
  app/Http/Controllers/Api/   controller tipis per resource
  app/Http/Requests/          validasi + pesan tiga bahasa
  app/Services/               logika & query agregat (SUM/COUNT/GROUP BY di database)
  app/Support/                Period (rentang tanggal), Money, DateSql (ekspresi tanggal lintas SQLite/MySQL)
  app/Exports/                sheet Excel
  app/Services/Import/        unggah Excel/CSV
  tests/Feature/Api/          feature test
frontend/                     React 19 + Vite
  src/api/                    axios client (Bearer token) per resource
  src/pages/                  halaman
  src/components/             layout, grafik, komponen UI bersama
  src/i18n/                   teks Indonesia / English / Sunda
  e2e/                        tes Playwright
docs/lead/                    rencana, brief, dan laporan tiap fase
```

## Pindah ke MySQL

Semua ekspresi tanggal untuk GROUP BY ada di `App\Support\DateSql`. Kelas ini otomatis memakai `strftime` untuk SQLite atau `DATE_FORMAT`/`YEAR`/`MONTH` untuk MySQL. Jadi cukup ubah `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pidu_app
DB_USERNAME=root
DB_PASSWORD=
```

lalu jalankan `php artisan migrate:fresh --seed` di `backend/`. Di MySQL, `pidu:backup` hanya membuat xlsx per user; untuk database gunakan `mysqldump`.

## Catatan production

- **`.env`:** `APP_ENV=production` dan `APP_DEBUG=false`. Error 500 hanya menampilkan "Terjadi kesalahan pada server."; detailnya tetap tercatat di `storage/logs`.
- **`SANCTUM_EXPIRATION`:** dalam menit, bawaannya 30 hari. Token kedaluwarsa dibersihkan oleh scheduler.
- **Batasan:**
  - Unduh dan unggah dibatasi 10 request/menit per user.
  - PDF maksimal 2.000 transaksi.
  - Unggah maksimal 5.000 baris / 5 MB.
- **Cadangan:**
  - Tersimpan di `backend/storage/app/backups`, tidak masuk Git karena berisi data keuangan.
  - Atur dengan `PIDU_BACKUP_KEEP` dan `PIDU_BACKUP_TIME`.
  - Di server, jalankan scheduler lewat cron: `* * * * * php artisan schedule:run`.
- **Frontend production:** jalankan `npm run build`, sajikan `frontend/dist` sebagai SPA (semua path → `index.html`), lalu teruskan `/api` ke backend.
