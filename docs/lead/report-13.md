# Report Phase 13: Piduiteun dan bahasa IN / EN / SU

Tanggal: 29 September 2026. Executor: Codex. Baseline: `3592949`. Reviewer berikutnya: Claude (Chrome).

Implementasi selesai. **89 tes backend (851 assertions), lint, build, cek 487 kunci locale, dan 9 pemeriksaan logika frontend lulus.** Pemeriksaan kontras token: **132/132 PASS**. **Belum dicek di browser. R-35: PENDING, click-through oleh Claude.** Lighthouse accessibility 100 merupakan target review, belum diukur ulang.

Tidak commit atau reset working tree. Tidak menjalankan, menggunakan, atau mematikan server pada port 8001/8010. Tidak menghapus token pengguna. SQLite tetap digunakan; tes backend memakai SQLite `:memory:` sesuai `backend/phpunit.xml`. Tidak ada perubahan route, URL, nama field API, dependensi npm/Composer, atau data seeder.

## 1. Keputusan dan tagline

Brief: [phase-13.md](phase-13.md). Instruksi pengguna terbaru mengganti bagian B: pemilih bahasa kini **satu tombol bergilir IN → EN → SU → IN** pada Topbar dan Login/Register. Implementasi tiga tombol/dropdown bahasa beserta CSS terkait sudah dihapus. Dropdown menu pengguna tetap merupakan fitur navigasi sebelumnya.

Dibaca: `AGENTS.md`, `CATATAN.md`, `DESIGN.md`, report-11, report-12, serta skill antislop core, UI, human, layoutmobile, copywriting, dan code. Mode selama pengerjaan mengikuti keputusan pengguna. Design Read mengikuti aplikasi keuangan pribadi dengan warna hangat, ikon dompet, ubin timbul, **ENERGY 2 / RHYTHM 2 / MOTION 2**.

- `frontend/src/components/layout/Sidebar.jsx`: brand memakai ikon dompet lama, tulisan Pidu, lalu **Piduiteun**. Sidebar yang sama dipakai menu geser HP. Tagline selalu tetap, dengan `lang="su"`.
- `frontend/src/styles/locale.css`: tagline miring 0.8rem, token `--pidu-muted`, tersusun vertikal dengan `min-width: 0`. Ukuran tulisan Pidu lama dipertahankan.
- Kontras tagline terhadap surface: terang **6.20:1**, gelap **8.03:1**. Layout aktual panel 280px masih perlu click-through.
- `frontend/src/components/LanguagePicker.jsx`: satu native button, minimum 44 × 44px, kode aktif, `onClick` berputar ke bahasa berikutnya, `aria-label` dinamis dan `title` identik. Tidak memakai `role="group"`, `aria-pressed`, atau dropdown bahasa.
- Kontrol memakai teks ink, permukaan surface, border control-line dan shadow-1 agar sejalan dengan ubin Pidu. Topbar menggunakan jarak 8px; kontrol tidak menyusut dan judul boleh truncate. Login/Register menempatkannya di sebelah tombol tema.

Motif, palet, fokus, reduced motion, shortcut N, form transaksi global, undo, heatmap kalender, bottom navigation, dan logika periode pembanding Phase 11/12 dipertahankan. Tombol Catat transaksi duplikat di Topbar yang sudah dihapus pada baseline tidak ditambahkan kembali.

## 2. Arsitektur i18n

### Frontend

Tidak menambah library i18n. Tiga bahasa dan interpolasi sederhana cukup ditangani context dan kamus; alasan ini menghindari tambahan dependency, sambil tetap menyediakan pembaruan React saat bahasa berubah.

| Bagian | Lokasi dan perilaku |
|---|---|
| Inisialisasi | `src/i18n/locale.js` membaca `pidu_locale` dengan try/catch pada evaluasi modul, sebelum render React. Nilai selain id/en/su kembali ke id. `document.documentElement.lang` langsung ditetapkan. |
| State bahasa | `src/i18n/LocaleProvider.jsx` memakai `useSyncExternalStore`. `setLocale` mengubah lang, menyimpan preferensi dengan try/catch, lalu memberi tahu subscriber. Storage diblokir tetap memungkinkan pergantian selama sesi. |
| Kamus | `src/i18n/messages.js` menggabungkan `areas.js`, `files.js`, `icons.js`, dan `server.json`. Frasa Indonesia menjadi kunci stabil; id/en/su memiliki 487 kunci yang sama. |
| Pemanggilan | `useT()` / `t(key, params)`, interpolasi `{name}`, `{count}`, dan parameter lain. Bentuk hitungan memakai kalimat netral bila sesuai. String tidak dikenal kembali ke input; string nonteks diteruskan. |
| String prop | `PageHeader` menerjemahkan title/subtitle serta memperbarui `document.title`; `Modal` menerjemahkan title; `ReportTable` menerjemahkan labelHeader. Pemanggil menerjemahkan konten dinamis dan label aksesibilitas. |
| Pesan yang sudah tampil | `src/i18n/toast.jsx` membuat isi toast berlangganan context. Kamus server mendukung pemetaan balik pesan EN/SU/ID, termasuk interpolasi, sehingga error dan ringkasan impor yang sudah tampil dapat berubah bahasa tanpa mengulang mutasi. |
| API | Interceptor `src/api/client.js` menyetel `Accept-Language: id\|en\|su` setiap request memakai locale saat itu. |
| Refetch | `hooks/useFetch.js` serta request key halaman Transaksi mencakup locale. API mengambil ulang label tanpa reload halaman; filter dan state form tetap. Respons request lama diabaikan/dibatalkan. |
| Tanggal | `src/utils/format.js`: English memakai **en-GB**; Indonesia id-ID; Sunda memakai tabel bulan/hari sendiri. `MONTH_NAMES` mengikuti locale aktif untuk indexing maupun select. |
| Rupiah | `Intl.NumberFormat('id-ID')` tetap untuk Rupiah dan nominal ringkas di seluruh bahasa. |
| Metadata dan aksesibilitas | Judul tab, meta description, label kontrol, placeholder, teks skeleton, toast, tooltip/legenda grafik, dan indikator memperbarui data mengikuti locale. |

Snapshot `frontend/src/i18n/server.json` dihasilkan dari PHP melalui:

```text
php backend/scripts/frontend-locales.php
node frontend/scripts/check-locales.mjs
```

Generator hanya menulis data kamus server. Pemeriksa locale memverifikasi kesamaan kunci, string tidak kosong, kesamaan parameter interpolasi, larangan em dash, referensi literal yang dipindai dari source, dan snapshot yang sesuai katalog PHP. Pemindaian source membantu audit, tetapi tidak menggantikan review browser untuk seluruh cabang UI.

Kamus dimuat secara statis dalam chunk `locales` agar bahasa awal tersedia sebelum render. Pembagian chunk dalam `frontend/vite.config.js` membuat ukuran main di bawah batas warning Vite; seluruh kamus tetap bagian dari unduhan awal. Tidak ada klaim bahwa pemisahan chunk mengurangi total ukuran JS.

### Backend

- `app/Http/Middleware/SetLocaleFromRequest.php` dipasang di `bootstrap/app.php`. Middleware berjalan global tetapi hanya mengatur request `api/*`, sehingga endpoint API yang tidak dikenal juga mendapat pesan 404 sesuai bahasa.
- Header persis `id`, `en`, atau `su` diteruskan ke `app()->setLocale()`. Header kosong, tidak dikenal, atau bentuk lain kembali ke id pada setiap request; tidak mewarisi locale request sebelumnya. Default konfigurasi APP_LOCALE dan fallback pada `config/app.php` serta `.env.example` adalah id. Konfigurasi `.env` pengguna tidak diubah; katalog mencakup seluruh kunci aplikasi sehingga tidak bergantung pada fallback Inggris yang mungkin masih dikonfigurasi sebelumnya.
- Katalog di `backend/lang/{id,en,su}/messages.php`, `validation.php`, dan `pagination.php`. Semua rule yang dipakai aplikasi, atribut field, pesan custom, serta pagination memiliki terjemahan ketiga bahasa.
- `ApiRequest` dan turunannya mengambil pesan/atribut dari katalog. `ImportRequest::attributes()` telah diperbaiki menjadi `['file' => __('validation.attributes.file')]`, digabung atribut induk.
- Controller/service menggunakan `__()`: autentikasi, CRUD, kategori terpakai, duplikat budget, impor per baris/ringkasan, batas PDF, serta backup API. Error HTTP 401/403/429, 404 dan 500 production memakai bahasa request. Detail debug server tetap mengikuti mode debug Laravel.
- `TransactionType::label()` dan `PaymentMethod::label()` mengikuti locale untuk response API. `ReportService` mengambil nama bulan serta label minggu dari katalog.
- `app/Support/Locale.php` menyediakan scope locale dengan try/finally. Penyusunan laporan export dijalankan pada id; enum pada Excel/PDF memakai `label('id')`. Tanggal PDF dipaksa id. `Period::MONTHS` tetap Indonesia untuk export.
- Impor menerima label jenis/metode ketiga bahasa, termasuk berkas export/backup Indonesia. Nama kategori tetap disimpan sebagai data pengguna.

## 3. Cakupan terjemahan

Diterjemahkan: Login/Register, Topbar, sidebar/bottom navigation, menu pengguna/tema, dashboard dan sapaan, kartu ringkasan dan pembanding, grafik, seluruh daftar/filter/form/modal transaksi, kategori beserta pemilih warna/ikon, budget dan salin bulan, laporan harian/mingguan/bulanan/tahunan, kalender/detail hari, impor/pratinjau/error baris, export/backup UI, toast/undo, pagination, loading/empty/error states, validasi browser buatan aplikasi dan server, serta label API.

Sengaja tetap:

| Konten | Keputusan |
|---|---|
| Pidu / Piduiteun | Identitas produk; tagline selalu Sunda dengan lang=su. |
| Data pengguna | Nama akun/kategori, deskripsi, catatan, dan nama berkas diteruskan sebagai data; tidak dimasukkan ke penerjemah sebagai label UI. Kategori default seeder juga tetap. |
| Excel/PDF | Judul, kolom, sheet, label enum, nama bulan/minggu, dan format export tetap Indonesia sesuai keputusan pemilik. Template impor dan isi backup Excel mengikuti aturan ini. |
| Nilai kontrak API | Nama field, route dan nilai seperti income/expense/cash tetap, yang diterjemahkan adalah label/pesan. |
| Mata uang | Rupiah memakai penulisan Indonesia, termasuk ketika EN/SU aktif. |
| Output teknis lokal | Diagnostik CLI/log developer bukan respons UI/API; perintah backup CLI tetap menggunakan pesan Indonesia bawaan. |

## 4. Contoh bahasa untuk ditinjau pemilik

Frasa berikut berasal dari kamus. Baris validasi dengan atribut adalah contoh hasil server; `{number}` merupakan interpolasi frontend, padanannya `:number` di Laravel.

| Area | IN | EN | SU |
|---|---|---|---|
| Tagline | Piduiteun | Piduiteun | Piduiteun |
| Sapaan pagi | Selamat pagi | Good morning | Wilujeng énjing |
| Sapaan siang | Selamat siang | Good afternoon | Wilujeng siang |
| Sapaan sore | Selamat sore | Good afternoon | Wilujeng sonten |
| Sapaan malam | Selamat malam | Good evening | Wilujeng wengi |
| Modal budget baru | Tambah Budget | Add budget | Tambihan anggaran |
| Modal edit budget | Edit Budget | Edit budget | Robih anggaran |
| Modal kategori baru | Tambah Kategori | Add category | Tambihan kategori |
| Modal edit kategori | Edit Kategori | Edit category | Robih kategori |
| Nominal positif | Nominal harus lebih dari 0. | The amount must be greater than 0. | Nominal kedah langkung ti 0. |
| Tanggal wajib | Tanggal wajib diisi. | The date field is required. | Ping kaping kedah dieusian. |
| Berkas wajib | File wajib diisi. | The file field is required. | Berkas kedah dieusian. |
| Password di frontend | Password minimal 8 karakter. | Password must be at least 8 characters. | Kecap akses sahenteuna 8 karakter. |
| Transaksi baru | Transaksi berhasil ditambahkan. | Transaction saved. | Transaksi parantos disimpen. |
| Login gagal | Email atau password salah. | Incorrect email or password. | Email atanapi kecap akses lepat. |
| Data 404 | Data tidak ditemukan. | Data not found. | Data teu kapendak. |
| Server 500 | Terjadi kesalahan pada server. | A server error occurred. | Aya kalepatan dina server. |
| Label API pemasukan | Pemasukan | Income | Panghasilan |
| Label API pengeluaran | Pengeluaran | Expense | Pangeluaran |
| Minggu laporan | Minggu {number} | Week {number} | Minggu ka-{number} |
| Bulan laporan | Februari | February | Pébruari |
| Backup API | Backup berhasil dibuat. | Backup created. | Cadangan parantos didamel. |

Label UI jamak seperti Pengeluaran dapat memakai “Expenses”, sementara enum tunggal API memakai “Expense”. Tombol bahasa memakai pola “Bahasa: {current}. Ganti ke {next}” / “Language: {current}. Switch to {next}” / “Basa: {current}. Gentos kana {next}”; nama bahasa juga mengikuti locale aktif.

Sunda menggunakan tingkat sopan. Penutur asli perlu meninjau konsistensi “ping kaping”, “sasih”/nama bulan, “kecap akses”, “panghasilan/pangeluaran”, “diropéa/robih”, serta pilihan kata impor/backup agar alami untuk aplikasi keuangan. Belum ada review penutur asli.

## 5. Verifikasi dan ukuran bundle

### Backend

Perintah: `cd backend && php artisan test`. Semua 76 tes lama tetap ada; 13 kasus locale ditambahkan. Seluruh ekspektasi Bahasa Indonesia lama dipertahankan. Satu ekspektasi lama berbahasa Inggris pada AuthTest diubah dari `Unauthenticated.` menjadi `Silakan login terlebih dahulu.` agar 401 tanpa header juga memenuhi default Indonesia.

LocaleTest mencakup EN/SU untuk validasi dan nama atribut, pesan transaksi, login gagal, enum, laporan bulan/minggu/kalender, 404 data/endpoint, header fallback, budget duplikat, error/hasil impor, missing file, 401/429/500, kesamaan kunci PHP, pemulihan scope locale ketika exception, serta konten XLSX dan PDF Indonesia saat request EN/SU.

Output suite akhir:

```text
PASS  Tests\Unit\ExampleTest
  ✓ that true is true                                                                                            0.01s

   PASS  Tests\Feature\Api\AuthTest
  ✓ login success returns token and user                                                                         0.43s
  ✓ login wrong password returns 422                                                                             0.02s
  ✓ protected route without token returns 401 json                                                               0.02s
  ✓ me returns current user                                                                                      0.02s
  ✓ logout revokes token                                                                                         0.02s
  ✓ token expires after configured lifetime                                                                      0.02s
  ✓ register creates user with default categories                                                                0.04s
  ✓ login is throttled                                                                                           0.04s

   PASS  Tests\Feature\Api\BackupTest
  ✓ command creates database snapshot and user workbooks                                                         0.18s
  ✓ command for single user skips database snapshot                                                              0.06s
  ✓ retention keeps latest files                                                                                 0.13s
  ✓ backup file can be reimported as duplicates                                                                  0.08s
  ✓ api list create and download                                                                                 0.06s
  ✓ cannot access other users backups or arbitrary files                                                         0.07s
  ✓ backup is scheduled daily                                                                                    0.06s
  ✓ guest gets 401                                                                                               0.04s

   PASS  Tests\Feature\Api\BudgetTest
  ✓ status thresholds                                                                                            0.05s
  ✓ index totals and default month                                                                               0.02s
  ✓ create update delete and duplicate                                                                           0.03s
  ✓ budget requires expense category and positive amount                                                         0.02s

   PASS  Tests\Feature\Api\CategoryTest
  ✓ index filters and counts                                                                                     0.02s
  ✓ create and unique per type                                                                                   0.02s
  ✓ update and type locked when used                                                                             0.02s
  ✓ toggle                                                                                                       0.02s
  ✓ delete used category is rejected                                                                             0.02s
  ✓ delete unused category cascades budget                                                                       0.02s

   PASS  Tests\Feature\Api\DashboardTest
  ✓ dashboard numbers match manual calculation                                                                   0.03s
  ✓ default period is current month                                                                              0.03s
  ✓ long period uses monthly granularity                                                                         0.03s
  ✓ empty user has zeros and null ratio                                                                          0.02s
  ✓ without income ratio is null                                                                                 0.03s
  ✓ single day period                                                                                            0.03s
  ✓ income filter yields empty breakdown                                                                         0.03s
  ✓ includes budgets for end date month                                                                          0.03s

   PASS  Tests\Feature\Api\ErrorHandlingTest
  ✓ query exception returns generic 500                                                                          0.04s
  ✓ other exception does not leak details                                                                        0.02s
  ✓ unknown endpoint returns json 404                                                                            0.02s

   PASS  Tests\Feature\Api\ExportTest
  ✓ excel follows filters and contains totals                                                                    0.05s
  ✓ excel download filename                                                                                      0.02s
  ✓ formula like text is stored as plain text                                                                    0.05s
  ✓ pdf is generated with filters                                                                                0.26s
  ✓ pdf rejects too many rows                                                                                    0.11s
  ✓ export all has seven sheets with report numbers                                                              0.27s
  ✓ export all filename and default year                                                                         0.06s
  ✓ requires auth and valid filters                                                                              0.03s
  ✓ guest gets 401                                                                                               0.04s

   PASS  Tests\Feature\Api\ImportTest
  ✓ dry run reports valid invalid and new categories without writing                                             0.07s
  ✓ commit is rejected while rows are invalid                                                                    0.05s
  ✓ commit imports rows and creates categories                                                                   0.06s
  ✓ reimporting an export skips duplicates                                                                       0.13s
  ✓ csv with semicolon is supported                                                                              0.04s
  ✓ categories of other users are never matched                                                                  0.06s
  ✓ file validation                                                                                              0.09s
  ✓ template download                                                                                            0.08s
  ✓ guest gets 401                                                                                               0.05s

   PASS  Tests\Feature\Api\IsolationTest
  ✓ cannot access other users transaction                                                                        0.04s
  ✓ cannot use other users category                                                                              0.04s
  ✓ index only lists own transactions                                                                            0.04s
  ✓ cannot modify other users category                                                                           0.03s
  ✓ cannot modify other users budget                                                                             0.03s

   PASS  Tests\Feature\Api\LocaleTest
  ✓ api messages labels validation and reports with data set " english"                                          0.07s
  ✓ api messages labels validation and reports with data set " sunda"                                            0.07s
  ✓ unknown or empty locale resets to indonesian with data set #0                                                0.03s
  ✓ unknown or empty locale resets to indonesian with data set #1                                                0.04s
  ✓ unknown or empty locale resets to indonesian with data set #2                                                0.04s
  ✓ unknown or empty locale resets to indonesian with data set #3                                                0.04s
  ✓ custom validation import errors and summary with data set #0                                                 0.07s
  ✓ custom validation import errors and summary with data set #1                                                 0.08s
  ✓ unauthenticated throttle and production error are localized with data set #0                                 0.04s
  ✓ unauthenticated throttle and production error are localized with data set #1                                 0.03s
  ✓ excel and pdf content stay indonesian with data set #0                                                       0.64s
  ✓ excel and pdf content stay indonesian with data set #1                                                       0.69s
  ✓ catalogs have matching keys and locale scope restores after failure                                          0.03s

   PASS  Tests\Feature\Api\ReportTest
  ✓ daily has every day and totals                                                                               0.06s
  ✓ weekly iso weeks are clipped to period                                                                       0.06s
  ✓ monthly has 12 rows                                                                                          0.06s
  ✓ yearly fills empty years                                                                                     0.08s
  ✓ yearly without transactions returns current year                                                             0.05s
  ✓ calendar and day detail                                                                                      0.07s

   PASS  Tests\Feature\Api\TransactionTest
  ✓ create transaction                                                                                           0.05s
  ✓ show update delete                                                                                           0.05s
  ✓ amount validation                                                                                            0.06s
  ✓ size rule messages are indonesian                                                                            0.04s
  ✓ category type must match transaction type                                                                    0.04s
  ✓ required fields and formats                                                                                  0.04s
  ✓ inactive category rules                                                                                      0.06s
  ✓ index pagination filter search and summary                                                                   0.11s

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response                                                                0.05s

  Tests:    89 passed (851 assertions)
  Duration: 6.58s
```

### Frontend

Perintah: `npm --prefix frontend run lint` dan `node frontend/scripts/verify-phase13.mjs`. Output:

```text
> frontend@0.0.0 lint
> oxlint

PASS saved locale and html lang are applied during module initialization
PASS locale cycle persists, notifies subscribers and updates language
PASS date and month select labels change while Rupiah remains Indonesian
PASS greetings and previous calendar month retain Phase 12 behaviour
PASS existing client validation and server feedback retranslate
PASS combined import summaries translate every sentence
PASS interpolated user text remains unchanged
PASS API interceptor always uses the current language
PASS blocked storage still allows switching and invalid storage falls back to id
9/9 checks passed.
```

Skrip verifikasi memakai document/localStorage tiruan dan axios adapter lokal. Tidak membuka browser, menghubungi API berjalan, atau menyentuh storage/token pengguna. Pemeriksa ini memverifikasi tanggal, sapaan, periode pembanding, pesan yang sudah tampil, interpolasi data pengguna, header request, serta fallback storage.

Perintah: `npm --prefix frontend run build`, dilanjutkan `node frontend/scripts/check-locales.mjs`. Output:

```text
> frontend@0.0.0 build
> vite build

vite v8.3.1 building client environment for production...
transforming...
✓ 182 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                         1.22 kB │ gzip:   0.65 kB
dist/assets/fraunces-latin-700-normal-CEOla-zY.woff2   18.21 kB
dist/assets/bootstrap-icons-mSm7cUeB.woff2            134.04 kB
dist/assets/bootstrap-icons-BeopsB42.woff             180.28 kB
dist/assets/index-BpS2yK4D.css                        360.34 kB │ gzip:  55.09 kB
dist/assets/reports-C1m7_FHk.js                         0.54 kB │ gzip:   0.20 kB
dist/assets/YearlyReportPage-Bex-QfFS.js                0.91 kB │ gzip:   0.56 kB
dist/assets/MonthlyReportPage-85VNW7Xs.js               1.45 kB │ gzip:   0.84 kB
dist/assets/WeeklyReportPage-Q-4khIOl.js                1.47 kB │ gzip:   0.78 kB
dist/assets/DailyReportPage-D48fmMVf.js                 1.73 kB │ gzip:   0.94 kB
dist/assets/PeriodPicker-LwXpIIEm.js                    1.92 kB │ gzip:   0.83 kB
dist/assets/DayDetailModal-Dt-FFTqh.js                  2.78 kB │ gzip:   1.02 kB
dist/assets/ReportTable-Bi7bNYMx.js                     2.97 kB │ gzip:   1.10 kB
dist/assets/CalendarPage-BlMWvn_Z.js                    3.85 kB │ gzip:   1.60 kB
dist/assets/DashboardPage-BFknx_Ou.js                   9.78 kB │ gzip:   3.23 kB
dist/assets/locales-BpHFwp8v.js                        40.00 kB │ gzip:  12.18 kB
dist/assets/IncomeExpenseChart-CzHkFyAe.js            187.97 kB │ gzip:  65.52 kB
dist/assets/index-Oja1Hlqf.js                         462.95 kB │ gzip: 141.32 kB

✓ built in 546ms
Server locale snapshot matches all three PHP catalogs.
PASS: 487 keys in id/en/su; values, interpolation, source references and server snapshot checked.
```

Build Vite dan pemeriksaan snapshot PHP memerlukan retry dengan izin subprocess karena sandbox Windows sempat mengembalikan EPERM. Verifikasi akhir selesai dengan exit code 0 tanpa warning build. Tidak ada server yang dijalankan.

Pemeriksaan tambahan: `git -c core.safecrlf=false diff --check` bersih; `python frontend/scripts/check-contrast.py` menghasilkan `132/132 pasangan PASS`. Pencarian em dash pada source frontend, backend/app, backend/lang, dan view export tidak menemukan hasil.

### Ukuran production sebelum → sesudah

Baseline diukur dari build awal commit `3592949`; sesudah dari build akhir di atas. Angka byte dijumlah dari `dist/assets`, tidak termasuk index.html. kB/gzip mengikuti output Vite.

| Aset | Sebelum | Sesudah | Perubahan |
|---|---:|---:|---:|
| Total JS | 672.118 byte | 718.371 byte | +46.253 byte |
| Total CSS | 359.600 byte | 360.348 byte | +748 byte |
| WOFF2 | 152.256 byte | 152.256 byte | 0 |
| WOFF | 180.288 byte | 180.288 byte | 0 |
| Seluruh assets | 1.364.262 byte | 1.411.263 byte | +47.001 byte |
| Main JS | 457,37 kB / gzip 139,09 kB | 462,95 kB / gzip 141,32 kB | +5,58 kB / +2,23 kB gzip |
| Kamus locale terpisah | Tidak ada | 40,00 kB / gzip 12,18 kB | Chunk baru |
| CSS | 359,60 kB / gzip 54,94 kB | 360,34 kB / gzip 55,09 kB | +0,74 kB / +0,15 kB gzip |

Tidak menambah library. Kenaikan terutama berasal dari tiga kamus dan dukungan pembaruan pesan/tanggal. Grafik tetap lazy-loaded; kamus locale tersedia di awal untuk menghindari pergantian bahasa setelah render.

## 6. Delivery Gate antislop

Bukti PASS di bawah dibatasi pada source dan pemeriksaan otomatis yang benar-benar dilakukan. Gate visual/interaksi masih **PENDING** sampai Claude menjalankan Chrome; belum menyatakan seluruh Delivery Gate lolos.

### Block 1: Hard Gate

| Aturan | Status dan bukti |
|---|---|
| R-02 | PASS: pencarian em dash pada source aplikasi bersih; checker juga memeriksa seluruh nilai kamus. |
| R-03 | PENDING: source menyediakan kontrol 44px, judul truncate dan brand bertumpuk; overflow 360px dan panel 280px belum diukur di browser. |
| R-17 | PASS: tidak menambah statistik produk; angka dalam report berasal dari output pemeriksaan. |
| R-18 | PASS: tidak menambah testimoni atau profil fiktif. |
| R-23 | PASS: memakai ikon dompet/brand yang sudah ada, tagline diminta pemilik; tidak membuat aset visual baru. |
| R-24 | PASS source: route/nav yang ada dipertahankan, tidak ada tujuan link baru. |
| R-25 | PASS otomatis: 132 pasangan kontras lolos, tagline 6.20:1 / 8.03:1. |
| R-26 | PASS source: tombol locale memiliki onClick; pergantian store/persistensi diuji; tindakan lama tetap terhubung. Interaksi nyata tercakup R-35. |
| R-27 | PASS source: EmptyState, ErrorState, PageSkeleton dan spinner diterjemahkan; retry tetap memakai handler yang ada. |
| R-28 | PASS: tidak menambah FAQ. |
| R-32 | PENDING browser: native button bisa memakai Enter/Space, aturan focus-visible lama tetap; urutan Tab dan fokus aktual perlu review. |
| R-33 | PASS: JSX/CSS ditulis langsung; generator hanya menghasilkan data kamus JSON dari katalog PHP. |
| R-34 | PENDING browser: token dua tema lolos cek kontras; visual/responsif dua tema belum diukur ulang. |
| R-35 | **PENDING, click-through oleh Claude.** Build dan seluruh tes wajib lulus; belum dicek di browser. |
| R-36 | PASS: tidak menambah klaim keamanan/performa/pengguna tanpa bukti. |
| R-37 | PASS: DESIGN.md dan dials 2/2/2 digunakan; warna/ikon/layout mengikuti Phase 11/12. |
| R-38 | PASS: data pengguna tetap data asli; tidak menambah konten realistis buatan. |

### Block 2: Purpose-Gate

| Aturan | Status dan alasan |
|---|---|
| R-01 | PASS: tidak menambah glow/gradient dekoratif; surface tombol menandai kontrol. |
| R-04 | PASS: memakai ikon dompet dan Bootstrap Icons lama sesuai fungsi; tidak menambah ikon generik. |
| R-06 | PASS: font brand dan isi mengikuti desain yang sudah disetujui; tidak menambah font dekoratif. |
| R-07 | PASS: tidak menambah grid, blueprint, atau pola latar dekoratif. |
| R-08 | PASS: tidak menambah panah dekoratif pada tombol. |
| R-09 | PASS: tagline bukan pengulangan judul atau badge pemasaran. |
| R-10 | PASS: tidak menambah glassmorphism. |
| R-12 | PASS: shadow-1 hanya memberi tanda tombol bahasa yang dapat ditekan. |
| R-13 | PASS: tidak menambah efek glow. |
| R-14 | PASS: tidak menambah pola kartu fitur seragam. |
| R-19 | PASS source: tidak menambah animasi; aturan prefers-reduced-motion sebelumnya tetap. |
| R-22 | PASS: tidak menambah ilustrasi. |

### Block 3: Liveliness

| Item | Status dan bukti |
|---|---|
| Dials eksplisit | PASS: ENERGY 2 / RHYTHM 2 / MOTION 2 sesuai DESIGN.md. |
| Konsistensi dials | PASS source: satu kontrol kecil dan tagline memakai token yang ada; penilaian visual akhir di R-35. |
| Titik fokus per layar | PASS source: heading/saldo utama yang sudah ada dipertahankan. |
| Whitespace struktural | PASS source: stack brand memisahkan nama/tagline; gap Topbar memberi ruang pada kontrol. |
| Aksen disengaja | PASS: terakota tetap untuk aksi utama; bahasa memakai permukaan netral. |
| Motif identitas | PASS: ikon dompet, font brand, ubin timbul dan kata Piduiteun. |
| Design Read | PASS: arah produk dan dials diterapkan sebelum perubahan UI. |

### Block 4: Craftsmanship dan Quality Locks

| Item | Status dan bukti |
|---|---|
| C-1 | PASS: keputusan tagline/kontrol/warna memiliki alasan pada bagian 1. |
| C-2 | PASS source/test: pergantian bahasa, request header, fallback storage dan tanggal diuji; interaksi browser di R-35. |
| C-3 | PASS: tidak menambah section tanpa kebutuhan produk. |
| C-4 | PENDING browser: kontras otomatis lolos; state, tema, breakpoint dan keyboard nyata perlu click-through. |
| C-5 | PASS: hasil verifikasi dinyatakan sesuai alat dan batasnya. |
| R-05 | PASS: susunan halaman yang ada tetap; tidak menambah template landing page. |
| R-11 | PASS: tombol bahasa memakai radius tombol proyek; tidak mengubah semua elemen menjadi pil. |
| R-15 | PASS: CTA menjelaskan tindakan simpan, unduh, impor, ubah, hapus; label locale menjelaskan bahasa berikutnya. |
| R-16 | PASS: tidak menambah buzzword pemasaran. |
| R-20 | PASS source: identitas dompet dan Piduiteun spesifik produk; evaluasi visual di R-35. |
| R-21 | PASS source: pemilih light/dark tetap tersedia di auth dan aplikasi. |
| R-29 | PASS: tidak menambah warna inti baru; memakai token existing. |
| R-30 | PASS source: tidak mengganti desain dengan referensi produk lain. |
| R-31 | PASS: alasan layout, ukuran, bayangan dan warna tertulis pada bagian 1. |

## 7. Click-through Claude

Gunakan server yang dikelola pemilik. Checklist ini belum dijalankan oleh Codex.

1. Login dan Register pada 360px serta desktop, dua tema: tombol IN → EN → SU → IN berputar setiap klik; label aksesibilitas/title menyebut bahasa aktif dan berikutnya; tanpa dropdown, tanpa group/pressed.
2. Tab ke tombol bahasa, aktifkan lewat Enter dan Space. Ukur target minimal 44px; cek fokus terlihat. Ulangi pada Topbar setelah login.
3. Reload pada EN dan SU: bahasa benar pada render awal; `localStorage.pidu_locale` dan `html.lang` sesuai. Uji nilai storage rusak dan storage diblokir pada profil uji terpisah.
4. Sidebar desktop dan panel geser 280px: Pidu/Piduiteun rapi, tagline miring dan `lang=su`. Pada 360px ukur overflow halaman; judul Topbar panjang terpotong tanpa menumpuk kontrol.
5. Buka seluruh halaman pada EN/SU. Periksa title tab, PageHeader title/subtitle, placeholder, label pembaca layar, teks skeleton/empty/error, menu tema/pengguna dan bottom navigation.
6. Buka modal tambah/edit Budget, Kategori, Transaksi. Periksa judul dan validasi kosong/invalid, kategori inline, select jenis/metode, select bulan, konfirmasi hapus/salin, serta tombol Simpan & tambah lagi.
7. Ganti bahasa saat error form atau toast masih tampil. Pastikan pesan berubah dan data form tetap; undo hapus enam detik dan pemulihan tetap bekerja.
8. Dashboard: sapaan berdasarkan jam, nama bulan pembanding, legenda/tooltip grafik, label ringkasan, dan format Rupiah tetap Indonesia. Uji periode pembanding bulan penuh, tahun penuh, serta rentang biasa.
9. Laporan bulanan/mingguan/kalender: bulan English/Sunda, “Week N”/“Minggu ka-N”, hari Sunda, detail tanggal dan keyboard baris tabel/sel kalender.
10. DevTools Network: request API memakai Accept-Language saat itu; setelah switch, label hasil API di-refetch. Tidak ada reload halaman, filter URL tetap.
11. Uji impor invalid dan valid pada akun uji: pesan per baris, kolom wajib, berkas kosong/tidak dipilih, ringkasan duplikat dan kategori baru. Ganti bahasa setelah analisis; data kategori/deskripsi tetap asli.
12. Export Excel/PDF dan backup pada EN/SU: buka berkas dan pastikan judul/kolom/label/bulan Indonesia; data pengguna tidak berubah. Pastikan export tersebut tetap dapat diimpor.
13. Uji login gagal, 422, record/endpoint 404, throttle dan 500 pada lingkungan uji; pesan sesuai bahasa. Uji header kosong/tidak dikenal kembali ke Indonesia.
14. Ulangi mode terang/gelap, reduced motion, seluruh alur dengan keyboard, drawer, modal, dropdown pengguna/export, focus return, serta toast. Periksa console/network error.
15. Jalankan Lighthouse accessibility dengan target tetap 100. Catat viewport, tema, bahasa, temuan dan hasil nyata; jangan menandai R-35 PASS sebelum click-through selesai.
16. Minta penutur asli Sunda membaca tabel contoh dan alur transaksi/impor/backup; revisi katalog terkait kemudian regenerate snapshot dan jalankan check-locales bila katalog PHP berubah.

---

## Review Claude (29 Sep 2026)

**Hasil: LULUS, siap commit.**

| Cek | Hasil |
|---|---|
| `php artisan test` | 89 lulus (851 assertions) |
| `npm run lint`, `npm run build` | bersih; chunk `locales` 40 kB terpisah |
| `check-locales.mjs` | 487 kunci id/en/su cocok |
| `ImportRequest::attributes()` | sudah benar (`'file' => __(...)`) |
| Tombol bahasa (Chrome) | satu tombol, siklus IN → EN → SU → IN; `html lang`, `localStorage`, aria-label ikut berubah; tanpa reload |
| Login/Register | tombol ada, teks ikut bahasa |
| Pesan server | validasi login benar di id/en/su |
| Sisa teks Indonesia (EN, 11 halaman + modal) | tidak ditemukan; modal budget SU: "Tambihan anggaran", bulan "Pébruari" |
| Mobile 360px | tombol 44×44, tanpa scroll horizontal |
| Lighthouse (desktop, dashboard) | Accessibility 100, Best Practices 100, SEO 100 |
| Console | tanpa error/warning |
| Export Excel/PDF | tetap Indonesia (dicakup `LocaleTest::test_excel_and_pdf_content_stay_indonesian`) |

Catatan: singkatan sumbu grafik tetap "jt"/"rb" (format angka id-ID, sesuai keputusan Rupiah selalu format Indonesia). Token uji Claude (id 12) sudah dihapus.
