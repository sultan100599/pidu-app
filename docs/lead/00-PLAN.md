# Pidu-App — Master Plan (Lead: Claude, Executor: Kimi CLI)

## Hasil analisis kondisi awal (2026-09-28)
- `C:\Pidu-App` kosong → greenfield, tidak ada kode existing yang perlu dijaga.
- PHP 8.2.12 (XAMPP `C:\xampp82`), Composer 2.9.7, Node 22.21, npm 10.9.

- Belum git repo → Phase 0 lakukan `git init`.

## Keputusan teknis (FINAL — executor jangan mengubah tanpa izin lead)
| Area | Keputusan |
|---|---|
| Struktur | Monorepo: `backend/` (Laravel), `frontend/` (React + Vite), `package.json` di root |
| Menjalankan | **Cukup `npm start` di root** → `concurrently` menjalankan BE + FE sekaligus. `npm run setup` sekali di awal (composer install, npm install, key, migrate --seed) |
| Port | **Backend 8001** (`php artisan serve --port=8001`), **Frontend 8010** (Vite `server.port=8010, strictPort`) |
| Koneksi FE→BE | Vite proxy `/api` → `http://127.0.0.1:8001`. Axios `baseURL: '/api'` → tanpa CORS, tanpa URL hardcode |
| Database | SQLite sekarang. Kode harus tetap bisa pindah ke MySQL hanya dengan ganti `.env`: semua ekspresi tanggal untuk GROUP BY (hari/minggu/bulan/tahun) dikumpulkan di satu helper `App\Support\DateSql` yang mengecek `DB::getDriverName()` (sqlite → `strftime`, mysql → `DATE_FORMAT`/`YEAR`/`MONTH`). Jangan pakai fungsi SQL spesifik MySQL di tempat lain |
| Backend | Laravel 11 (kompatibel PHP 8.2), REST API di `routes/api.php` |
| Auth | Laravel Sanctum **token** (Bearer), bukan cookie SPA — paling sederhana untuk dev beda port |
| Multi-user | `user_id` di `transactions`, `categories`, `budgets`. Semua query di-scope ke `auth()->id()`. Akses record milik user lain → **404** (bukan 403) |
| Amount | `DECIMAL(15,2)` di DB, dikirim ke API sebagai number. Tidak pernah string "Rp" |
| type | enum string `income` / `expense` |
| payment_method | enum string: `cash, transfer, debit, credit_card, e_wallet, qris, other` |
| Minggu | Minggu mulai **Senin** (ISO). Rekap mingguan = per minggu ISO dalam rentang yang dipilih |
| Timezone | `APP_TIMEZONE=Asia/Jakarta`, locale `id` |
| Export | `maatwebsite/excel` (xlsx) + `barryvdh/laravel-dompdf` (pdf) |
| Frontend | React 18 + Vite, React Router v6, Axios, Bootstrap 5 + bootstrap-icons, Chart.js 4 + react-chartjs-2 |
| Notifikasi | react-toastify (atau komponen Toast Bootstrap sendiri) |
| Dark mode | Bootstrap 5.3 `data-bs-theme`, simpan di localStorage |
| Kode | Controller tipis → Service (logika & query agregat) → Model. FormRequest untuk validasi, API Resource untuk output |

## Kontrak API (semua di bawah `auth:sanctum` kecuali login)
```
POST   /api/auth/login        {email,password} -> {token,user}
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/transactions      ?page&per_page&search&type&category_id&payment_method&start_date&end_date&sort&dir
POST   /api/transactions
GET    /api/transactions/{id}
PUT    /api/transactions/{id}
DELETE /api/transactions/{id}
GET    /api/categories        ?type&active
POST   /api/categories
PUT    /api/categories/{id}
PATCH  /api/categories/{id}/toggle
DELETE /api/categories/{id}   (tolak 422 jika masih dipakai transaksi → sarankan nonaktifkan)
GET    /api/dashboard         ?start_date&end_date&type&category_id&payment_method
GET    /api/reports/daily     ?start_date&end_date (+filter umum)
GET    /api/reports/weekly    ?start_date&end_date
GET    /api/reports/monthly   ?year
GET    /api/reports/yearly
GET    /api/reports/calendar  ?year&month
GET    /api/budgets           ?month&year   (sertakan used, remaining, percentage, status: ok|warning|exceeded)
POST   /api/budgets
PUT    /api/budgets/{id}
DELETE /api/budgets/{id}
GET    /api/export/excel      (filter sama dengan /transactions)
GET    /api/export/pdf
```
Format error: `{ "message": "...", "errors": {field: [..]} }` (default Laravel). Production (`APP_DEBUG=false`) tidak boleh bocor stack trace.

## Urutan kerja
Setiap phase punya file prompt `docs/lead/phase-N.md`. Alur:
1. User paste isi file phase ke Kimi CLI.
2. Kimi mengerjakan + menjalankan verifikasi yang diminta di file tersebut.
3. User kembali ke Claude: "review phase N".
4. Claude review kode + jalankan tes → tulis `docs/lead/review-N.md` (fix list) atau lanjut ke phase berikutnya.

| Phase | Isi |
|---|---|
| 0+1 | Scaffold, git, DB, migration, model, relasi, seeder |
| 2 | Auth + API + Service + Validation + Resource + feature tests |
| 3 | Frontend scaffold, layout, sidebar, routing, login, dark mode |
| 4 | Transaksi CRUD + kategori UI |
| 5+6 | Dashboard + charts + rekap harian/mingguan/bulanan/tahunan + kalender |
| 7 | Budget |
| 8 | Export Excel/PDF (ikut filter) + **"Export Semua ke Excel"** (multi-sheet: Transaksi, Harian, Mingguan, Bulanan, Tahunan, Kategori, Budget). Opsional: import dari Excel & auto-backup Excel ke `backend/storage/app/backups` |
| 9 | Polishing, responsive, error/empty/loading state, final QA |

