# Report Phase 9 — Polishing, keamanan/production, QA akhir

Tanggal: 2026-09-29 · Executor & reviewer: Claude.

## Perubahan
**Keamanan & dependency**
- `react-router-dom` 6.30 → **7.18.4**: menutup 2 advisory moderate (open redirect via backslash; advisory SSR). Future flag v7 sudah aktif sejak Phase 3, jadi perilaku tidak berubah; `future={...}` di `main.jsx` dihapus. Konsekuensi: bundle awal naik 325 kB → 431 kB (+36 kB gzip), masih di bawah batas peringatan Vite.
- Token Sanctum sekarang punya masa berlaku: `SANCTUM_EXPIRATION` (default 43200 menit = 30 hari; sebelumnya `null` = tidak pernah kedaluwarsa). Jadwal harian `sanctum:prune-expired --hours=24`. Tes baru: token ditolak (401) setelah lewat masa berlaku.
- `npm audit` (root & frontend): 0 vulnerabilities. `composer audit`: bersih.

**Aksesibilitas (Lighthouse)**
- Kalender: struktur `role="grid"`/`columnheader` tanpa `row` diganti `role="group"`; nama hari `aria-hidden`; tombol tanggal memakai teks lengkap tersembunyi (hari, tanggal, pemasukan, pengeluaran, jumlah transaksi) + `aria-current="date"` untuk hari ini. Sebelumnya `aria-label` tidak memuat teks yang terlihat.
- Login/Register: pembungkus `<div>` → `<main>` (landmark).
- Kotak akun demo di Login: kontras 3,5 dan 4,26 → ≥ 4,5 (latar `bg-body`, teks monospace biasa, tombol `outline-primary`).
- `index.html`: meta description + `robots: noindex, nofollow`; `public/robots.txt` `Disallow: /` (aplikasi keuangan pribadi tidak boleh terindeks). Akibatnya skor SEO Lighthouse sengaja rendah (audit "is-crawlable").

**Dokumentasi & tooling**
- README root ditulis ulang: fitur, prasyarat (termasuk ekstensi PHP), setup, akun demo, perintah, struktur, pindah ke MySQL, catatan production.
- Script root baru: `npm test` (PHPUnit + oxlint) dan `npm run build`.
- `frontend/README.md` bawaan template Vite dihapus.

## Hasil QA

**Lighthouse** (setelah perbaikan):
| Halaman | Accessibility | Best Practices |
|---|---|---|
| /login (mobile) | 93 → **100** | 100 |
| / Dashboard (desktop) | 100 | 100 |
| /transactions (mobile) | 100 | 100 |
| /categories (mobile) | 100 | 100 |
| /reports/calendar (desktop) | 89 → **100** | 100 |
| /budgets (mobile) | 100 | 100 |

**Alur end-to-end di Chrome (user baru):** daftar dengan password pendek → "Password minimal 8 karakter."; daftar valid → langsung masuk Dashboard kosong (semua 0, rasio "—") dengan 22 kategori default; 2 transaksi → dashboard 5.000.000 / 125.000 / rata-rata 4.166,67 / rasio 2,5%; URL tidak dikenal → halaman 404 di dalam layout; Keluar → /login dan token terhapus; login ulang → hanya melihat 2 transaksi sendiri (isolasi).

**Regresi akhir**
| Cek | Hasil |
|---|---|
| `npm test` | 59 passed (339 assertions) + oxlint 0 warning |
| `npm run build` | sukses |
| `npm audit` ×2 / `composer audit` | bersih |
| `npm run db:reset` | 2 user / 696 transaksi / 44 kategori / 5 budget |
| `npm start` dari nol | SPA 200 (`/login`, `/reports/calendar`), robots.txt, login → dashboard Sep 2026 = report-1, `export/all` xlsx 39 KB, logout 200 |
| Port 8001/8010 | kosong; token sisa sesi QA dihapus |

## Belum dikerjakan / catatan
- Impor dari Excel & auto-backup (opsional di 00-PLAN) belum dibuat.
- Jalur MySQL belum diuji dengan server MySQL sungguhan (semua tes di SQLite); semua ekspresi tanggal sudah terpusat di `DateSql`.
- `npm run setup` memakai sintaks cmd Windows (README berisi langkah manual untuk OS lain).
