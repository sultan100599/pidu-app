# Report Phase 3 — Frontend scaffold, layout, sidebar, routing, login, dark mode

Tanggal: 2026-09-29 · Executor: **Kimi** · Scope: `frontend/` saja; `backend/` tidak disentuh (tidak ada bug backend yang ditemukan saat smoke test).

## Ringkasan
Scaffold React 19 + Vite diubah jadi aplikasi nyata: axios client dengan proxy Vite (tanpa URL hardcode), auth flow lengkap (login/register/logout/`me` dengan Sanctum bearer token disimpan di `localStorage['pidu_token']`), routing dengan guard, layout sidebar+topbar (offcanvas mobile), dark mode `data-bs-theme` tanpa kedipan, dan placeholder untuk semua route. Semua halaman fitur (tabel, chart) sengaja belum dikerjakan sesuai instruksi.

Commit kode: `5bb85f5 Phase 3: frontend scaffold, layout, routing, auth, dark mode`

## Dependensi (`frontend/package.json`)
- **Dihapus:** `pidu-app: file:..` (`npm uninstall pidu-app`).
- **Ditambahkan:** `react-router-dom@6.30.6` (v6), `axios@1.20.0`, `bootstrap@5.3.8`, `bootstrap-icons@1.13.1`, `react-toastify@11.1.0`. React tetap 19.3.0 (tidak downgrade). Tidak ada JS Bootstrap/Popper.

## File dibuat
- `src/main.jsx` — providers `BrowserRouter > ThemeProvider > AuthProvider > App`, urutan import CSS: bootstrap → bootstrap-icons → react-toastify → `styles/app.css`
- `src/App.jsx` — definisi routes + `ToastContainer` (`top-right`, `autoClose 3000`, `theme={theme}`)
- `src/api/client.js` — axios instance `baseURL '/api'`; request interceptor (bearer token dari `localStorage`); response interceptor 401 (kecuali `/auth/login`) → hapus token + panggil handler + toast "Sesi berakhir, silakan login kembali." **sekali saja** (flag `sessionExpiredToastShown`, di-reset saat login berhasil)
- `src/api/auth.js` — `login()`, `register()`, `me()`, `logout()`
- `src/context/AuthContext.jsx` + `useAuth()` — state `user/token/initializing`; bootstrap `GET /auth/me` (ambil `data`), gagal → hapus token; `logout()` panggil API (abaikan error) → hapus token → navigate `/login` → toast "Berhasil logout."
- `src/context/ThemeContext.jsx` + `useTheme()` — `light|dark`, `localStorage['pidu_theme']`, default `prefers-color-scheme`, terapkan ke `data-bs-theme`
- `src/components/ProtectedRoute.jsx` (simpan `state.from`), `GuestRoute.jsx`, `FullPageSpinner.jsx`, `PageHeader.jsx` (judul + subjudul + slot aksi + `document.title`)
- `src/components/layout/nav.js` — **definisi menu tunggal** (`MENU` + `findMenuItem()`), dipakai Sidebar dan Topbar
- `src/components/layout/Sidebar.jsx` — brand "Pidu" + `bi-wallet2`, `NavLink` berikon (nav-pills, aktif ter-highlight), grup "Laporan" 5 sub-menu selalu terbuka; mobile = offcanvas kiri (state React) + close via backdrop/Esc/klik menu
- `src/components/layout/Topbar.jsx` — hamburger (`d-lg-none`), judul halaman aktif (dari `nav.js`), toggle tema (`bi-moon-stars`/`bi-sun`, `aria-label`), dropdown user (nama+email, "Keluar") — tutup saat klik luar/Esc
- `src/components/layout/AppLayout.jsx` — sidebar + topbar + `<Outlet/>`, body scroll-lock saat offcanvas terbuka
- `src/pages/LoginPage.jsx`, `RegisterPage.jsx`, `PlaceholderPage.jsx` ("Segera hadir" + prop phase), `NotFoundPage.jsx` (link ke Dashboard)
- `src/utils/errors.js` — `getErrorMessage()` (message → 429 → 500+ → network) & `getFieldErrors()` (`{field: pesan pertama}`)
- `src/utils/format.js` — `formatRupiah`, `formatNumber`, `formatDate` (short/`'long'`), `parseYmd` (lokal, bukan UTC), `toYmd` (komponen lokal, bukan `toISOString`)
- `src/styles/app.css` — semua warna lewat variabel Bootstrap (`--bs-body-bg`, `--bs-tertiary-bg`, `--bs-border-color`, dst.)
- `index.html` — `lang="id"`, `<title>Pidu-App</title>`, **inline script tema sebelum render** (anti-kedip di mode gelap), favicon SVG dompet baru
- `public/favicon.svg` — favicon dompet sederhana (ganti bawaan Vite)

## File diubah
- `frontend/package.json`, `package-lock.json` (dependensi di atas)
- `frontend/.oxlintrc.json` — lihat deviasi 1
- `frontend/src/App.jsx`, `main.jsx` (rewrite dari demo)

## File dihapus (sisa demo Vite)
`src/App.css`, `src/index.css`, `src/assets/{react.svg,hero.png,vite.svg}` (folder `assets` ikut hilang), `public/icons.svg`, `public/favicon.svg` lama.

## Verifikasi

### `npm --prefix frontend run lint` → lolos, 0 error 0 warning
```
> oxlint
(found 0 warnings, 0 errors)
```

### `npm --prefix frontend run build` → lolos
```
vite v8.3.1 building client environment for production...
✓ 96 modules transformed.
dist/index.html                             0.92 kB
dist/assets/bootstrap-icons-mSm7cUeB.woff2 134.04 kB
dist/assets/index-CH5GDoAF.css             325.54 kB │ gzip: 47.74 kB
dist/assets/index-CbgooTxy.js              347.07 kB │ gzip: 109.76 kB
✓ built in 1.26s
```

### Smoke test (`npm start`, curl ke `http://localhost:8010`, server dihentikan setelahnya)
1. SPA fallback: `GET /login` → **200**, `/transactions` → **200**, `/register` → 200, `/favicon.svg` → 200. HTML ter-serve `lang="id"`, `<title>Pidu-App</title>`, inline script tema ada.
2. Login lewat proxy:
   - `POST /api/auth/login {demo@pidu.test,password}` → **200 + token**.
   - `GET /api/auth/me` dengan bearer token → `{"data":{"id":1,"name":"Demo User","email":"demo@pidu.test"}}` (sesuai kontrak, dibungkus `data`).
   - Password salah → **422** `{"message":"Email atau password salah.","errors":{"email":["Email atau password salah."]}}`.
   - Tanpa token → **401** `{"message":"Unauthenticated."}`.
3. **Belum dicek di browser** (tidak ada akses browser/headless dari environment ini). Alur login → sidebar → toggle dark mode → reload → logout belum diuji visual; menunggu review lead dengan Chrome DevTools.

## Deviasi dari instruksi (dengan alasan)
1. **`.oxlintrc.json`: rule `react/only-export-components` dimatikan** (sebelumnya `warn`). File context memang mengekspor komponen Provider + hook (`useAuth`/`useTheme`) sesuai struktur yang diminta phase-3.md; pola ini standar React dan warning fast-refresh akan muncul terus di semua phase kalau rule dibiarkan.
2. **Sidebar desktop butuh override CSS di `@media (min-width: 992px)`** (`visibility: visible !important; transform: none !important; background-color: var(--bs-tertiary-bg) !important`). Penyebab: di Bootstrap 5.3.8, class `.offcanvas-lg` *standalone* (di luar `.navbar-expand-lg`) tetap `visibility: hidden` tanpa `.show` bahkan di ≥lg (override `visibility: visible` hanya ada untuk offcanvas di dalam navbar). Sidebar tetap memakai class Bootstrap `offcanvas-lg offcanvas-start` + state React untuk `show`; perilaku offcanvas mobile murni class Bootstrap. Dicatat supaya tidak dikira pelanggaran "jangan pakai JS Bootstrap" — tidak ada JS Bootstrap yang dipakai.
3. **Definisi menu ditaruh di `src/components/layout/nav.js`** — phase-3.md hanya menyatakan "definisikan menu sekali di satu array" tanpa menyebut file; ini lokasi yang paling dekat dengan pemakainya (Sidebar + Topbar).
4. **Favicon**: dibuat SVG dompet custom sederhana (bukan emoji inline) — sama-sama memenuhi "favicon sederhana".
5. **Toast sukses login/register sengaja tidak ditambahkan** — phase-3.md hanya mensyaratkan toast untuk logout & sesi berakhir; tidak mau menambah perilaku di luar spek.
6. **`phase-3.md` ikut ter-commit** (konsisten dengan `phase-1.md`/`phase-2.md` yang sudah tracked).

## Catatan untuk Phase 4
- `api/client.js` sudah siap dipakai: `import { client } from './api/client'` (baseURL `/api`, token otomatis).
- `utils/format.js` (`formatRupiah`, `formatDate`, `parseYmd`, `toYmd`) dan `utils/errors.js` siap dipakai halaman Transaksi/Kategori.
- `PageHeader` menerima prop `actions` untuk tombol kanan (mis. "Tambah Transaksi").
- Pola error 422 per field sudah dipakai di Login/Register — tinggal tiru untuk form CRUD.

**Tidak dilanjutkan ke Phase 4 sesuai instruksi.**

## Perbaikan review-3

Tanggal: 2026-09-29 · Commit: lihat `Phase 3 fixes: desktop sidebar layout, mobile width, auth boot error handling`

### 1. [BLOCKER] Layout desktop rusak — diperbaiki
`src/styles/app.css` di `@media (min-width: 992px)`: `.sidebar.offcanvas-lg` sekarang `position: fixed; top: 0; bottom: 0; left: 0; overflow-y: auto; z-index: 1030;` (ditambah override `visibility/transform/background-color` yang sudah ada). `.app-content { margin-left: 250px }` tetap. Hasil: sidebar fixed setinggi layar di kiri dengan scroll sendiri, topbar sticky di atas konten kanan. **Belum diverifikasi visual di browser** (tidak ada akses browser); menunggu re-check lead di Chrome.

### 2. Lebar sidebar mobile 100% layar — diperbaiki
`.sidebar` mendapat `--bs-offcanvas-width: 280px;`, jadi `.offcanvas-start` Bootstrap (yang sebelumnya menang dengan `width: var(--bs-offcanvas-width)` = 400px) kini lebarnya 280px. Di layar 360px tersisa ±80px backdrop yang bisa diklik untuk menutup. **Belum diverifikasi visual di browser.**

### 3. Token terhapus saat server mati — diperbaiki
`src/context/AuthContext.jsx` bootstrap `me()` di-refactor: token **hanya** dihapus jika `err.response?.status === 401`. Error lain (network/`ERR_CONNECTION_REFUSED`, 5xx): token dibiarkan, state `bootError` diisi `getErrorMessage(err)` ("Tidak dapat terhubung ke server."). Varian baru `BootErrorScreen` di `src/components/FullPageSpinner.jsx` (ikon `bi-wifi-off` + pesan + tombol **"Coba lagi"** dengan spinner saat retry) dirender oleh `ProtectedRoute` dan `GuestRoute` selama `bootError` ada. Retry mengulang `me()` via ref (event handler, bukan effect, agar lint `set-state-in-effect` tetap bersih). Tidak ada setState sinkron di effect bootstrap. **Belum diverifikasi di browser** (butuh backend dimatikan saat halaman dibuka).

### 4. Double toast saat logout token invalid — diperbaiki
`src/api/client.js`: response interceptor sekarang mengabaikan 401 juga untuk URL yang mengandung `/auth/logout` (selain `/auth/login` yang sudah ada). Logout lokal tetap jalan dan hanya toast "Berhasil logout." yang muncul.

### 5. Warning React Router — diperbaiki
`src/main.jsx`: `<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>`. **Belum dicek console browser**; flag ini resmi dari React Router v6.30 dan build tidak mengeluh.

### 6. Kecil — diperbaiki
`input-group` password di `LoginPage.jsx` dan `RegisterPage.jsx` diberi class `has-validation` supaya sudut input `is-invalid` tetap benar.

### 7. Proses: server dihentikan — dibuktikan
Proses sisa di port 8001 & 8010 dihentikan pakai PowerShell (`Get-NetTCPConnection ... | Stop-Process -Force`). Output pembuktian (perintah kedua):

```
TIDAK ADA LISTENER - port 8001 & 8010 kosong
```

`Get-NetTCPConnection -LocalPort 8001,8010 -State Listen` tidak mengembalikan baris apa pun.

### Verifikasi
`npm --prefix frontend run lint` → lolos, **0 warning 0 error** (satu warning sementara `react(set-state-in-effect)` muncul saat refactor poin 3; sudah dihilangkan dengan pola async-function-di-dalam-effect + retry via ref):

```
> oxlint
(found 0 warnings, 0 errors)
```

`npm --prefix frontend run build` → lolos:

```
vite v8.3.1 building client environment for production...
✓ 96 modules transformed.
dist/index.html                             0.92 kB
dist/assets/bootstrap-icons-mSm7cUeB.woff2 134.04 kB
dist/assets/bootstrap-icons-BeopsB42.woff   180.28 kB
dist/assets/index-CbDTg-gW.css              325.63 kB │ gzip:  47.77 kB
dist/assets/index-DdLdAY5S.js               348.14 kB │ gzip: 110.01 kB
✓ built in 448ms
```

**Catatan jujur:** tidak ada akses browser/headless di environment ini, jadi poin 1, 2, 3, dan 5 belum diverifikasi visual/console — menunggu re-check lead di Chrome sesuai instruksi review.
