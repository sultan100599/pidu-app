# PHASE 9 — Polishing, keamanan/production, QA akhir

Executor & reviewer: Claude.

## Rencana
1. **Dependency & keamanan**
   - Upgrade `react-router-dom` v6 → v7 (menutup 2 advisory `npm audit`). Future flag v7 sudah aktif sejak Phase 3, jadi perilaku tidak berubah; flag dihapus karena sudah default di v7.
   - `npm audit` (root + frontend) dan `composer audit` harus bersih.
   - Token Sanctum diberi masa berlaku (saat ini `expiration = null` = token tidak pernah kedaluwarsa).
   - Cek mode production: `APP_DEBUG=false` → tidak ada stack trace; `.env.example` aman.
2. **QA menyeluruh di Chrome** (desktop + 360px + dark): semua halaman termasuk Register dan 404, alur login → CRUD → laporan → export → logout. Lighthouse (accessibility, best practices) untuk halaman utama; perbaiki temuan yang relevan.
3. **Dokumentasi:** README root (fitur, setup, menjalankan, akun demo, tes, struktur, pindah ke MySQL); hapus README bawaan Vite di `frontend/`.
4. **Regresi akhir:** `php artisan test`, lint, build, `npm run db:reset`, `npm start` dari nol.
5. `report-9.md` + ringkasan akhir proyek, commit.
