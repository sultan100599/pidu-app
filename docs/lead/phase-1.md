# PHASE 0 + 1 — Scaffold & Database

Kamu adalah executor. Lead-mu (Claude) sudah menetapkan keputusan teknis di `docs/lead/00-PLAN.md` — BACA DULU dan ikuti. Jangan mengerjakan phase lain selain yang di bawah ini. Working dir: `C:\Pidu-App`. OS Windows, PHP 8.2 di PATH. Database pakai **SQLite** (tanpa XAMPP/MySQL server).

## Tugas

### 0. Scaffold
- `git init` di `C:\Pidu-App`, buat `.gitignore` root.
- `composer create-project laravel/laravel:^11.0 backend`
- Di `backend`: `php artisan install:api` (Sanctum). Tambahkan trait `HasApiTokens` ke `User`.
- `.env`: `DB_CONNECTION=sqlite` (hapus/komentari DB_HOST, DB_DATABASE dll. → default `database/database.sqlite`), `APP_TIMEZONE=Asia/Jakarta`, `APP_LOCALE=id`. Pastikan file `database/database.sqlite` ada (di-gitignore). Update `.env.example` juga (tanpa secret). Tambahkan juga contoh blok MySQL yang dikomentari di `.env.example` untuk migrasi nanti.
- Buat `app/Support/DateSql.php` (lihat 00-PLAN): method `day($col)`, `yearMonth($col)`, `year($col)`, `month($col)` yang mengembalikan ekspresi SQL sesuai driver sqlite/mysql.
- Frontend: hanya scaffold kosong dulu → `npm create vite@latest frontend -- --template react`, lalu `npm install` di `frontend`. `vite.config.js`:
  ```js
  server: { port: 8010, strictPort: true,
            proxy: { '/api': { target: 'http://127.0.0.1:8001', changeOrigin: true } } }
  ```
  Fitur UI BELUM dikerjakan di phase ini.
- `package.json` di ROOT `C:\Pidu-App` (devDependency `concurrently`):
  ```json
  {
    "name": "pidu-app",
    "private": true,
    "scripts": {
      "start": "concurrently -k -n BE,FE -c blue,green \"npm:be\" \"npm:fe\"",
      "be": "cd backend && php artisan serve --host=127.0.0.1 --port=8001",
      "fe": "npm --prefix frontend run dev",
      "setup": "cd backend && composer install && (if not exist .env copy .env.example .env) && (if not exist database\\database.sqlite type nul > database\\database.sqlite) && php artisan key:generate && php artisan migrate:fresh --seed && cd .. && npm install && npm --prefix frontend install",
      "db:reset": "cd backend && php artisan migrate:fresh --seed"
    },
    "devDependencies": { "concurrently": "^9.0.0" }
  }
  ```
- Di `backend/bootstrap/app.php` → `withExceptions`: `$exceptions->shouldRenderJsonWhen(fn ($request) => $request->is('api/*'));` supaya semua error API selalu JSON (401 tidak redirect ke route `login`).
  (Windows cmd syntax untuk `setup` — pastikan benar-benar jalan di Windows.) `APP_URL=http://127.0.0.1:8001` di `.env`.
- Buat `README.md` root singkat: prasyarat (PHP 8.2 + Composer + Node, tanpa server database), `npm run setup` sekali, lalu `npm start` → buka http://localhost:8010.

### 1. Migration (backend/database/migrations)
`categories`
- id, user_id (FK users, cascadeOnDelete), name string(100), type enum('income','expense'), icon string(50) nullable, color string(20) nullable, is_active bool default true, timestamps
- unique(user_id, type, name); index(user_id, type, is_active)

`transactions`
- id, user_id (FK cascade), category_id (FK categories, restrictOnDelete), transaction_date date, type enum('income','expense'), amount decimal(15,2) unsigned, payment_method enum('cash','transfer','debit','credit_card','e_wallet','qris','other') default 'cash', description string(255) nullable, notes text nullable, timestamps
- index: transaction_date, type, category_id, payment_method, dan composite (user_id, transaction_date), (user_id, type, transaction_date)

`budgets`
- id, user_id (FK cascade), category_id (FK categories cascade), month tinyint unsigned (1-12), year smallint unsigned, amount decimal(15,2) unsigned, timestamps
- unique(user_id, category_id, month, year)

### 2. Model + relasi
- `app/Enums/TransactionType.php` (income, expense) dan `app/Enums/PaymentMethod.php` (7 nilai + method `label()` berbahasa Indonesia: Cash, Transfer, Debit, Kartu Kredit, E-Wallet, QRIS, Lainnya). Cast enum di model.
- `Transaction` belongsTo Category, belongsTo User. casts: transaction_date→date, amount→decimal:2.
- `Category` hasMany Transaction, hasMany Budget, belongsTo User.
- `Budget` belongsTo Category, belongsTo User.
- `User` hasMany transactions/categories/budgets.
- Scope lokal di Transaction: `scopeBetween($q, $start, $end)`, `scopeOfType`, `scopeFilter(array $filters)` (type, category_id, payment_method, search di description/notes).
- `$fillable` eksplisit, JANGAN masukkan user_id ke fillable (diisi server).

### 3. Seeder
- `CategorySeeder` sebagai *service* yang bisa dipanggil per user: buat class `App\Services\DefaultCategoryService::createFor(User $user)` berisi kategori default:
  - income: Gaji, Bonus, Freelance, Bisnis, Investasi, Hadiah, Lainnya
  - expense: Makanan, Transportasi, Belanja, Tagihan, Listrik, Internet, Pulsa, Rumah Tangga, Anak, Kesehatan, Pendidikan, Hiburan, Rokok, Perjalanan, Lainnya
  - beri icon bootstrap-icons (mis. `bi-cup-hot`, `bi-car-front`) dan warna netral.
- `DatabaseSeeder`: buat user demo `demo@pidu.test` / `password` (name "Demo User") + user kedua `other@pidu.test` / `password` (untuk tes isolasi data, beri sedikit transaksi juga).
- `TransactionSeeder` untuk demo user: data realistis **4 bulan: Juni–September 2026** (hari ini 2026-09-28), deterministik (pakai `mt_srand(42)` / Faker seed 42):
  - Gaji Rp8.500.000 tiap tgl 25 (transfer), Bonus sesekali, Freelance 1–2x/bulan
  - Pengeluaran harian: Makanan (1–3x/hari, 15rb–120rb), Transportasi, Rokok, belanja mingguan, Tagihan/Listrik/Internet/Pulsa bulanan, Anak, Rumah Tangga, Hiburan, Kesehatan sesekali
  - Metode pembayaran bervariasi; nominal dibulatkan ke ribuan.
  - Tambahkan sedikit data tahun 2024 & 2025 (mis. 1 pemasukan + beberapa pengeluaran per bulan) supaya Rekap Tahunan punya 3 tahun.
  - Pakai insert batch (chunk) bukan create satu-satu.
- `BudgetSeeder`: budget September 2026 untuk Makanan, Transportasi, Belanja, Hiburan, Rokok — atur supaya ada yang <80%, ada yang 80–99%, ada yang ≥100% berdasarkan data seed.

### 4. Verifikasi (WAJIB jalankan & tempel output-nya di akhir)
```
php artisan migrate:fresh --seed
php artisan tinker --execute="echo App\Models\Transaction::count(), PHP_EOL, App\Models\Category::count(), PHP_EOL, App\Models\Budget::count();"
```
Lalu `npm start` di root → pastikan http://127.0.0.1:8001/up merespons 200 dan http://localhost:8010 menampilkan halaman Vite, dan http://localhost:8010/api/user (lewat proxy) merespons 401 JSON (bukan error proxy). Hentikan setelah dicek.
Plus query (via tinker/DB facade): total income & expense demo user per bulan Juni–Sep 2026 dan per tahun 2024/2025/2026.

### 5. Commit
`git add -A && git commit -m "Phase 1: scaffold, migrations, models, seeders"`

## Laporan akhir ke lead
Tulis `docs/lead/report-1.md`: daftar file dibuat, output verifikasi, dan hal yang menyimpang dari instruksi (kalau ada) beserta alasannya. Jangan lanjut ke Phase 2.

