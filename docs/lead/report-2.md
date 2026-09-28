# Report Phase 2 — Auth + REST API + Service + Validation + Tests

Tanggal: 2026-09-28 · Executor: **Claude** (Kimi CLI berhenti di tengah jalan karena kena batas 5 jam: `403 You've reached your 5-hour usage limit`; tidak ada file setengah jadi dari Kimi) · Scope: backend saja, `frontend/` tidak disentuh, export belum dikerjakan (Phase 8).

## Ringkasan
Semua endpoint di kontrak API (kecuali export) sudah jadi. **48 feature test lolos (282 assertion).** Hasil smoke test lewat proxy Vite cocok dengan report-1.

## Perbaikan dari review Phase 1
1. `DateSql::year()/month()` di SQLite → `CAST(strftime(...) AS INTEGER)`.
2. `App\Support\Money::of()` → semua angka uang di response = number, dibulatkan 2 desimal.

## Bug tambahan yang ditemukan & diperbaiki (di luar instruksi)
1. **`config/app.php` timezone masih `'UTC'` hardcode**: `APP_TIMEZONE` di `.env` tidak pernah dibaca, jadi "bulan berjalan" dan `now()` memakai UTC. Sekarang `env('APP_TIMEZONE', 'Asia/Jakarta')`.
2. **Cast `date` Eloquent menyimpan `Y-m-d 00:00:00` di SQLite.** Seeder memakai `insert()` sehingga datanya `Y-m-d`. Tapi transaksi yang dibuat lewat API akan tersimpan dengan jam, lalu `whereBetween(..., [start, '2026-09-30'])` melewatkan tanggal akhir (perbandingan string). Solusinya mutator `transactionDate` di model yang selalu menyimpan `Y-m-d`. Ada tes yang memastikan ini.
3. `scopeFilter/scopeBetween/scopeOfType` sekarang memakai kolom ter-qualify (`transactions.type`). Tanpa itu, query breakdown kategori yang di-join dengan `categories` akan kena error ambiguous column `type`.

## Deviasi kecil (keputusan executor)
- `GET /api/budgets` memakai `PeriodRequest` (month/year → periode; default bulan ini). Response-nya `{month, year, data:[...], totals}`.
- `month` tanpa `year` di PeriodRequest → dianggap tahun berjalan.
- Register juga di-throttle `5,1` (sama dengan login).
- Tambah `type_label` di CategoryResource dan `period` (null jika semua tanggal) di response `/api/transactions`.
- Error 500 generik juga berlaku untuk exception non-DB (lewat `respond()`), tidak hanya `QueryException`, selama `APP_DEBUG=false`. 404 untuk route tak dikenal = `"Endpoint tidak ditemukan."`.
- Validasi tambahan: `amount` maksimal 2 desimal (`decimal:0,2`).
- Pesan validasi Indonesia dipusatkan di `App\Http\Requests\ApiRequest` (base class semua FormRequest), bukan di file `lang/id`.

## File dibuat / diubah
**Diubah:** `config/app.php`, `.env.example` (APP_DEBUG=false), `bootstrap/app.php` (handler 404/500), `routes/api.php` (route `/api/user` dihapus), `app/Models/Transaction.php`, `app/Support/DateSql.php`

**Dibuat:**
- `app/Support/{Money,Period}.php`
- `app/Http/Requests/{ApiRequest,LoginRequest,RegisterRequest,PeriodRequest,TransactionIndexRequest,StoreTransactionRequest,UpdateTransactionRequest,StoreCategoryRequest,UpdateCategoryRequest,StoreBudgetRequest,UpdateBudgetRequest}.php`
- `app/Http/Resources/{UserResource,CategoryResource,TransactionResource,BudgetResource}.php`
- `app/Services/{TransactionService,DashboardService,ReportService,BudgetService}.php`
- `app/Http/Controllers/Api/{Auth,Transaction,Category,Dashboard,Report,Budget}Controller.php`
- `database/factories/{Category,Transaction,Budget}Factory.php`
- `tests/Feature/Api/{Auth,Isolation,Transaction,Category,Dashboard,Report,Budget,ErrorHandling}Test.php`

## Catatan desain
- Semua agregat memakai SUM/COUNT/GROUP BY di DB (`TransactionService::totals()` dan `groupedTotals()`). Deret tanggal/bulan diisi di PHP.
- Mingguan dihitung dari agregat harian lalu dikelompokkan per minggu ISO di PHP, sehingga aman lintas driver.
- Budget `used` diambil dari satu query `SUM ... GROUP BY category_id` per bulan (tanpa N+1).
- Isolasi: semua query dimulai dari relasi `$user->transactions()/categories()/budgets()`; update/delete memakai `findOrFail` pada relasi, jadi record user lain → 404.

## Output verifikasi

### `php artisan test`
```
PASS  Tests\Unit\ExampleTest
PASS  Tests\Feature\Api\AuthTest            (7)  login ok/gagal, 401 JSON, me, logout cabut token, register+22 kategori, throttle 429
PASS  Tests\Feature\Api\BudgetTest          (4)  status 79.99→ok / 80→warning / 100→exceeded, totals, CRUD, duplikat 422
PASS  Tests\Feature\Api\CategoryTest        (6)  filter+count, unique per type, type terkunci, toggle, delete 422 / cascade budget
PASS  Tests\Feature\Api\DashboardTest       (8)  fixture manual, default bulan ini, granularity month, kosong, tanpa income, 1 hari, filter income, budgets
PASS  Tests\Feature\Api\ErrorHandlingTest   (3)  QueryException & RuntimeException → 500 generik, 404 JSON
PASS  Tests\Feature\Api\IsolationTest       (5)  GET/PUT/DELETE milik user lain 404, kategori user lain 422
PASS  Tests\Feature\Api\ReportTest          (6)  daily=days, Σdaily=Σweekly=totals, minggu ISO Sep 2026 (1–6, …, 28–30), monthly 12, yearly isi tahun kosong, calendar, day
PASS  Tests\Feature\Api\TransactionTest     (7)  CRUD, validasi amount/format/type-kategori, kategori nonaktif, pagination/sort/search/filter/summary, rentang >5 thn 422
PASS  Tests\Feature\ExampleTest

Tests:    48 passed (282 assertions)
```

### `php artisan route:list --path=api` — 25 route
```
POST   api/auth/login | api/auth/register | api/auth/logout      GET api/auth/me
GET|POST api/transactions      GET|PUT|DELETE api/transactions/{id}
GET|POST api/categories        PUT|DELETE api/categories/{id}   PATCH api/categories/{id}/toggle
GET    api/dashboard
GET    api/reports/{daily,weekly,monthly,yearly,calendar}        GET api/reports/day/{date}
GET|POST api/budgets           PUT|DELETE api/budgets/{id}
```

### Smoke test (`npm start`, curl ke `http://localhost:8010/api/...` lewat proxy)
```
login demo@pidu.test → token OK
GET /api/dashboard →
  period:  2026-09-01 .. 2026-09-30 (30 hari)
  summary: income 11957000, expense 7456000, balance 4501000,
           avg_daily_expense 248533.33 (= 7.456.000/30), expense_ratio 62.36, transaction_count 124
  → cocok dengan report-1
GET /api/transactions/690 (milik other@pidu.test) → 404 {"message":"Data tidak ditemukan."}
POST /api/auth/logout → 200; GET /api/auth/me dengan token yang sama → 401
```
Server dihentikan setelah pengecekan.

## Catatan untuk Phase 3
- Login: `POST /api/auth/login` → simpan `token`; semua request memakai `Authorization: Bearer <token>`. Respons 401 → logout di FE.
- Error validasi: `errors.{field}[0]` sudah dalam Bahasa Indonesia.
- `/api/transactions` mengembalikan `data`, `links`, `meta` (paginator Laravel) + `summary` + `period`.
