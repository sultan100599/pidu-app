# Phase 19: Rapikan & lengkapi

Tanggal mulai: 14 Oktober 2026 · Pelaksana: Claude · Antislop: selama dikerjakan (pilihan user) · Pola kerja: `CLAUDE.md` "Pidu workflow"

## Keputusan user
- Istilah diganti semua: Dashboard → Ringkasan, Budget → Anggaran, Export → Unduh, Impor → Unggah, Cash → Tunai, Export & Backup → Unduh & Cadangan.
- Font judul Fraunces diganti. User memilih dari 3 contoh yang ditunjukkan dulu.
- Audit Phase 18 (`anti-slop/audit-002-2026-10-14.md`) no. 1–3 ikut dikerjakan.
- Jam pengingat diatur sendiri di halaman Akun (termasuk mati).

## Pekerjaan
1. **Font judul**: 3 contoh di luar daftar font "bawaan AI" impeccable; dipasang lewat `@fontsource` (tanpa CDN), alasan dicatat di `DESIGN.md`.
2. **Ganti istilah** di teks id (en/su mengikuti artinya), judul halaman, menu, judul tab browser, nama file unduhan bila memuat istilah lama, tes e2e.
3. **Audit-001 no. 3–7**:
   - Kotak Filter di HP jadi tombol saja.
   - Kartu angka kecil dashboard dua kolom di HP.
   - Placeholder "0" Nominal lebih redup.
   - Link "Ubah" di kartu saldo setinggi 44px.
   - Jarak pilihan di kartu Unduh data mengikuti skala.
4. **Audit-002 no. 1–3**:
   - Hapus/Arsipkan dompet hanya muncul bila bisa; selain itu ada alasan.
   - Catatan ikut tersimpan di transaksi rutin (kolom baru).
   - Panel Anggaran di dashboard diberi keterangan bila saringan Pribadi/Usaha aktif.
5. **Pengingat**: kolom `users.reminder_hour` (null = mati, bawaan 17); pilihan jam di halaman Akun; banner memakai jam itu.
6. **Akun**: "Keluar dari semua perangkat" (hapus semua token) dan "Hapus akun" (konfirmasi password, hapus berurutan: transaksi, pindahan, rutin, anggaran, dompet, kategori, token, user).
7. **Data demo** diperpanjang sampai bulan berjalan.
8. **Aksesibilitas**: Lighthouse di halaman utama, navigasi keyboard penuh, pohon aksesibilitas (pengganti pembaca layar).

## Pemeriksaan
- Tes backend baru (pengingat, keluar semua perangkat, hapus akun, catatan transaksi rutin), e2e disesuaikan istilah baru.
- Cek di Anbo: desktop, 360px, terang, gelap.
- Audit improve-ui di subagent terpisah untuk halaman yang disentuh; detector impeccable sekali di akhir.
