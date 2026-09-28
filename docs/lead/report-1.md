# Report Phase 0+1 — Scaffold & Database

Tanggal: 2026-09-28 · Executor: Kimi CLI · Commit: `ce38bb9` ("Phase 1: scaffold, migrations, models, seeders")

## Ringkasan
Seluruh tugas Phase 0+1 selesai dan terverifikasi. **Satu deviasi penting: backend memakai Laravel 12.69.2, bukan 11** (penjelasan di bawah). Belum ada kode Phase 2+ yang dikerjakan.

## Deviasi dari instruksi

### 1. Laravel 12, bukan Laravel 11 (deviasi terpaksa)
- `composer create-project laravel/laravel:^11.0` **gagal**: seluruh versi Laravel 11 (v11.31.0–v11.56.1) diblokir oleh Composer 2.9 karena security advisories Packagist (PKSA-m5cs-t1y6-qpcs, PKSA-3r5d-mb8f-1qw9, PKSA-mdq4-51ck-6kdq, PKSA-8qx3-n5y5-vvnd, PKSA-q46n-4fdk-zjr4, PKSA-qzrn-rnz3-85w1). Laravel 11 sudah EOL.
- Alternatifnya mematikan proteksi (`audit.block-insecure=false`) = sengaja memasang framework dengan celah keamanan yang diketahui — tidak saya lakukan.
- **Laravel 12.69.2** dipakai sebagai gantinya: tetap memenuhi kebutuhan dasar keputusan ("Laravel 11 (kompatibel PHP 8.2)") karena Laravel 12 juga mensyaratkan PHP ^8.2. Struktur Laravel 12 setara 11 (`bootstrap/app.php`, `install:api`, Sanctum 4) — tidak ada dampak ke kontrak API maupun fase berikutnya.
- `composer audit`: **No security vulnerability advisories found**.

### 2. Tambahan `redirectGuestsTo` di `bootstrap/app.php` (di luar instruksi)
- Instruksi hanya meminta `shouldRenderJsonWhen` di `withExceptions`. Faktanya itu **tidak cukup**: middleware `Authenticate` tetap memanggil `route('login')` (default guest-redirect framework) → `RouteNotFoundException` → **HTTP 500 + stack trace**, padahal verifikasi phase mensyaratkan `401 JSON` untuk `/api/user`.
- Solusi: `$middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : route('login'));` → hasil: `{"message":"Unauthenticated."}` HTTP 401.

### 3. `BudgetSeeder` menghitung nominal dari data aktual
- Instruksi: "atur supaya ada yang <80%, ada yang 80–99%, ada yang ≥100% berdasarkan data seed". Cara paling tepat: `BudgetSeeder` membaca `sum(amount)` pengeluaran Sept 2026 per kategori hasil `TransactionSeeder`, lalu menetapkan `budget = used / rasio target` (Makanan 0.70, Transportasi 0.90, Hiburan 0.85, Belanja 1.10, Rokok 1.15). Karena TransactionSeeder deterministik, hasilnya stabil.

### 4. Hal kecil
- `APP_NAME` di `.env` & `.env.example` = `Pidu-App`; `APP_URL` di `.env.example` disamakan dengan `.env` (`http://127.0.0.1:8001`). File `.env` tidak bisa dibaca tool (pola file sensitif), jadi diedit via `sed` in-place tanpa menampilkan isinya.
- `docs/lead/run-kimi.ps1` ikut ter-commit (file yang sudah ada sejak awal, bukan dibuat phase ini).

## File dibuat

**Root**
- `.gitignore`, `README.md`, `package.json` (concurrently; script `start`/`be`/`fe`/`setup`/`db:reset` — `setup` memakai syntax cmd Windows sesuai instruksi dan **sudah diuji jalan**)

**Backend (Laravel 12)**
- `.env` (sqlite, `APP_TIMEZONE=Asia/Jakarta`, `APP_LOCALE=id`, `APP_URL=http://127.0.0.1:8001`), `.env.example` (+ blok MySQL terkomentar)
- `app/Support/DateSql.php` — `day()`, `yearMonth()`, `year()`, `month()` via `DB::getDriverName()` (sqlite `strftime` / mysql `DATE_FORMAT`,`YEAR`,`MONTH`)
- `app/Enums/TransactionType.php`, `app/Enums/PaymentMethod.php` (+ `label()` Indonesia)
- `app/Models/{User,Category,Transaction,Budget}.php` — relasi, casts enum, `scopeBetween`, `scopeOfType`, `scopeFilter` (type, category_id, payment_method, search description/notes), `$fillable` tanpa `user_id`
- `app/Services/DefaultCategoryService.php` — 7 kategori income + 15 expense, icon bootstrap-icons + warna netral, batch insert, idempotent
- `database/migrations/` — `categories` (unique user_id+type+name; index user_id+type+is_active), `transactions` (FK category restrictOnDelete; 7 index termasuk composite user_id+transaction_date & user_id+type+transaction_date), `budgets` (unique user_id+category_id+month+year)
- `database/seeders/` — `DatabaseSeeder` (demo@pidu.test + other@pidu.test, password `password`), `CategorySeeder`, `TransactionSeeder` (deterministik `mt_srand(42)`; Juni–Sep 2026 lengkap sampai tgl 28; data ringan 2024 & 2025; ±50% transaksi `other` user; chunk insert 500), `BudgetSeeder`
- `bootstrap/app.php` — `shouldRenderJsonWhen(api/*)` + `redirectGuestsTo` (lihat deviasi #2)
- `routes/api.php` (dari `install:api`), Sanctum `HasApiTokens` di `User`

**Frontend (React 18 + Vite)**
- Scaffold bawaan `npm create vite` + `vite.config.js`: `port 8010, strictPort`, proxy `/api → http://127.0.0.1:8001`. Fitur UI **belum** dikerjakan (sesuai scope).

## Output verifikasi (dijalankan)

**1. `php artisan migrate:fresh --seed`** — sukses; 8 migration termasuk 3 tabel baru; 3 seeder DONE.

**2. Count via tinker**
```
transactions: 696
categories: 44        (22 kategori × 2 user)
budgets: 5
users: 2
```

**3. Total income/expense user demo**
```
== Per bulan 2026 ==
2026-06  income:    9.351.000  expense:    7.050.000
2026-07  income:   11.356.000  expense:    7.490.000
2026-08  income:   11.390.000  expense:    8.761.000
2026-09  income:   11.957.000  expense:    7.456.000
== Per tahun ==
2024  income:    102.000.000  expense:     15.818.000
2025  income:    102.000.000  expense:     15.247.000
2026  income:     44.054.000  expense:     30.757.000
```

**4. Status budget Sept 2026** (target: ada <80%, 80–99%, ≥100% — terpenuhi)
```
Makanan       70.0%   → ok
Transportasi  90.0%   → warning
Hiburan       85.2%   → warning
Belanja      110.0%   → exceeded
Rokok        114.9%   → exceeded
```

**5. `npm start` (root)** — concurrently menjalankan BE+FE:
- `http://127.0.0.1:8001/up` → **HTTP 200**
- `http://localhost:8010/` → **HTTP 200**, halaman Vite React tampil (`<title>frontend</title>`)
- `http://localhost:8010/api/user` (via proxy) → **HTTP 401**, body `{"message":"Unauthenticated."}` (JSON, bukan error proxy)
- Server dihentikan setelah dicek.

**6. `npm run setup` diuji ulang** — seluruh rantai cmd Windows (composer install → cek/copy `.env` → cek/buat `database.sqlite` → key:generate → migrate:fresh --seed → npm install ×2) jalan; data ter-seed ulang identik (696/44/5) — membuktikan determinisme.

**7. Git** — `.env`, `database.sqlite`, `vendor/`, `node_modules/` terbukti ter-ignore (`git check-ignore`); 95 file, commit `ce38bb9`.

## Catatan untuk Phase 2+
- Login Sanctum belum punya route (Phase 2); token bisa dibuat manual via tinker bila perlu smoke-test sebelum controller auth ada.
- DateSql siap dipakai untuk semua GROUP BY tanggal (reports/dashboard/budget aggregation).
