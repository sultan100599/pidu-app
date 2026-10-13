# Laporan Phase 16: Kaca buram melayang (13 Okt 2026, Claude)

Permintaan user: dashboard "frosted glass", sidebar kiri dan bar atas melayang seperti template v0 *Frosted Glass UI - CRM Dashboard*. Keputusan user: kaca di semua panel (pengecualian antislop R-10, dicatat di `DESIGN.md`), latar foto washitsu, Phase 15 di-commit dulu (`7baf4b9`).

## Perubahan
- `frontend/src/styles/glass.css` (dimuat paling akhir): foto ruang washitsu siang/malam + peredup 55% di belakang aplikasi; sidebar, bar atas, bottom nav HP, kartu, dan pita kecil (tab laporan, petunjuk, pagination) jadi kaca buram 72% dengan blur.
- Semua panel melayang dengan satu jarak (12px desktop, 10px HP): tepi kiri/kanan bar atas = konten, jarak sidebar-bar atas-konten sama.
- Desktop: judul, subjudul, dan aksi halaman pindah ke bar atas lewat portal (`PageHeader` + `TopbarSlots` context); HP: tetap di halaman dalam panel kaca.
- Sidebar diperkecil menampilkan logo Pidu (panah "perbesar" saat hover/fokus); label tombol "Perkecil menu"/"Perbesar menu".
- Cadangan: panel padat bila browser tanpa `backdrop-filter` atau `prefers-reduced-transparency`; blur dikurangi di HP. Modal & dropdown tetap padat.

## Bukti
- Kontras terburuk (foto hitam di tema terang / putih di tema gelap): teks sekunder 4,59:1 dan 5,52:1.
- Pendeteksi teks lepas: 0 teks langsung di atas foto di 10 halaman.
- Simulasi HP (CPU 6x lebih lambat): rata-rata 60fps saat scroll, 2 frame >33ms (tanpa blur: 0). Belum diuji di HP sungguhan (blur dikerjakan GPU).
- Lint bersih, build sukses, check-locales PASS, detector Impeccable 0 temuan.
