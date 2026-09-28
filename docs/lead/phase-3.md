# PHASE 3 — Frontend scaffold, layout, sidebar, routing, login, dark mode

Executor: Kimi. Baca `docs/lead/00-PLAN.md` dan `docs/lead/report-2.md` (kontrak API final). Working dir `C:\Pidu-App`. Kerjakan **hanya `frontend/`**. Backend sudah selesai dan ter-test; jangan ubah `backend/`. Kalau menemukan bug backend, catat di report dan jangan diperbaiki sendiri. Fitur halaman (tabel transaksi, chart, dsb.) **belum** dikerjakan di phase ini: cukup halaman placeholder.

## Hasil review Phase 2 (dari lead)
Phase 2 dikerjakan lead karena kuota Kimi habis. 48 tes lolos. Hal yang penting untuk FE:
- Login `POST /api/auth/login {email,password}` → `{token, user:{id,name,email}}`. Salah → 422, `errors.email[0] = "Email atau password salah."`. Throttle 5x/menit → 429.
- Register `POST /api/auth/register {name,email,password,password_confirmation}` → 201 `{token,user}`.
- `GET /api/auth/me` → `{data:{id,name,email}}` (dibungkus `data`). `POST /api/auth/logout`.
- Tanpa token/token invalid → 401 `{"message":"Unauthenticated."}`.
- Error validasi: `{message, errors:{field:[pesan Indonesia]}}`.

## Keputusan terkait kondisi scaffold (disetujui lead)
- Scaffold Phase 1 memakai **React 19** (bukan 18). **Tetap pakai React 19**, jangan downgrade.
- `frontend/package.json` punya dependency aneh `"pidu-app": "file:.."`. **Hapus** (`npm --prefix frontend uninstall pidu-app`).
- Linter bawaan = `oxlint` (`npm run lint`). Pakai saja.

## A. Dependency (di `frontend/`)
`react-router-dom@^6` (v6 saja, jangan v7), `axios`, `bootstrap@^5.3`, `bootstrap-icons`, `react-toastify`.
**Jangan** pakai JS Bootstrap (`bootstrap.bundle`/Popper). Offcanvas, dropdown, dan collapse dikontrol state React + class Bootstrap. Chart.js belum dipasang (Phase 5).
Import CSS di `main.jsx`: `bootstrap/dist/css/bootstrap.min.css`, `bootstrap-icons/font/bootstrap-icons.css`, `react-toastify/dist/ReactToastify.css`, lalu `./styles/app.css`.

## B. Struktur
```
src/
  main.jsx                 # providers: BrowserRouter > ThemeProvider > AuthProvider > App
  App.jsx                  # definisi routes
  api/client.js            # axios instance
  api/auth.js              # login(), register(), me(), logout()
  context/AuthContext.jsx  # + hook useAuth()
  context/ThemeContext.jsx # + hook useTheme()
  components/
    layout/AppLayout.jsx   # sidebar + topbar + <Outlet/>
    layout/Sidebar.jsx
    layout/Topbar.jsx
    ProtectedRoute.jsx     # belum login → /login (simpan state.from)
    GuestRoute.jsx         # sudah login → /
    FullPageSpinner.jsx
    PageHeader.jsx         # judul + subjudul + slot aksi kanan; set document.title
  pages/
    LoginPage.jsx
    RegisterPage.jsx
    PlaceholderPage.jsx    # "Segera hadir" + nomor phase (prop)
    NotFoundPage.jsx
  utils/format.js          # formatRupiah, formatNumber, formatDate, parseYmd, toYmd
  utils/errors.js          # getErrorMessage(err), getFieldErrors(err)
  styles/app.css
```
Hapus sisa demo Vite: `App.css`, `index.css`, `src/assets/react.svg`, `public/vite.svg` (ganti favicon sederhana, mis. emoji 💰 via SVG inline atau `bi-wallet2`). `index.html`: `lang="id"`, `<title>Pidu-App</title>`.

## C. API client (`api/client.js`)
- `axios.create({ baseURL: '/api', headers: { Accept: 'application/json' } })`. **Tidak ada URL backend yang di-hardcode**; semua lewat proxy Vite.
- Request interceptor: token dari `localStorage['pidu_token']` → `Authorization: Bearer ...`.
- Response interceptor: status **401** (kecuali request ke `/auth/login`) → hapus token lalu panggil handler `onUnauthorized` yang didaftarkan oleh AuthContext (set user null → ProtectedRoute redirect ke /login) + toast "Sesi berakhir, silakan login kembali." (cukup sekali, jangan spam kalau banyak request 401 bersamaan).
- `utils/errors.js`: `getErrorMessage(err)`. Urutannya: `response.data.message`, lalu fallback per status: 429 → "Terlalu banyak percobaan, coba lagi sebentar.", 500+ → "Terjadi kesalahan pada server.", tanpa response (network) → "Tidak dapat terhubung ke server.". `getFieldErrors(err)` → `{field: 'pesan pertama'}` dari `errors`.

## D. Auth (`AuthContext`)
State: `user`, `token`, `initializing`. Fungsi: `login(email,password)`, `register(payload)`, `logout()`.
- Saat app dibuka: jika ada token → `GET /auth/me` (ambil `data`). Gagal → hapus token. Selama cek → `<FullPageSpinner/>` (jangan sampai halaman login berkedip).
- `logout()`: panggil `POST /auth/logout` (abaikan error), hapus token, user = null, navigate `/login`, toast "Berhasil logout.".
- Token disimpan di `localStorage['pidu_token']` (keputusan plan: Sanctum bearer token).

## E. Theme (`ThemeContext`)
- `theme` ∈ `light|dark`, disimpan di `localStorage['pidu_theme']`. Default mengikuti `prefers-color-scheme`.
- Terapkan ke `document.documentElement.setAttribute('data-bs-theme', theme)`. Set juga **sebelum React render** lewat inline script kecil di `index.html` supaya tidak ada kedipan putih saat reload di mode gelap.
- `ToastContainer` memakai `theme={theme}`, posisi `top-right`, `autoClose 3000`.
- Semua warna custom di `app.css` wajib memakai variabel Bootstrap (`var(--bs-body-bg)`, `var(--bs-border-color)`, `var(--bs-tertiary-bg)`, dll.), **bukan** warna hardcode, supaya otomatis benar di dua mode.

## F. Routing (`App.jsx`)
```
/login, /register                → GuestRoute
/ (AppLayout, ProtectedRoute):
  index                → PlaceholderPage "Dashboard"            phase 5
  transactions         → PlaceholderPage "Transaksi"            phase 4
  categories           → PlaceholderPage "Kategori"             phase 4
  reports/daily        → "Rekap Harian"   reports/weekly  → "Rekap Mingguan"
  reports/monthly      → "Rekap Bulanan"  reports/yearly  → "Rekap Tahunan"
  reports/calendar     → "Kalender"                             (semua phase 6)
  budgets              → PlaceholderPage "Budget"               phase 7
  export               → PlaceholderPage "Export"               phase 8
*                      → NotFoundPage (link kembali ke Dashboard)
```
Definisikan menu **sekali** di satu array (`label, path, icon`, dengan grup "Laporan") dan pakai untuk Sidebar + judul halaman, jangan duplikasi.

## G. Layout
- **Desktop (≥ lg / 992px):** sidebar tetap di kiri, lebar 250px, tinggi penuh, konten di kanan dengan scroll sendiri. Sidebar berisi brand "Pidu" + ikon `bi-wallet2`, lalu menu dengan ikon bootstrap-icons (`NavLink`, item aktif ter-highlight). Grup "Laporan" berisi 5 sub-menu, boleh selalu terbuka.
- **Mobile (< lg):** sidebar disembunyikan. Tombol hamburger di Topbar membuka sidebar sebagai offcanvas dari kiri + backdrop. Klik backdrop, tekan Esc, atau klik menu → tertutup. Body tidak ikut scroll saat terbuka.
- **Topbar:** hamburger (mobile saja), judul halaman aktif, tombol toggle tema (`bi-moon-stars` / `bi-sun`, dengan `aria-label`), dropdown user (nama + email, item "Keluar"). Dropdown menutup saat klik di luar atau tekan Esc.
- Tidak boleh ada horizontal scroll di lebar 360px.

## H. Halaman Login & Register
- Card di tengah layar, brand di atas. Login: email + password (dengan tombol show/hide password), tombol "Masuk", link ke Register. Register: nama, email, password, konfirmasi.
- Validasi sederhana di client (wajib isi, format email) sebelum submit. Error 422 dari server ditampilkan per field (`is-invalid` + `invalid-feedback`). Error lain → alert di atas form (`getErrorMessage`).
- Saat submit: tombol disabled + spinner, cegah double-submit.
- Sukses login → navigate ke `location.state.from` atau `/`. Sukses register → langsung masuk.
- Hanya jika `import.meta.env.DEV`: tampilkan petunjuk akun demo `demo@pidu.test / password` + tombol "Isi akun demo".
- Toggle tema juga tersedia di halaman login (pojok kanan atas).

## I. utils/format.js (dipakai phase berikutnya, buat sekarang)
- `formatRupiah(n)` → `Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0, maximumFractionDigits:2})` → "Rp 1.500.000".
- `formatNumber(n)`, `formatDate('2026-09-28')` → "28 Sep 2026", `formatDate(x, 'long')` → "Senin, 28 September 2026".
- `parseYmd('2026-09-28')` → `new Date(2026, 8, 28)` (**local**, jangan `new Date('2026-09-28')` yang di-parse sebagai UTC). `toYmd(date)` → 'Y-m-d' dari komponen lokal (jangan `toISOString()`).

## J. Kualitas
- Komponen fungsional + hooks; tidak ada warning React di console (key, dsb.).
- Aksesibilitas dasar: `label` untuk semua input, tombol ikon punya `aria-label`, fokus terlihat.
- Tidak ada `console.log` sisa.

## K. Verifikasi (tempel output ke report)
```
npm --prefix frontend run lint
npm --prefix frontend run build
```
Keduanya harus lolos tanpa error. Lalu `npm start` di root dan cek:
1. `curl -s -o NUL -w "%{http_code}" http://localhost:8010/login` → 200 (SPA fallback), juga `/transactions` → 200.
2. Login lewat proxy dengan curl (`POST http://localhost:8010/api/auth/login`) → dapat token.
3. Kalau ada akses browser/headless: login demo → sidebar tampil → toggle dark mode → reload (tema tetap) → logout → kembali ke /login. Kalau tidak ada akses browser, tulis **"belum dicek di browser"** di report. Jangan mengklaim sudah dicek. Lead akan mengecek dengan Chrome DevTools saat review.
Hentikan server setelahnya.

## L. Selesai
- `git add -A && git commit -m "Phase 3: frontend scaffold, layout, routing, auth, dark mode"`
- Tulis `docs/lead/report-3.md`: file dibuat/diubah/dihapus, output lint & build, hasil verifikasi, deviasi + alasan. **Jangan lanjut ke Phase 4.**
