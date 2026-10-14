# Catatan Pidu-App

Satu tempat untuk semua catatan proyek: rencana, keputusan, riwayat pembuatan per tahap, bug yang ditemukan, alat bantu UI (anti-slop), dan pekerjaan berikutnya.
Terakhir diperbarui: 13 Oktober 2026.

> Arsip asli (brief & laporan lengkap per tahap, log Kimi) tetap ada di `docs/lead/`. File ini adalah ringkasannya dan cukup dibaca sendiri.

---

## 1. Ringkasan

Pidu-App adalah aplikasi pencatat keuangan pribadi: catat pemasukan dan pengeluaran, lihat rekap harian sampai tahunan, atur budget per kategori, lalu export, impor, dan backup data.

- **Status:** tahap 0–17 selesai dan di-commit di branch `main` (lihat `git log`).
- **Tes:** 95 tes backend + 10 tes end-to-end Playwright (`npm run test:e2e`) lolos (89 tes backend sebelum Phase 15) di SQLite (76 tes sebelum Phase 13 juga lolos di MariaDB); lint & build frontend bersih; `npm audit` dan `composer audit` tanpa celah.
- **Menjalankan:** `npm start` di `C:\Pidu-App`, lalu buka http://localhost:8010.
- **Akun demo:** `demo@pidu.test` / `password` (data Juni–September 2026 + data ringan 2024–2025). Akun kedua `other@pidu.test` / `password` untuk uji isolasi data.

## 2. Keputusan teknis

| Area | Keputusan |
|---|---|
| Struktur | Monorepo: `backend/` (Laravel 12), `frontend/` (React 19 + Vite), `package.json` di root |
| Menjalankan | `npm start` di root → backend, frontend, dan scheduler backup sekaligus. `npm run setup` sekali di awal |
| Port | Backend **8001**, frontend **8010**. Frontend memanggil `/api` yang di-proxy Vite ke backend (tanpa CORS) |
| Database | **SQLite (final, keputusan user).** Kode tetap bisa pindah ke MySQL cukup dengan ganti `.env`: ekspresi tanggal terpusat di `App\Support\DateSql`, urutan jenis di `App\Support\TypeOrder`. Sudah terbukti di MariaDB 10.4 |
| Login | Laravel Sanctum token (Bearer), berlaku 30 hari |
| Multi-user | Semua data per user; akses data user lain → 404 |
| Nominal | `DECIMAL(15,2)`, dikirim ke API sebagai angka |
| Minggu | Senin–Minggu (ISO) |
| Zona waktu | Asia/Jakarta, bahasa Indonesia |
| Frontend | React 19, React Router 7, Axios, Bootstrap 5.3 + bootstrap-icons, Chart.js 4, react-toastify |
| Export | `maatwebsite/excel` (xlsx), `barryvdh/laravel-dompdf` (pdf) |
| Pola kode | Controller tipis → Service (logika & query agregat di database) → Model. FormRequest untuk validasi (pesan Bahasa Indonesia), API Resource untuk output |

Catatan: rencana awal menyebut Laravel 11 dan React 18. Laravel 11 sudah diblokir Composer karena advisory keamanan, jadi dipakai Laravel 12; scaffold Vite memasang React 19. Keduanya disetujui.

## 3. Cara kerja pembuatan

- Awalnya **Claude sebagai lead** (menulis rencana, brief per tahap, dan review) dan **Kimi CLI sebagai pelaksana**.
- Kuota 5 jam Kimi habis di tengah Phase 2 dan Phase 4. Sejak Phase 4, atas permintaan user, **Claude mengerjakan sendiri**.
- Setiap tahap di-review sebelum diterima: tes backend, lint/build frontend, lalu dicek langsung di Chrome (desktop, HP 360px, dark mode). Setelah itu laporan ditulis, di-commit, dan **user ditanya dulu** sebelum lanjut ke tahap berikutnya.

## 4. Riwayat per tahap

### Phase 0+1: Fondasi (28 Sep, Kimi, `ce38bb9`)
- Scaffold Laravel 12 + React (Vite), database SQLite, migrasi `categories`, `transactions`, `budgets`.
- Model, relasi, enum jenis & metode pembayaran, helper `DateSql`.
- Seeder data demo deterministik: 22 kategori per user, 696 transaksi, 5 budget dengan status aman/hampir habis/terlampaui.
- `npm start` / `npm run setup` di root.

### Phase 2: Backend API (28 Sep, Claude karena kuota Kimi habis, `fc85290`)
- Login/daftar/logout (Sanctum), CRUD transaksi & kategori, dashboard, laporan harian/mingguan/bulanan/tahunan/kalender/detail hari, budget.
- Validasi dengan pesan Indonesia, isolasi data per user, error 500 tanpa bocor detail saat `APP_DEBUG=false`.
- 48 feature test.
- **Bug ditemukan:** timezone masih UTC (setting `.env` tidak terbaca); tanggal tersimpan dengan jam, sehingga filter periode bisa melewatkan hari terakhir.

### Phase 3: Kerangka frontend (29 Sep, Kimi + review Claude, `5bb85f5`, `4928ef6`)
- Router, Axios dengan token, halaman login/daftar, sidebar (menu geser di HP), dark mode tanpa kedipan, helper format Rupiah/tanggal.
- **Review menemukan 7 masalah** yang lalu diperbaiki Kimi: layout desktop rusak (konten di bawah sidebar), menu HP menutupi seluruh layar, user ter-logout setiap backend mati, notifikasi ganda saat logout, peringatan React Router, dan server yang dilaporkan "sudah dimatikan" padahal masih jalan.

### Phase 4: Transaksi & Kategori (29 Sep, Kimi ±60% lalu diselesaikan Claude, `0025cac`)
- Halaman Transaksi: filter (cari, jenis, kategori, metode, periode) tersimpan di URL, ringkasan, tabel (desktop) / kartu (HP), pagination, form tambah/edit, konfirmasi hapus.
- Halaman Kategori: tab pengeluaran/pemasukan, aktif/nonaktif, pilihan ikon & warna, tidak bisa dihapus bila masih dipakai.
- **Bug ditemukan:** input nominal "1250000,5" berubah jadi "12.500.005,"; fokus melompat saat mengetik di popup; popup tidak bisa ditutup dengan klik di luar; nominal terpotong di HP.

### Phase 5+6: Dashboard & Laporan (29 Sep, Claude, `caa023d`)
- Dashboard: ringkasan, rata-rata harian, rasio pengeluaran, grafik pemasukan vs pengeluaran, grafik per kategori, 5 pengeluaran terbesar, progress budget.
- Rekap Harian, Mingguan, Bulanan, Tahunan (bisa diklik untuk menelusuri lebih detail), dan Kalender dengan detail per tanggal.
- Halaman bergrafik dimuat terpisah, sehingga file awal lebih kecil.
- **Bug ditemukan:** warna grafik tertinggal satu tema saat dark mode di-toggle; nominal di kalender terpotong di HP.

### Phase 7: Budget (29 Sep, Claude, `f8500f0`)
- Budget per kategori per bulan, ringkasan total, status aman (< 80%) / hampir habis (≥ 80%) / terlampaui (≥ 100%), pindah bulan, "Salin bulan lalu".

### Phase 8: Export (29 Sep, Claude, `0fe7e98`)
- Export Excel & PDF sesuai filter Transaksi; "Export Semua ke Excel" per tahun (7 sheet: Transaksi, Harian, Mingguan, Bulanan, Tahunan, Kategori, Budget).
- **Bug ditemukan:** pesan validasi sebagian berbahasa Inggris sejak Phase 2; **celah formula injection** (deskripsi berawalan `=` dijalankan sebagai rumus di Excel); ukuran PDF ±900 KB (sekarang ±23 KB).

### Phase 9: Polishing (29 Sep, Claude, `04bc2cc`)
- Upgrade React Router ke v7 (menutup celah keamanan dari `npm audit`), token login kedaluwarsa 30 hari.
- Aksesibilitas: skor Lighthouse 100 di semua halaman yang diaudit (kalender dan login diperbaiki).
- README ditulis ulang; perintah `npm test` dan `npm run build`.

### Phase 10: Impor, Backup, Uji MySQL (29 Sep, Claude, `8495190`)
- **Impor Excel/CSV:** template, pemeriksaan dulu (error per baris, pratinjau), duplikat dilewati, kategori baru dibuat otomatis; file Export/Backup bisa diimpor ulang.
- **Backup otomatis** setiap hari 23:00 selama `npm start` jalan: Excel semua transaksi per user + salinan database SQLite, 14 terbaru disimpan, di `backend/storage/app/backups` (tidak masuk Git).
- **Uji MariaDB:** 76/76 tes lolos; angka laporan identik dengan SQLite. Dijalankan dengan instance sementara lalu dihapus; database XAMPP user tidak disentuh.
- **Bug ditemukan:** di CSV, "12.500" terbaca Rp 12,50 tanpa error; urutan kategori berbeda antara SQLite dan MySQL.

### Phase 11: Redesign UI (29 Sep, Codex, `722d512`)
- Arah dari pemilik (`DESIGN.md`): hangat & ramah, palet krem/peach/terakota, membulat, 3D lewat CSS saja; aturan anti-slop diterapkan selama pengerjaan.
- Putaran 1: token desain, judul serif, kartu Saldo peach timbul, tombol timbul, dark mode cokelat hangat, warna kategori otomatis dijaga kontrasnya.
- Putaran 2: kartu Saldo miring mengikuti kursor (mati di HP/"kurangi animasi"), ubin ikon timbul, menu aktif timbul, lapisan kertas, hover terangkat hanya pada elemen yang bisa diklik.
- **Bug ditemukan:** menu logout/Export terpotong ke kanan di layar lebar (dilaporkan user), header tabel tidak seragam.

### Phase 12: Polish UX & visual (29 Sep, Codex + Claude)
- Tombol Catat global + shortcut `N`, chip kategori favorit & metode terakhir diingat, "Batalkan" setelah hapus, navigasi bawah di HP, skeleton loading, heatmap kalender, sapaan + ringkasan hari ini, perbandingan dengan bulan/periode sebelumnya, angka Saldo menghitung naik, font judul Fraunces.
- **Diperbaiki Claude setelah review:** chip kategori kosong di browser baru (kini dari riwayat transaksi) dan label pembanding yang terlalu panjang (kini "dari Agustus 2026").

### Phase 13: Tagline & tiga bahasa (29 Sep, Codex + review Claude)
- Tagline **Piduiteun** di bawah "Pidu" pada menu (asal nama Pidu, bahasa Sunda; tidak diterjemahkan).
- **Satu tombol bahasa** di topbar dan halaman Masuk/Daftar: menampilkan bahasa aktif dan tiap klik berganti IN → EN → SU. Pilihan disimpan di browser (`pidu_locale`), tanpa reload.
- Seluruh aplikasi diterjemahkan: teks frontend (`t('teks Indonesia')`, kamus `frontend/src/i18n/`, 487 kunci), pesan & validasi server (`backend/lang/{id,en,su}`, middleware membaca header `Accept-Language`). Bahasa Sunda memakai ragam lemes.
- Tetap bahasa Indonesia: isi file Excel/PDF, data milik user (nama kategori, catatan), format Rupiah & singkatan angka grafik ("jt").
- Cek kunci: `node frontend/scripts/check-locales.mjs`. Tes backend 89 lulus. Terjemahan Sunda sebaiknya dibaca penutur asli.
- Codex sempat terhenti (memori laptop penuh) lalu dilanjutkan dengan `codex exec resume <id>`.

### Phase 14: Dashboard washitsu (29 Sep–3 Okt, Codex + Claude, `34bbd96`)
- Material washitsu (kayu, kertas washi) pada shell dan kartu; tiga panel dashboard (kategori, terbesar, budget) terbuka penuh dengan dasar sejajar.
- Ganti tema memakai animasi pintu shoji (±920 ms); langsung tanpa pintu bila `prefers-reduced-motion`.
- Sidebar bisa diciutkan jadi ikon saja (tombol garis tiga di atas, disimpan di `pidu_sidebar_collapsed`).
- Tabel laporan berubah jadi tumpukan kartu di HP; perbaikan tampilan form-switch saat aktif.
- Latar Masuk/Daftar dari video washitsu milik user (`frontend/src/assets/auth/`, `AuthScene.jsx`).
- Masih terbuka: video versi malam untuk mode gelap (opsional dari user); tekstur washi masih sangat tipis (2,5%).

### Phase 15: Perbaikan hasil review usability (13 Okt, Claude, `7baf4b9`)
- Review QA/UX untuk target pelajar, ibu rumah tangga, UMKM, karyawan, dan orang tua menghasilkan 21 temuan; semua dikerjakan (rincian di `docs/lead/report-15.md`).
- Utama: **saldo nyata** (saldo awal + semua transaksi, ditanya sekali di dashboard, bisa diubah di halaman Akun); **lupa & ganti password** (email lewat Gmail); **satu menu Laporan** dengan tab; form transaksi lebih ringkas; kategori untuk usaha/pelajar/rumah tangga; hapus langsung dengan Batalkan.
- Email Gmail belum aktif: isi `MAIL_USERNAME` dan `MAIL_PASSWORD` (App Password) di `backend/.env`, ganti `MAIL_MAILER=smtp`. Selama `log`, email ditulis ke `backend/storage/logs/laravel.log`.
- Audit antislop setelah pengerjaan: `anti-slop/audit-001-2026-10-13.md` (8 temuan lanjutan, menunggu pilihan user).
- Impeccable 4.5.2 (https://github.com/pbakaus/impeccable) dipasang sebagai alat bantu desain: `.claude/skills/impeccable/`, tanpa hook, telemetri dimatikan di `.impeccable/config.json`; clone repo di `impeccable/` (tidak ikut Git). Jangan jalankan `/impeccable document` (menimpa `DESIGN.md`).

### Phase 16: Kaca buram melayang (13 Okt, Claude, `3698798`, `d32cb78`)
- Sidebar, bar atas, bottom nav, dan kartu jadi panel kaca buram melayang di atas foto ruang washitsu (siang/malam), terinspirasi template v0 pilihan user. Di desktop judul & tombol halaman ada di bar atas. Semua di `frontend/src/styles/glass.css`; rincian `docs/lead/report-16.md`.
- Pengecualian aturan antislop R-10 dipilih user dan dicatat di `DESIGN.md`.
- Sidebar menempel ke dasar layar selama halaman masih bisa digulir, dan baru ikut melayang saat halaman mentok di bawah (permintaan user). Label tombolnya "Perkecil menu" / "Perbesar menu"; saat diperkecil, yang tampil logo Pidu.

### Phase 17: Tes end-to-end (13 Okt, Claude, `e1c379d`)
- Playwright (`frontend/e2e/`, jalankan `npm run test:e2e` di root): 9 alur di desktop (daftar + saldo awal + catat, lewati saldo awal, hapus + batalkan, form transaksi, menu Laporan + judul di bar atas, sidebar diperkecil, budget terlampaui, ganti password + masuk lagi, lupa password) dan 1 alur HP (tanpa geser ke samping di 7 halaman, Catat, ganti bahasa).
- Aman untuk data asli: tes menyalakan backend sendiri (port 8002, `backend/database/e2e.sqlite` yang dibuat ulang tiap kali) dan frontend sendiri (port 8011), memakai Chrome yang sudah terpasang.
- Batas percobaan masuk kini diatur `AUTH_THROTTLE_PER_MINUTE` (default 5; tes memakai 1000). Proxy Vite bisa diarahkan lewat `PIDU_API_URL`.

### Phase 18: Dompet, Usaha/Pribadi, transaksi rutin, pengingat (14 Okt, Claude)
- **Dompet** (menu baru): tunai / rekening bank / e-wallet, tanda Pribadi atau Usaha, saldo awal per dompet, arsipkan atau hapus (hapus hanya untuk dompet tanpa catatan; minimal satu dompet tetap aktif). Migrasi membuat "Dompet Utama" berisi saldo awal lama dan memasukkan semua transaksi lama ke sana (dicoba dulu di salinan database; database asli dicadangkan ke `backend/storage/app/pre-phase18/` sebelum migrasi).
- **Pindah uang** antar-dompet, tidak dihitung pemasukan/pengeluaran; riwayatnya di halaman Dompet dan bisa dihapus.
- Form Catat: pilihan **Dompet** (muncul kalau dompet lebih dari satu, default dompet terakhir dipakai) dan **Ulangi otomatis** (tiap bulan / tiap minggu) di "Detail lain".
- **Transaksi rutin** (`/recurring`, tombol "Rutin" di halaman Transaksi): dicatat oleh `pidu:recurring` tiap jam lewat scheduler `npm start`; jadwal yang terlewat saat aplikasi mati ikut dibuat, tanggal 31 tidak bergeser, dijeda lalu jalan lagi tidak membuat yang terlewat selama jeda.
- Saringan **Semua / Pribadi / Usaha** di dashboard dan semua laporan (hanya tampil kalau punya dompet usaha dan pribadi). Kartu "Uang kamu sekarang" menampilkan rincian per dompet. Daftar transaksi punya saringan Dompet.
- **Pengingat**: banner di dashboard mulai jam 17.00 kalau hari itu belum ada catatan, tombol Catat dan "Nanti saja" (tertutup sampai besok).
- Export/backup Excel punya kolom **Dompet**; impor membaca kolom Dompet (opsional; nama baru dibuat jadi dompet baru).
- Saldo awal di halaman Akun dipindah ke halaman Dompet.
- Tes: backend 108 lolos (baru: `WalletTest`, `RecurringTest`, impor kolom Dompet); e2e 13 lolos (baru: `wallets.spec.js`). Rincian `docs/lead/report-18.md`. Audit antislop `anti-slop/audit-002-2026-10-14.md` (7 temuan) menunggu pilihan nomor.

## 5. Anti-slop (aturan UI untuk AI agent)

**Sumber:** https://github.com/miqdadbadjuber/anti-slop (versi 3.2.19). Dipasang 29 Sep 2026; dipakai (mode "selama pengerjaan") untuk redesign Phase 11–12 oleh Codex.

**Apa itu:** kumpulan aturan untuk AI coding agent supaya UI, teks, dan komentar kode tidak terlihat generik "buatan AI" (gradien biru-ungu, kartu template, angka karangan, ikon/emoji hiasan, dan sejenisnya), plus aksesibilitas dan tampilan mobile. Isinya **filter**, bukan panduan gaya: tidak menentukan warna, font, atau layout.

| Lokasi | Isi |
|---|---|
| `.claude/skills/antislop/` | Aturan inti (38 aturan + Delivery Gate), selalu dipakai |
| `.claude/skills/antislop-ui/` | Warna, layout, komponen, dekorasi, animasi |
| `.claude/skills/antislop-human/` | Kontras, keyboard, fokus, state + pengecek kontras |
| `.claude/skills/antislop-layoutmobile/` | Tampilan HP ↔ desktop, overflow, ukuran tombol |
| `.claude/skills/antislop-copywriting/` | Teks: judul, tombol, pesan |
| `.claude/skills/antislop-code/` | Kebersihan komentar kode |
| `CLAUDE.md` | "Pointer" agar skill dimuat otomatis di tiap sesi Claude Code |

Hanya folder skill yang dipasang, tanpa repo utuh (sama dengan yang dilakukan installer resmi `npx antislop-ai`).

**Cara pakai:**
- Buka **sesi Claude Code baru** sebelum pengerjaan UI (skill dimuat saat sesi dimulai).
- Sebelum mengerjakan UI, Claude bertanya dulu: anti-slop diterapkan **selama** pengerjaan atau **setelah** selesai sebagai review.
- Cek kontras warna: `python .claude/skills/antislop-human/contrast-check.py "#0d6efd" "#ffffff"`
- Update: `npx antislop-ai --update`. Hapus: folder `.claude/skills/antislop*` dan blok `<!-- antislop:start -->` … `<!-- antislop:end -->` di `CLAUDE.md`.

## 6. Yang perlu dilakukan

- [x] Restart `npm start` supaya scheduler backup harian berjalan (sudah dilakukan user).
- [x] Commit skill anti-slop, `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`, `CATATAN.md` (commit Phase 11).
- [x] Penyesuaian UI dengan anti-slop (Phase 11–12).
- [ ] Opsional (butuh keputusan/aset dari pemilik): ilustrasi empty state.

### Rencana berikutnya (hasil review QA 13 Okt, urutan disetujui user; hosting ditunda)

**Phase 18: Dompet, Usaha/Pribadi, transaksi rutin, pengingat** (selesai 14 Okt, lihat riwayat di atas)
- [x] Dompet: nama (Tunai, BRI, DANA, Kas Warung, dll.), jenis (tunai/rekening/e-wallet), tanda **Pribadi** atau **Usaha**, saldo awal per dompet. Saldo awal akun lama dipindah ke "Dompet Utama" dan semua transaksi lama masuk ke sana.
- [x] Form catat memilih dompet (default dompet terakhir).
- [x] Transfer antar-dompet (bukan pemasukan/pengeluaran).
- [x] Saringan Semua / Pribadi / Usaha di dashboard dan laporan; kartu "Uang kamu sekarang" menampilkan rincian per dompet.
- [x] Transaksi rutin (mis. listrik tiap tanggal 5), dibuat otomatis oleh scheduler di `npm start`.
- [x] Pengingat: **banner di aplikasi saja** (pilihan user), "Belum ada catatan hari ini" + tombol Catat, bisa ditutup sampai besok.

**Phase 19: Rapikan & lengkapi**
- [ ] Ganti istilah (pilihan user: semua): Dashboard → Ringkasan, Budget → Anggaran, Export → Unduh, Impor → Unggah, Cash → Tunai, Export & Backup → Unduh & Cadangan.
- [ ] Ganti font judul Fraunces (pilihan user): tunjukkan 2–3 contoh font serif hangat dulu, user memilih.
- [ ] Sisa audit antislop `anti-slop/audit-001-2026-10-13.md` no. 3–7: kotak Filter di HP, dashboard HP terlalu panjang, placeholder "0" di Nominal, link "Ubah" terlalu kecil, jarak pilihan di kartu Unduh data.
- [ ] Cek aksesibilitas resmi: Lighthouse, pembaca layar, navigasi keyboard penuh.
- [ ] Data demo diperpanjang sampai bulan berjalan (sekarang berhenti 28 Sep).
- [ ] Hapus akun, dan "keluar dari semua perangkat" di halaman Akun. Catatan: menghapus user langsung akan gagal karena transaksi/transaksi rutin menahan dompet & kategori; hapus berurutan (transaksi, pindahan, rutin, budget, dompet, kategori, token, user).
- [ ] Pilih nomor perbaikan dari audit antislop Phase 18 (`anti-slop/audit-002-2026-10-14.md`).

**Menunggu dari user**
- [ ] Isi `MAIL_USERNAME` (alamat Gmail) dan `MAIL_PASSWORD` (App Password 16 huruf) di `backend/.env`, ganti `MAIL_MAILER=smtp`, lalu email lupa password diuji sungguhan.
- [ ] Teks bahasa Sunda baru (66 kunci di `frontend/src/i18n/phase15.js`) dibaca penutur asli.
- [ ] Opsional: video/gambar washitsu versi malam untuk halaman Masuk.
- [ ] Efek kaca dicoba di HP Android murah sungguhan (simulasi: rata-rata 60fps, 2 frame tersendat; blur dikerjakan GPU).

**Ditunda (keputusan user)**
- [ ] Hosting + PWA supaya Pidu bisa dipakai dari HP (butuh keputusan tempat & biaya hosting).

## 7. Referensi cepat

| Perintah (di `C:\Pidu-App`) | Fungsi |
|---|---|
| `npm start` | Jalankan aplikasi (backend + frontend + scheduler) |
| `npm test` | Tes backend + lint frontend |
| `npm run test:e2e` | Tes end-to-end Playwright (server & database tes sendiri, data asli aman) |
| `npm run build` | Build production frontend |
| `npm run db:reset` | Hapus semua data, isi ulang data demo |
| `cd backend && php artisan pidu:backup` | Backup manual |

Panduan lengkap setup, struktur folder, pindah ke MySQL, dan catatan production: lihat `README.md`.
