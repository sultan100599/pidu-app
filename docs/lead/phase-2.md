# PHASE 2 — Auth + REST API + Service + Validation + Tests (backend saja)

Executor: Kimi. Baca `docs/lead/00-PLAN.md` (kontrak API) dan `docs/lead/report-1.md`. Working dir `C:\Pidu-App`. JANGAN sentuh `frontend/`. Jangan kerjakan export (Phase 8).

## Hasil review Phase 1 (dari lead)
Diterima. Deviasi Laravel 12 & `redirectGuestsTo` disetujui. Perbaiki sambil jalan:
1. `DateSql::year()` / `month()` di SQLite mengembalikan string (`'09'`). Ubah jadi `CAST(strftime('%Y', col) AS INTEGER)` / `CAST(strftime('%m', col) AS INTEGER)` supaya sama dengan MySQL (integer).
2. Semua angka uang di response API = **number** (bukan string "1500000.00"). Hasil SUM dibulatkan: `round((float) $x, 2)`. Buat helper `App\Support\Money::of($value): float`.

## A. Arsitektur
```
app/Http/Controllers/Api/{AuthController,TransactionController,CategoryController,DashboardController,ReportController,BudgetController}.php
app/Http/Requests/{LoginRequest,RegisterRequest,StoreTransactionRequest,UpdateTransactionRequest,TransactionIndexRequest,
                   StoreCategoryRequest,UpdateCategoryRequest,PeriodRequest,StoreBudgetRequest,UpdateBudgetRequest}.php
app/Http/Resources/{TransactionResource,CategoryResource,BudgetResource,UserResource}.php
app/Services/{TransactionService,DashboardService,ReportService,BudgetService}.php
app/Support/{Period.php,Money.php}
```
Controller tipis: validasi (FormRequest) → panggil Service → Resource/JSON. Semua query agregat di Service memakai SUM/COUNT/GROUP BY di DB — **dilarang** `->get()` seluruh transaksi lalu menjumlah di PHP.

## B. Isolasi data (WAJIB)
- Semua query dimulai dari `$request->user()->transactions()` / `->categories()` / `->budgets()`.
- Show/update/delete: `$request->user()->transactions()->findOrFail($id)` → record user lain = **404**.
- Validasi `category_id`: `Rule::exists('categories','id')->where('user_id', auth()->id())->where('type', <type input>)` → kategori user lain / jenis tidak cocok = **422**.

## C. Auth (Sanctum token)
- `POST /api/auth/login` {email,password} → `{token, user}`; salah → 422 `"Email atau password salah."`. `throttle:5,1`.
- `POST /api/auth/register` {name,email,password,password_confirmation} → buat user + `DefaultCategoryService::createFor($user)` → `{token,user}`.
- `POST /api/auth/logout` (hapus current token), `GET /api/auth/me`.
- Semua route lain di group `auth:sanctum`. Hapus route contoh `/api/user` bawaan install:api (ganti `/api/auth/me`).

## D. Periode (`App\Support\Period` + `PeriodRequest`)
Dipakai dashboard, reports daily/weekly, transactions index, (nanti) export. Resolusi prioritas:
1. `start_date` & `end_date` (Y-m-d, `end_date >= start_date`, max rentang 5 tahun)
2. `year` + `month` → bulan itu
3. `year` saja → 1 Jan–31 Des
4. default → **bulan berjalan** (1 s/d akhir bulan, timezone Asia/Jakarta)

`Period` punya `start`, `end` (CarbonImmutable), `days()` = selisih hari + 1 (min 1). Filter tambahan (opsional, divalidasi): `type` (income|expense), `category_id` (milik user), `payment_method` (enum).
Response semua endpoint periode menyertakan `"period": {"start_date","end_date","days"}`.

## E. Endpoint & bentuk response

### Transactions
- `GET /api/transactions` — filter periode (jika tak ada start/end/year → **semua tanggal**, bukan default bulan ini), `type, category_id, payment_method, search`, `sort` ∈ {transaction_date, amount, created_at} default transaction_date, `dir` asc|desc default desc (tie-break `id desc`), `per_page` 1–100 default 15. Eager load `category`. Response = paginator Laravel (`data`, `meta`, `links`) + `summary: {income, expense, balance, count}` untuk seluruh hasil filter (query agregat terpisah, bukan dari halaman ini).
- `POST` (201, message "Transaksi berhasil ditambahkan."), `GET /{id}`, `PUT /{id}` ("Transaksi berhasil diperbarui."), `DELETE /{id}` ("Transaksi berhasil dihapus.").
- Validasi: `transaction_date` required|date_format:Y-m-d; `type` required|enum; `category_id` required|exists (lihat B, + kategori harus `is_active` saat create; saat update boleh inactive **hanya jika** category_id tidak berubah); `amount` required|numeric|gt:0|max:999999999999; `payment_method` nullable→default cash|enum; `description` nullable|max:255; `notes` nullable|max:5000. Pesan validasi Bahasa Indonesia (`attributes()` + `messages()`), mis. "Nominal harus lebih dari 0.".
- `TransactionResource`: id, transaction_date (Y-m-d), type, type_label (Pemasukan/Pengeluaran), category {id,name,icon,color,type}, amount (number), payment_method, payment_method_label, description, notes, created_at, updated_at.

### Categories
- `GET /api/categories?type=&active=` — urut type, name; sertakan `transactions_count` (withCount).
- `POST`, `PUT /{id}`: name required|max:100|unique per (user_id,type) ignore self; type required|enum (type **tidak boleh diubah** jika kategori sudah punya transaksi → 422); icon, color nullable.
- `PATCH /{id}/toggle` → balik is_active.
- `DELETE /{id}`: jika punya transaksi → 422 `"Kategori masih dipakai N transaksi. Nonaktifkan saja."`; budget ikut terhapus (cascade).

### Dashboard — `GET /api/dashboard` (PeriodRequest + filter)
```json
{
 "period": {"start_date":"2026-09-01","end_date":"2026-09-30","days":30},
 "summary": {"income":0,"expense":0,"balance":0,"avg_daily_expense":0,
             "expense_ratio":null,"transaction_count":0},
 "chart": {"granularity":"day|month","labels":["2026-09-01",...],
           "income":[...],"expense":[...]},
 "category_breakdown":[{"category_id":1,"name":"Makanan","icon":"...","color":"...","total":0,"percentage":0}],
 "top_categories":[ ...5 teratas dari breakdown... ],
 "largest_transactions":[ ...5 TransactionResource expense terbesar... ],
 "budgets":[ ...BudgetService untuk bulan dari end_date... ]
}
```
- `avg_daily_expense = expense / period.days`. `expense_ratio = income > 0 ? expense/income*100 : null`. `percentage = expense>0 ? total/expense*100 : 0`. Semua dibulatkan 2 desimal. Tidak boleh ada division by zero.
- `chart.granularity`: `day` jika period.days ≤ 62, selain itu `month`. **Semua** label dalam rentang diisi (hari/bulan tanpa transaksi = 0), dibuat dari 1 query GROUP BY lalu di-merge ke deret tanggal di PHP.
- `category_breakdown` = expense saja, urut total desc. Filter `type=income` → summary expense 0 dan breakdown kosong (wajar, jangan error).

### Reports (`ReportService`)
- `GET /api/reports/daily` (periode + filter) → `{period, totals:{income,expense,balance}, rows:[{date,income,expense,balance,count}]}` — **semua hari** dalam rentang (0 jika kosong), urut asc.
- `GET /api/reports/weekly` (periode + filter) → minggu ISO (Senin–Minggu), dipotong ke rentang periode. `rows:[{week:1,label:"Minggu 1",start_date,end_date,income,expense,balance,count}]`. Hitung dengan agregasi harian dari DB lalu dikelompokkan di PHP (agar lintas-driver).
- `GET /api/reports/monthly?year=2026` (default tahun ini) → 12 baris `{month:1,label:"Januari",income,expense,balance,count}` + totals.
- `GET /api/reports/yearly` → setiap tahun dari tahun transaksi pertama s/d tahun ini (tahun kosong = 0): `{year,income,expense,balance,count}` + totals. User tanpa transaksi → rows = [tahun ini dengan 0].
- `GET /api/reports/calendar?year=&month=` (default bulan ini) → `{year,month,days:[{date,income,expense,count}]}` semua tanggal di bulan itu.
- `GET /api/reports/day/{date}` → daftar TransactionResource pada tanggal itu + totals (dipakai klik tanggal di Rekap Harian & Kalender).
- Nama bulan Indonesia: Januari…Desember (hardcode array, jangan butuh ext-intl).

### Budgets (`BudgetService`)
- `GET /api/budgets?month=&year=` (default bulan ini) → tiap budget: `{id, category{..}, month, year, amount, used, remaining, percentage, status}`; `used` dari **satu** query SUM GROUP BY category_id untuk bulan itu (bukan N+1). `percentage = amount>0 ? used/amount*100 : 0`; `status`: `exceeded` jika ≥100, `warning` jika ≥80, selain itu `ok`. `remaining` boleh negatif. Sertakan `totals {amount, used, remaining}`.
- `POST`: category_id (milik user, type expense), month 1–12, year 2000–2100, amount numeric|gt:0; duplikat (category+month+year) → 422 "Budget kategori ini untuk bulan tersebut sudah ada.". `PUT /{id}` (amount saja + optional month/year dengan cek duplikat), `DELETE /{id}`.

## F. Error handling
- `APP_DEBUG=false` → error 500 API = `{"message":"Terjadi kesalahan pada server."}` tanpa trace; exception tetap di-log (default Laravel log). Tambahkan di `withExceptions` handler untuk `QueryException` → log + JSON generik 500. 404 model → `{"message":"Data tidak ditemukan."}`.
- `.env` dev boleh `APP_DEBUG=true`; `.env.example` → `APP_DEBUG=false`.

## G. Feature tests (PHPUnit, `tests/Feature/Api/*`) — WAJIB
Pakai `RefreshDatabase` + sqlite in-memory (cek phpunit.xml). Buat factory untuk Category/Transaction/Budget. Minimal:
1. Auth: login sukses/gagal, route tanpa token → 401 JSON, logout mencabut token.
2. **Isolasi**: user A GET/PUT/DELETE transaksi user B → 404; POST dengan category_id milik B → 422; categories/budgets sama.
3. Validasi: amount 0 / negatif / kosong → 422; category jenis expense dipakai untuk type income → 422.
4. CRUD transaksi + pagination + search + filter + summary.
5. Dashboard dengan data fixture yang dihitung manual (mis. income 1.000.000, expense 250.000+150.000 dalam 3 hari) → cek income, expense, balance, avg_daily_expense, percentage kategori, panjang chart labels = days.
6. Edge: tanpa transaksi (semua 0, expense_ratio null, no error), tanpa income, periode 1 hari.
7. Reports: jumlah `rows` daily = days; Σ daily = Σ weekly = totals; monthly 12 baris; yearly mengisi tahun kosong; minggu ISO di awal/akhir bulan dipotong benar (contoh September 2026: 1 Sep = Selasa).
8. Budget: status ok/warning/exceeded pada batas 79.99 / 80 / 100; duplikat → 422.
9. Kategori dipakai → delete 422; toggle.

## H. Verifikasi (tempel output ke report)
```
php artisan test
php artisan route:list --path=api
```
Lalu `npm start` dan smoke test dengan curl ke `http://localhost:8010/api/...` (lewat proxy): login demo@pidu.test → token → `/api/dashboard` (default bulan ini) → tempel `summary`. Cocokkan dengan report-1 (Sep 2026: income 11.957.000, expense 7.456.000; avg = 7.456.000/30). Coba akses `/api/transactions/{id milik other user}` pakai token demo → harus 404. Hentikan server.

## I. Selesai
- `git commit -m "Phase 2: auth, REST API, services, validation, tests"`
- Tulis `docs/lead/report-2.md` (file dibuat/diubah, output test, output smoke test, deviasi + alasan). Jangan lanjut Phase 3.
