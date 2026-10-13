# Laporan Phase 15: Perbaikan hasil review QA/UX (13 Okt 2026, Claude)

Brief: `phase-15.md`. Semua 21 temuan dikerjakan. Belum di-commit (menunggu persetujuan user).

## Hasil per temuan

| No | Status | Perubahan |
|---|---|---|
| 1 | Selesai | `users.opening_balance` (null = belum ditanya). Dashboard: kartu utama "Uang kamu sekarang" = saldo awal + semua transaksi s.d. hari ini (`TransactionService::currentBalance`, field `wallet` di API dashboard). Pertanyaan saldo awal untuk user yang belum mengisi (Simpan / Mulai dari Rp 0). Ringkasan periode bernama "Selisih" di dashboard, Transaksi, dan laporan. |
| 2 | Selesai | `POST auth/forgot-password` (jawaban sama untuk email terdaftar/tidak), `POST auth/reset-password` (semua sesi keluar), email berbahasa user via `ResetPasswordNotification` dengan link ke `/reset-password` frontend. Halaman Akun (`/account`, menu pengguna "Akun & password"): nama, saldo awal, ganti password (password lama wajib, sesi lain keluar). `.env` disiapkan untuk Gmail; `MAIL_MAILER` masih `log` sampai user mengisi akun. |
| 3 | Selesai | Sidebar dan bottom nav: satu item "Laporan" (`/reports` → harian). Tab Harian/Mingguan/Bulanan/Tahunan/Kalender (`ReportTabs`). Sidebar 11 → 7 item. |
| 4 | Selesai | Kategori default baru: Hasil Jualan, Uang Saku, Uang Bulanan (pemasukan), Modal Usaha (pengeluaran); migrasi menambahkannya ke user lama yang belum punya. Filter kategori sudah berkelompok (optgroup). |
| 5 | Selesai | HP: tombol Tambah Transaksi disembunyikan (ada Catat), kartu ringkasan dipadatkan; transaksi pertama terlihat di layar pertama. |
| 6 | Selesai | Urutan form: Jenis, Nominal (besar), Kategori, Tanggal + Deskripsi, lalu "Detail lain" (Metode, Catatan). "Simpan & tambah lagi" jadi tombol sekunder. `inputmode="numeric"`, nominal bulat kecuali mengedit data lama bersen. |
| 7 | Selesai | Pembanding periode disembunyikan bila periode lalu kosong. |
| 8 | Selesai | `formatRupiah` tanpa sen (termasuk animasi saldo). |
| 9 | Selesai | Hapus transaksi tanpa dialog; Batalkan 8 detik. |
| 10 | Selesai | "Salin bulan lalu" hanya jika `previous_month_count > 0`; form budget tanpa Bulan/Tahun; tombol Tambah Budget tidak dobel saat kosong. |
| 11 | Selesai | Satu kartu "Unduh data" (Daftar transaksi / Laporan lengkap satu tahun) + kartu Backup; tombol Excel/PDF utama-sekunder; chip "Sheet" jadi teks. |
| 12 | Selesai | "Tampilkan yang disembunyikan" default mati; istilah "nonaktif" → "disembunyikan dari form"; tombol hapus kategori terpakai menjelaskan alasannya. |
| 13 | Selesai | 500/502–504 → "Server sedang bermasalah. Tunggu sebentar lalu coba lagi."; jaringan putus → ajakan cek internet. |
| 14 | Selesai | Tombol "Pilih file" + nama file berbahasa aplikasi; petunjuk jadi 4 poin. |
| 15 | Selesai | Label bahasa IN → ID. |
| 16 | Selesai | Judul halaman di topbar dihapus; cukup H1. |
| 17 | Selesai | Header tabel `vertical-align: middle`; kolom filter kategori diperlebar. |
| 18 | Selesai | Sisa budget negatif: "Budget bulan ini lebih Rp X". |
| 19 | Selesai | Label CSS "Memperbarui data..." dihapus; skeleton/pudar sebagai tanda loading, teks status tetap untuk pembaca layar. |
| 20 | Selesai | Notifikasi pindah ke kanan bawah (di HP di atas bottom nav). |
| 21 | Selesai | "Rasio pengeluaran" → "Pemasukan terpakai 17% untuk pengeluaran"; daftar tanpa Konfirmasi Password (backend juga tidak mewajibkan). |

## Bukti

- Backend: 95 tes lolos (6 tes baru di `AccountTest`: saldo awal & saldo sekarang, validasi, ganti password, lupa password tanpa membocorkan email, reset token sah/palsu, jumlah budget bulan lalu).
- Frontend: lint bersih, build sukses, `check-locales.mjs` PASS 577 kunci id/en/su (66 kunci baru di `i18n/phase15.js`).
- Click-through dan audit antislop: `anti-slop/audit-001-2026-10-13.md` (8 temuan lanjutan, belum dikerjakan).
- Akun uji `qa-review@pidu.test` dibuat untuk click-through lalu dihapus beserta datanya; server dimatikan setelah uji.

## Catatan

- Gmail: isi `MAIL_USERNAME` (alamat Gmail) dan `MAIL_PASSWORD` (App Password 16 huruf), ganti `MAIL_MAILER=smtp`, lalu restart `npm start`.
- Ditemukan saat uji: `MAIL_FROM_ADDRESS="${MAIL_USERNAME}"` kosong saat mode log → "From" kosong. `config/mail.php` kini jatuh ke `MAIL_USERNAME` lalu `noreply@pidu.local`; kesalahan konfigurasi email dijawab 503 "Email belum bisa dikirim" alih-alih 500.
- Impeccable 4.5.2 terpasang (tanpa hook, telemetri mati); detector menemukan 1 hal (font Fraunces), masuk audit no. 2.
