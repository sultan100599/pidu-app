# REVIEW PHASE 3 — Fix list (dari lead)

Executor: Kimi. Working dir `C:\Pidu-App`. Hanya `frontend/`. Kerjakan semua poin di bawah, lalu verifikasi dan commit. **Jangan lanjut ke Phase 4.**

## Yang sudah benar (jangan diubah)
Struktur file, API client + interceptor, ThemeContext + script anti-kedip, menu dari satu array, halaman Login/Register, utils format/errors, lint & build bersih. Sudah dicek lead di Chrome: redirect ke /login + kembali ke `state.from` jalan, error 422 per field jalan, dark mode tetap setelah reload, sesi tetap setelah reload, Esc menutup menu mobile, dropdown user dan logout jalan.

## Harus diperbaiki

### 1. [BLOCKER] Layout desktop rusak
Di viewport ≥ 992px sidebar ikut alur normal (`position: static`), jadi topbar dan konten terdorong **di bawah** sidebar (topbar mulai di y≈550px). Penyebabnya: `.offcanvas-lg` di ≥ lg memang tidak fixed. Perbaikan di `styles/app.css` dalam `@media (min-width: 992px)`:
- `.sidebar` → `position: fixed; top: 0; bottom: 0; left: 0; width: 250px; overflow-y: auto; z-index: 1030;`
- `.app-content { margin-left: 250px; }` (sudah ada)
- Hasil yang diharapkan: sidebar setinggi layar di kiri, isi sidebar bisa di-scroll sendiri, topbar sticky di atas konten kanan.

### 2. Lebar sidebar mobile = 100% layar
`.offcanvas-start` Bootstrap memakai `width: var(--bs-offcanvas-width)` (400px), dan selector itu mengalahkan `.sidebar { width: 250px }`. Di layar 360px sidebar menutupi seluruh layar dan backdrop tidak terlihat. Perbaikan: set variabel di `.sidebar`, yaitu `--bs-offcanvas-width: 280px;`. Hasil: di 360px, sidebar 280px dan 80px sisanya menampilkan backdrop yang bisa diklik untuk menutup.

### 3. [BUG] Token terhapus saat server sedang mati / error
`AuthContext` bootstrap: `catch { setToken(null) }` menghapus token untuk **semua** error. Terbukti saat review: backend mati → `/auth/me` `ERR_CONNECTION_REFUSED` → user ter-logout, padahal tokennya masih valid. Perbaikan:
- Hapus token **hanya jika** `err.response?.status === 401`.
- Selain itu (network / 5xx): **jangan** hapus token. Tampilkan layar penuh "Tidak dapat terhubung ke server." (pakai `getErrorMessage`) + tombol **"Coba lagi"** yang mengulang `me()`. Buat state `bootError` dan komponen kecil atau varian `FullPageSpinner`. ProtectedRoute/GuestRoute menampilkan layar ini selama `bootError` ada.

### 4. Double toast saat logout dengan token yang sudah invalid
Jika token sudah dicabut, `POST /auth/logout` → 401 → interceptor memunculkan "Sesi berakhir…" lalu `logout()` memunculkan "Berhasil logout." juga. Perbaikan: interceptor mengabaikan 401 untuk URL `/auth/logout` (sama seperti `/auth/login`).

### 5. Warning React Router di console
Ada 2 warning "React Router Future Flag Warning". Perbaikan:
`<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>`. Console harus bersih.

### 6. Kecil
- Password `input-group` di Login & Register: tambahkan class `has-validation` supaya sudut input tetap benar saat `is-invalid`.

### 7. Proses: server tidak benar-benar dihentikan
report-3 menyatakan "Server sudah dihentikan", tapi saat review port 8001 dan 8010 masih LISTEN (proses sisa). Setelah verifikasi, hentikan server **dan buktikan**:
```powershell
foreach ($p in 8001,8010) { Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | % { Stop-Process -Id $_.OwningProcess -Force } }
Get-NetTCPConnection -LocalPort 8001,8010 -State Listen -ErrorAction SilentlyContinue   # harus kosong
```
Tempel output perintah kedua (kosong) ke report.

## Verifikasi
- `npm --prefix frontend run lint` dan `npm --prefix frontend run build` → lolos.
- Tidak ada akses browser → tulis apa adanya. Lead akan re-check poin 1, 2, 3, dan 5 di Chrome.

## Selesai
- `git commit -m "Phase 3 fixes: desktop sidebar layout, mobile width, auth boot error handling"`
- Tambahkan bagian **"Perbaikan review-3"** di akhir `docs/lead/report-3.md` (apa yang diubah per poin + output verifikasi). Jangan lanjut Phase 4.
