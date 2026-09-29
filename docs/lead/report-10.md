# Report Phase 10 — Impor Excel, backup otomatis, uji MariaDB

Tanggal: 2026-09-29 · Executor & reviewer: Claude. Aplikasi **tetap SQLite** (keputusan user); MariaDB hanya dipakai sementara untuk menguji kompatibilitas.

## Ringkasan
- **Impor** transaksi dari xlsx/xls/csv: template, pemeriksaan dulu (dry run), error per baris, deteksi duplikat, kategori baru otomatis, commit semua-atau-tidak-sama-sekali. File Export/Backup bisa diimpor ulang.
- **Backup otomatis** harian: xlsx semua transaksi per user + snapshot SQLite (`VACUUM INTO`), retensi 14, serta API/halaman untuk backup manual dan unduh.
- **Kompatibilitas MySQL/MariaDB terbukti**: 76/76 tes lolos di SQLite **dan** MariaDB 10.4.32; angka laporan data demo identik di kedua driver.
- Tes: 59 → **76** (9 impor + 8 backup). Lint 0 warning, build sukses, `npm audit` & `composer audit` bersih.

## Uji MariaDB
- `my.ini` XAMPP user menunjuk ke `C:\xampp\...` padahal instalasi di `C:\xampp82` → **tidak diubah**. MariaDB XAMPP dijalankan dengan datadir sementara baru (folder Temp, port 3307); setelah selesai dimatikan dan foldernya dihapus. `.env` tidak diubah (override lewat environment variable).
- **Bug portabilitas ditemukan & diperbaiki:** `orderBy('type')` pada kolom `ENUM('income','expense')`. SQLite mengurutkan alfabetis (expense dulu), MySQL mengurutkan sesuai definisi ENUM (income dulu), sehingga urutan kategori, detail hari, dan sheet Kategori berbeda antar database. Solusinya `App\Support\TypeOrder` (ekspresi `CASE`), dipakai di 3 tempat.
- Seed di MariaDB lalu bandingkan dengan SQLite: dashboard Sep 2026, top kategori, 5 budget beserta status, tahunan, mingguan, bulanan, kalender, dan total kategori → **identik**.

## Impor
**Backend:** `ImportController` (`GET /api/import/template`, `POST /api/import/transactions`, throttle 10/menit), `ImportRequest` (xlsx/xls/csv, ≤ 5 MB), `Services/Import/TransactionImportService`, `Imports/RawRowsImport`, `Exports/ImportTemplateExport`.
- Header fleksibel (alias Indonesia/Inggris, tidak case-sensitive); kolom wajib Tanggal, Kategori, Nominal.
- Tanggal: serial Excel, `dd/mm/yyyy`, `dd-mm-yyyy`, `yyyy-mm-dd`, `dd.mm.yyyy`. Tanggal yang "meluber" (31/02) ditolak.
- Nominal: angka atau teks "Rp 1.500.000,50"; negatif diperbolehkan (format export); jenis kosong + negatif = pengeluaran.
- Metode: label atau kode (+ alias "tunai", "kredit", …); kosong = Cash.
- Baris kosong dan baris total dari file export dilewati.
- Duplikat (tanggal + jenis + kategori + nominal + deskripsi) dihitung per kemunculan terhadap data yang sudah ada.
- Batas 5.000 baris. Maksimal 100 error ditampilkan; pratinjau 10 baris.

**Bug yang ditemukan tes & diperbaiki**
1. **CSV "12.500" terbaca 12,5.** Reader PhpSpreadsheet menebak tipe sebelum parser melihatnya, sehingga transaksi Rp 12.500 bisa masuk sebagai Rp 12,50 **tanpa error**. CSV sekarang dibaca sebagai teks mentah (`RawRowsImport`, hanya untuk CSV; xlsx tetap memakai tipe sel).
2. Carbon 3 melempar exception (bukan `false`) saat format tanggal tidak cocok, sehingga parsing tanggal berhenti di format pertama → sekarang dicoba per format dengan try/catch.

**Frontend:** menu **Impor** (`/import`): unduh template → pilih file → hasil pemeriksaan (baris data, valid, bermasalah, duplikat, total pemasukan/pengeluaran, kategori baru) → tabel error per baris / pratinjau → opsi "Lewati duplikat" → konfirmasi → toast + link ke Transaksi.

## Backup
**Backend:** `config/pidu.php` (`PIDU_BACKUP_PATH/KEEP/TIME`), `BackupService`, command `pidu:backup [--user=]`, jadwal `dailyAt(23:00)->withoutOverlapping()`, `BackupController` (`GET/POST /api/backups`, `GET /api/backups/{nama}`).
- xlsx semua transaksi (urut tanggal naik) per user; snapshot SQLite dengan `VACUUM INTO` (konsisten walau app sedang dipakai; divalidasi `integrity_check: ok`, 696 transaksi). Di MySQL snapshot dilewati (gunakan `mysqldump`).
- Keamanan: nama file dicocokkan dengan regex ketat di route dan service; user hanya bisa mengakses folder `users/{id}` miliknya (file user lain → 404; path traversal → 404). Folder backup ada di bawah `storage/app/*` (ter-ignore Git).
- `npm start` sekarang juga menjalankan `schedule:work` (proses `JOB`, output disembunyikan), sehingga backup harian dan pembersihan token benar-benar berjalan selama app dipakai.

**Frontend:** menu "Export" → **"Export & Backup"**; kartu Backup: "Backup sekarang", daftar (waktu, nama, ukuran, badge "terbaru"), unduh, dan petunjuk pemulihan lewat halaman Impor.

## Verifikasi di Chrome (memakai `npm start` yang sedang dijalankan user)
| Cek | Hasil |
|---|---|
| Unduh template | `pidu-template-impor.xlsx` (8,8 KB) |
| File dengan baris salah | Baris 3: 3 pesan (tanggal, nominal, metode); tombol Impor tidak muncul |
| File valid (4 baris, 1 sama dengan seed) | Valid 4, duplikat 1, kategori baru "ZZIMP Parkir", tombol "Impor 3 transaksi" |
| Impor | "3 transaksi berhasil diimpor. 1 duplikat dilewati. 1 kategori baru dibuat."; data tersimpan dengan metode & catatan benar |
| Unggah ulang file yang sama | Duplikat 4, tombol "Tidak ada yang perlu diimpor" (disabled) |
| Backup sekarang + unduh | Muncul di daftar dengan badge terbaru; file 25 KB terunduh |
| 360px + dark | Tidak ada horizontal scroll; tabel pratinjau dalam `table-responsive` |
| Setelah uji | Transaksi/kategori ZZIMP dihapus, folder backup uji dihapus → 2 user / 696 / 44 / 5 |

**Perbaikan kecil selama review:** nominal di baris duplikat yang dilewati tidak lagi berwarna merah/hijau; tombol Unduh backup memakai `outline-primary` (`outline-secondary` terlihat seperti nonaktif di dark mode).

## Catatan / insiden
- Saat membersihkan, token login yang dibuat dalam 1 jam terakhir ikut terhapus (2 token; 1 milik sesi uji saya, 1 kemungkinan milik sesi browser user). User cukup login ulang; data tidak terpengaruh. Pelajaran: hapus token uji berdasarkan ID, bukan rentang waktu.
- `npm start` yang sedang berjalan milik user dimulai sebelum scheduler ditambahkan → perlu di-restart agar backup otomatis aktif.
