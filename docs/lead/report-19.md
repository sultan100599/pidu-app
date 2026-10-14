# Report Phase 19: Rapikan & lengkapi

Tanggal: 14 Oktober 2026 · Dikerjakan: Claude · Antislop: selama dikerjakan (pilihan user) · Pola kerja: `CLAUDE.md` "Pidu workflow"

## Skill yang dipakai
- **antislop** (inti): selalu dipakai.
  - **antislop-ui:** filter periode, kaca halaman Masuk, dan kartu-kartu baru.
  - **antislop-copywriting:** teks baru id/en/su dan penggantian istilah.
  - **antislop-human:** kontras kaca halaman Masuk diukur, dialog bisa dipakai dengan keyboard, nama tombol bahasa.
  - **antislop-layoutmobile:** dua kolom di HP, tombol Filter, dan tidak ada geser samping di 360px.
  - **antislop-code:** komentar kode baru singkat dan hanya menjelaskan alasan.
- **impeccable:**
  - `impeccable context` dan `craft-floor` dibaca sebelum mengubah UI.
  - Pilihan font memakai daftar "font bawaan AI" dari `new-work.md`.
  - Detektor dijalankan sekali di akhir: 0 temuan.
- **improve-ui:** audit di subagent terpisah (lihat bagian Audit).

## Yang dibuat

### Keputusan user
- **Font judul:** Fraunces diganti **Zen Maru Gothic**, dipilih dari tiga contoh yang ditampilkan di Anbo. Font dimuat dari `@fontsource` (huruf latin saja), dan alasannya dicatat di `DESIGN.md`.
- **Ganti istilah:**
  - Dashboard → Ringkasan
  - Budget → Anggaran
  - Export → Unduh
  - Impor → Unggah
  - Cash → Tunai
  - Export & Backup → Unduh & Cadangan
  - Penggantian berlaku di menu, judul halaman, judul tab, 55 baris teks frontend, 10 pesan server, nama sheet Excel ("Anggaran"), dan nama file template (`pidu-template-unggah.xlsx`).
  - Bahasa Inggris: Overview, Download, dan Upload. Bahasa Sunda: Ringkesan, Unduh, dan Unggah.
- **Jam pengingat:** diatur sendiri di halaman Akun (07.00 sampai 21.00, atau Mati); bawaannya 17.00. Disimpan di kolom baru `users.reminder_hour`.

### Akun
- **Keluar dari semua perangkat:** `POST /api/account/logout-all` menghapus semua token, termasuk perangkat yang sedang dipakai.
- **Hapus akun:**
  - Memakai `DELETE /api/account` dan harus diisi password.
  - Datanya dihapus berurutan: transaksi, pindahan, rutin, anggaran, dompet, kategori, token, token reset password, lalu user.
  - Folder cadangan Excel milik user ikut dihapus.
  - Di halaman Akun ada link "Unduh cadangan dulu".

### Audit Phase 18 (no. 1–3)
- **Tombol dompet:** Arsipkan dan Hapus hanya tampil kalau bisa dipakai (API mengirim `in_use`), dan ada keterangan "Arsipkan saja".
- **Catatan transaksi rutin:** kolom baru `recurring_transactions.notes`. Isi Catatan dari form Catat ikut tersimpan dan disalin ke setiap transaksi yang dibuat, dan form Transaksi rutin punya isian Catatan.
- **Panel Anggaran:** ada keterangan saat saringan Pribadi/Usaha aktif.

### Audit Phase 15 (no. 3–7)
- Di HP, Filter Transaksi hanya berupa tombol.
- Di HP, kartu angka Ringkasan tampil dua kolom.
- Placeholder "0" pada nominal besar dibuat tipis.
- Link Ubah/Dompet setinggi 44px.
- Jarak pilihan di kartu Unduh data mengikuti skala.

### Data demo
- Seeder demo sekarang mengisi sampai hari ini. Kalau dijalankan ulang di database lama, seeder hanya menambah data setelah transaksi terakhir.
- Anggaran bulan berjalan disalin dari September.
- Database asli: 61 transaksi demo baru (29 Sep sampai 14 Okt) dan 5 anggaran Oktober.

### Aksesibilitas
- **Lighthouse aksesibilitas 100** di Masuk, Ringkasan, Akun (HP), dan Transaksi (desktop).
- **Nama tombol bahasa** sekarang diawali teks yang terlihat ("ID. Bahasa: …"), sesuai WCAG 2.5.3.
- **Tata letak bergeser saat memuat (CLS) di Ringkasan HP:** turun dari 0,219 ke 0,037. Subjudul tanggal sekarang memakai periode terpilih tanpa menunggu data. Hal yang sama diterapkan di Rekap Harian dan Rekap Mingguan.
- **Keyboard:** dialog Hapus akun bisa dibuka dengan Enter, fokus masuk ke dialog, Escape menutupnya, lalu fokus kembali ke tombol (tes e2e).
- **Pembaca layar:** diperiksa lewat pohon aksesibilitas (Lighthouse dan locator peran Playwright), bukan lewat pembaca layar sungguhan.

## Pemeriksaan
- **Backend:** 112 tes lolos. Tes baru mencakup pengingat, keluar dari semua perangkat, hapus akun beserta isolasinya, catatan transaksi rutin, dan `in_use` dompet.
- **E2E Playwright:** 16 tes lolos. Tes baru mencakup jam pengingat, hapus akun, keluar semua perangkat, dan dialog keyboard; tes anggaran disesuaikan dengan istilah baru.
- **Lint, build, dan locale:** `oxlint` bersih, `vite build` sukses, `check-locales` lolos (710 kunci), dan `pint` sudah dirapikan.
- **Pengecekan semua halaman:** 11 halaman × terang/gelap × 360px/1280px, tanpa geser samping dan tanpa error di console.
- **Cek visual di Anbo:** Ringkasan desktop dan 360px, Transaksi 360px, Akun, Unduh & Cadangan, dan Dompet.
- **Database asli:** dicadangkan ke `backend/storage/app/pre-phase19/` sebelum migrasi. Seeder diuji dulu di salinan database, sekali dari kosong dan sekali sebagai tambahan.

## Audit improve-ui
Dijalankan di subagent terpisah dan hanya membaca kode. Dua temuan lolos tiga bukti (kontrak, runtime, koreksi). Belum ada yang diubah; menunggu pilihan user.

| No | Masalah | Usul perbaikan | Keyakinan |
|---|---|---|---|
| 1 | Toast setelah "Mulai dari Rp 0" menyuruh mengubah saldo "di menu Akun", padahal saldo awal sekarang diatur di halaman Dompet (`OpeningBalancePrompt.jsx`, `i18n/phase15.js`). | Ganti teksnya menjadi "...di halaman Dompet." (id/en/su). | Tinggi |
| 2 | Di Transaksi, keadaan tanpa batas tanggal disebut "Semua tanggal" di subjudul tapi "Semua" di pilihan Periode filter, sedangkan kartu Unduh data sudah memakai "Semua tanggal". | Label preset `all` di `utils/period.js` menjadi "Semua tanggal" (kunci i18n sudah ada). | Sedang |

Rekomendasi auditor ("perbaiki dulu"): no. 1.

## Catatan
- Cadangan database otomatis (`storage/app/backups/database/`) masih bisa memuat data akun yang sudah dihapus sampai cadangan itu tergeser cadangan baru.
- Teks Sunda baru (`phase19.js`, 21 baris) perlu dibaca penutur asli.
