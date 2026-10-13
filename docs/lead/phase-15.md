# Phase 15: Perbaikan hasil review QA/UX (13 Okt 2026, Claude)

Sumber: review usability 13 Okt 2026 (target: pelajar/mahasiswa, ibu rumah tangga, UMKM, karyawan, orang tua pelaku usaha). User meminta semua 21 temuan diperbaiki. Antislop dipakai sebagai audit **setelah** selesai. Impeccable 4.5.2 terpasang sebagai alat bantu, tanpa hook, tanpa `document`.

Keputusan user: Phase 14 di-commit dulu (`34bbd96`); lupa password memakai email Gmail (SMTP).

## Kritis
1. **Saldo nyata.** Kolom `users.opening_balance` (nullable = belum ditanya). Dashboard menampilkan "Uang kamu sekarang" = saldo awal + semua pemasukan − semua pengeluaran s.d. hari ini. Ringkasan per periode berganti nama "Selisih". Pengguna baru ditanya saldo awal (bisa dilewati). Bisa diubah di halaman Akun.
2. **Password.** Lupa password (email via Gmail SMTP, link ke `/reset-password` di frontend, pesan sama untuk email terdaftar/tidak). Ganti password di halaman Akun (butuh password lama).
3. **Satu menu Laporan.** Sidebar & bottom nav: satu item "Laporan"; tab Harian/Mingguan/Bulanan/Tahunan/Kalender di halaman laporan.

## Sedang
4. Kategori default baru: pemasukan "Hasil Jualan", "Uang Saku", "Uang Bulanan"; pengeluaran "Modal Usaha". Ditambahkan juga ke user lama (hanya yang belum punya nama itu). Filter kategori dikelompokkan Pengeluaran/Pemasukan.
5. Transaksi di HP: tombol Tambah disembunyikan (sudah ada Catat), ringkasan dipadatkan.
6. Form transaksi: Nominal paling atas setelah jenis, "Simpan" satu-satunya tombol utama, Metode & Catatan masuk "Detail lain". `inputmode="numeric"`.
7. Teks pembanding kosong: "Bulan lalu belum ada data" bukan "belum ada data September 2026".
8. Rupiah tanpa sen di semua tampilan, termasuk animasi.
9. Hapus transaksi tanpa dialog konfirmasi; andalkan Batalkan.
10. Budget: "Salin bulan lalu" hanya tampil jika bulan lalu punya budget; form budget tanpa kolom Bulan/Tahun.
11. Export: "Export semua" digabung ke kartu export; chip "Sheet" jadi teks biasa.
12. Kategori: "Tampilkan nonaktif" default mati; tombol hapus yang tidak bisa dipakai menjelaskan alasannya.
13. Pesan server mati/502: ajakan coba lagi.
14. Impor: tombol pilih file berbahasa aplikasi; petunjuk jadi poin.

## Rendah
15. Label bahasa IN → ID.
16. Judul halaman tidak ganda (topbar vs H1).
17. Header tabel sejajar; "Semua kategori" tidak terpotong.
18. Sisa budget negatif ditulis "lebih Rp X", nominal tidak terpotong baris.
19. Satu teks loading saja.
20. Notifikasi tidak menutupi tombol topbar.
21. "Rasio pengeluaran" → bahasa awam; register tanpa kolom Konfirmasi Password.

Semua teks baru wajib id/en/su (`node frontend/scripts/check-locales.mjs`), tes backend & lint wajib lolos, click-through desktop + HP dua tema.
