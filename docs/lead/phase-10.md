# PHASE 10 — Impor Excel, backup otomatis, uji MariaDB

Executor & reviewer: Claude. Menyelesaikan sisa item 00-PLAN (Phase 8 opsional) + verifikasi jalur MySQL. Aplikasi **tetap SQLite** (keputusan user).

## 1. Uji MariaDB (XAMPP 10.4.32)
Datadir sementara terpisah di folder Temp, port 3307. `my.ini` XAMPP user menunjuk ke `C:\xampp` (bukan `C:\xampp82`); **tidak diubah**. Seluruh test suite + seed dijalankan lewat override env (tanpa mengubah `.env`).

## 2. Impor transaksi dari Excel
- `GET /api/import/template`: xlsx sheet "Transaksi" (kolom sama dengan export + contoh) + sheet "Petunjuk" (aturan kolom, nilai valid, daftar kategori user).
- `POST /api/import/transactions` (multipart `file`: xlsx/xls/csv ≤ 5 MB, maks 5.000 baris data)
  - `dry_run=1` (default): hanya validasi → ringkasan (total, valid, bermasalah, duplikat, akan diimpor, kategori baru, total pemasukan/pengeluaran), error per baris, pratinjau 10 baris pertama. Tidak menulis apa pun.
  - `dry_run=0`: semua-atau-tidak-sama-sekali (transaksi DB). Jika masih ada baris bermasalah → 422. Kategori yang belum ada dibuat otomatis. `skip_duplicates=1` (default) melewati baris yang sudah ada di database.
- Kolom (header tidak case-sensitive, ada alias): **Tanggal**, Jenis, **Kategori**, Deskripsi, Catatan, Metode, **Nominal**.
  - Tanggal: tanggal Excel, `dd/mm/yyyy`, `dd-mm-yyyy`, `yyyy-mm-dd`.
  - Jenis: Pemasukan/Pengeluaran (atau income/expense). Kosong + nominal negatif → pengeluaran.
  - Nominal: angka, boleh negatif (format export), boleh teks "Rp 1.500.000,50".
  - Metode: label atau kode (Cash, Transfer, Debit, Kartu Kredit, E-Wallet, QRIS, Lainnya); kosong → Cash.
  - Baris kosong & baris total dari file export (Total pemasukan / Total pengeluaran / Saldo) dilewati, sehingga **file export dan backup bisa langsung diimpor ulang**.
- Duplikat = tanggal + jenis + kategori + nominal + deskripsi yang sama dengan transaksi yang sudah ada (dihitung per jumlah kemunculan, sehingga dua transaksi kembar yang sah dalam satu file tetap aman).

## 3. Backup otomatis
- `php artisan pidu:backup [--user=]`: per user → xlsx semua transaksi (bisa diimpor ulang) di `storage/app/backups/users/{id}/`; untuk SQLite juga snapshot database via `VACUUM INTO` di `storage/app/backups/database/`. Retensi: 14 file terbaru per folder (`PIDU_BACKUP_KEEP`).
- Dijadwalkan harian 23:00. `npm start` ikut menjalankan `schedule:work` supaya jadwal benar-benar berjalan saat aplikasi dipakai.
- API milik user: `GET /api/backups` (daftar), `POST /api/backups` (buat sekarang), `GET /api/backups/{nama}` (unduh). Nama file divalidasi ketat (tidak ada path traversal), dan user hanya bisa mengakses foldernya sendiri.

## 4. Frontend
Halaman **Impor** (menu baru): unduh template, pilih file, pratinjau, lalu konfirmasi impor. Halaman Export mendapat kartu **Backup** (buat sekarang, daftar, unduh).

## Review
Tes SQLite + MariaDB, lint/build, Chrome (desktop, 360px, dark), data kembali ke seed, README, `report-10.md`, commit, lalu tanya user.
