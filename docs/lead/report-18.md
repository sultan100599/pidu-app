# Report Phase 18: Dompet, Usaha/Pribadi, transaksi rutin, pengingat

Tanggal: 14 Oktober 2026 · Dikerjakan: Claude · Antislop: diaudit di akhir (pilihan user)

## Yang dibuat

### Backend
- Tabel baru `wallets` (nama, jenis `cash|bank|e_wallet`, keperluan `personal|business`, saldo awal, aktif), `transfers`, `recurring_transactions`; kolom `transactions.wallet_id` dan `transactions.recurring_transaction_id`.
- Migrasi data: tiap user mendapat "Dompet Utama" dengan saldo awal lamanya; semua transaksi lama masuk ke dompet itu. Diuji di salinan database (naik, turun, naik lagi) sebelum dijalankan di database asli; database asli dicadangkan ke `backend/storage/app/pre-phase18/`.
- `WalletService`: dompet utama (dompet aktif tertua), saldo per dompet per hari ini (saldo awal + pemasukan − pengeluaran + uang masuk − uang keluar, tanggal masa depan belum dihitung), ringkasan untuk dashboard.
- `RecurringService` + perintah `pidu:recurring` (dijadwalkan tiap jam): membuat transaksi yang jatuh tempo termasuk yang terlewat, jadwal ke-n dihitung dari tanggal mulai sehingga tanggal 31 tidak bergeser, jeda lalu jalan lagi melewati jadwal selama jeda.
- API: `wallets` (CRUD + arsip), `transfers` (daftar, tambah, hapus), `recurring` (CRUD + jeda). Transaksi menerima `wallet_id` (tanpa itu masuk dompet utama). Saringan `wallet_id` dan `purpose` di daftar transaksi, dashboard, semua laporan, dan export.
- Pertanyaan saldo awal di dashboard sekarang mengisi saldo awal Dompet Utama.
- Kategori yang dipakai transaksi rutin tidak bisa dihapus.
- Excel export/backup: kolom Dompet. Impor: kolom Dompet opsional.
- Teks server id/en/su untuk semua pesan baru.

### Frontend
- Halaman **Dompet** (`/wallets`, menu baru): kartu per dompet dengan saldo, total semua dompet + Pribadi/Usaha, tambah/ubah, pindah uang, arsip/pakai lagi, hapus, riwayat pindah uang.
- Halaman **Transaksi rutin** (`/recurring`, tombol "Rutin" di halaman Transaksi): daftar, tambah, ubah, jeda/jalankan lagi, hapus.
- Form Catat: pilihan Dompet (kalau lebih dari satu) dan "Ulangi otomatis" di Detail lain.
- Daftar transaksi: saringan Dompet, nama dompet di baris, ikon transaksi rutin.
- Dashboard & laporan: tombol Semua/Pribadi/Usaha (terbawa saat pindah tab laporan); kartu "Uang kamu sekarang" merinci saldo per dompet.
- Banner pengingat di dashboard (mulai jam 17.00, kalau hari itu belum ada catatan).
- Halaman Akun: saldo awal dipindah ke halaman Dompet.
- 78 teks baru di `frontend/src/i18n/phase18.js` (id/en/su).

## Pemeriksaan
- Backend: 108 tes lolos (baru `WalletTest` 7, `RecurringTest` 5, impor kolom Dompet 1; `ExportTest` disesuaikan kolom baru).
- E2E Playwright: 13 lolos (baru `wallets.spec.js`: dompet usaha + pindah uang + saringan; Ulangi tiap bulan; pengingat sore). Tes menu disesuaikan (8 menu).
- `oxlint` bersih, `vite build` sukses, `check-locales` lolos (687 kunci).
- Chrome dengan akun uji: saldo tiap dompet cocok dengan hitungan manual; saringan Usaha/Pribadi benar di dashboard dan Rekap Harian; form Ulangi tiap minggu membuat transaksi hari ini + jadwal berikutnya; mode terang/gelap; HP 360px tanpa geser samping. Akun uji dihapus lagi.

## Catatan
- Isi Catatan tidak ikut tersimpan bila "Ulangi otomatis" dipilih (audit no. 2).
- Panel Budget di dashboard tidak ikut saringan Pribadi/Usaha (audit no. 3).
- Hapus user langsung akan gagal karena relasi dompet/kategori; penting untuk fitur hapus akun di Phase 19.
- Teks Sunda baru perlu dibaca penutur asli.

## Perbaikan setelah review user (14 Okt)
- Pilihan periode di topbar (Dashboard, Rekap Harian, Rekap Mingguan): label "Periode" di atas diganti ikon kalender di dalam kotak (label tetap dibaca pembaca layar), tinggi/sudut/latar sama dengan tombol bahasa, tema, akun; mode Kustom satu baris "tanggal – tanggal". Antislop: selama dikerjakan.
- Halaman Masuk/Daftar: kartu dan tombol bahasa/tema memakai kaca buram yang sama dengan panel aplikasi. Kaca tema terang dibuat lebih padat (86%) karena halaman ini tanpa lapisan peredup; teks abu-abu terukur 4,8:1 di HP, 5,0:1 di desktop.
- E2E 13 lolos setelah perubahan.
