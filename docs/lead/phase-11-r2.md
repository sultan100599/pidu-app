# PHASE 11 — Putaran 2: kedalaman 3D, eye-catching, perbaikan bug

Executor: **Codex**. Reviewer: Claude. Lanjutan dari putaran 1 (baca `docs/lead/report-11.md`: token, alasan, dan keputusanmu sebelumnya).

## Peran & tujuan
Kamu tetap **front-end developer profesional yang sangat ahli di bidang UI/UX**. Putaran 1 sudah hangat dan rapi, tetapi pemilik produk meminta tampilan yang **se-modern mungkin, eye-catching, estetik, dengan sentuhan 3D**. Hasil putaran 1 dinilai **masih kalem dan 3D-nya terlalu tipis**. Tugas putaran ini: **naikkan kedalaman dan daya tarik visual**, tetap di dalam arah `DESIGN.md` dan aturan antislop (mode "selama pengerjaan"; baca ulang `.claude/skills/antislop/SKILL.md`, `antislop-ui`, `antislop-human`, `antislop-layoutmobile`).

## Hasil review Claude atas putaran 1 (dicek di Chrome)
**Pertahankan:** palet dan token (`tokens.css`), font (Georgia untuk judul, sistem untuk isi), motif lipatan dompet/panel peach, kartu Saldo sebagai fokus, tombol utama yang turun saat ditekan, dark mode cokelat hangat, `accessibleColor`, grafik ikut palet, reduced-motion. Mobile 360px lolos (tanpa overflow, target sentuh ≥ 44px), console bersih.

**Kurang:** hampir semua elemen selain kartu Saldo dan tombol utama masih datar. Keputusanmu untuk tidak memakai tilt dicatat, tetapi pemilik **secara eksplisit** meminta sentuhan 3D, jadi putaran ini menambahkannya dengan dosis yang dijaga.

## A. Bug (wajib)
1. **Dropdown terpotong ke kanan (dilaporkan pemilik).** Menu pengguna di Topbar (berisi "Keluar") dan menu Export di halaman Transaksi memakai `.dropdown-menu-end`. Tanpa Popper (Bootstrap JS memang tidak dipakai), class itu tidak berefek, sehingga menu menempel `left: 0` ke tombol dan memanjang ke kanan. Terukur di viewport 1920px: menu x=1829→1989, **keluar layar 69px dan membuat scroll horizontal**. Perbaiki di CSS/komponen sehingga menu yang dikontrol React rata kanan terhadap tombolnya (`right: 0; left: auto` atau setara) dan **selalu berada di dalam viewport** pada 360px, 1440px, dan 1920px, baik di light maupun dark mode.
2. **Header tabel sortable tidak konsisten.** Di tabel Transaksi, header "Tanggal" dan "Nominal" (tombol sort) tampil lebih besar dari header lain, dan header "Nominal" tidak lagi rata kanan padahal nilainya rata kanan. Samakan ukuran/gaya dengan header lain dan ratakan kanan "Nominal".

## B. Kedalaman 3D & eye-catching (CSS saja)
Setiap poin wajib punya alasan satu baris di report (R-31). Jangan membuat elemen yang tidak bisa diklik terlihat bisa diklik.

1. **Tilt 3D pada kartu Saldo** (Dashboard, dan di mana `SummaryCards` menampilkan Saldo): kartu miring mengikuti posisi pointer dengan `perspective` + `rotateX/rotateY` kecil (maks ± 6°), plus kilau cahaya halus yang ikut posisi pointer. Hanya elemen ini yang memakai kilau (dosis R-13). **Nonaktif** pada `(hover: none)`/`(pointer: coarse)` dan `prefers-reduced-motion`. Kembali datar dengan transisi saat pointer keluar. Angka harus tetap tajam dan terbaca (hindari blur teks akibat transform; uji di kedua tema). Implementasi di React/CSS biasa (tanpa library), hemat render (mis. `requestAnimationFrame` + CSS variables, bukan re-render state setiap mousemove).
2. **Ubin ikon timbul** sebagai motif identitas: ikon di kartu ringkasan, `CategoryIcon`/`CategoryBadge`, dan ikon menu sidebar tampil di dalam "ubin" kecil yang timbul (sorotan di atas + tepi bawah yang lebih gelap, seperti koin atau tombol keyboard). Satu gaya yang konsisten di seluruh aplikasi.
3. **Menu aktif sidebar timbul**: item aktif tampak seperti tombol yang naik (tepi bawah + bayangan pendek). Hover pada item lain memberi sedikit angkat, dan ditekan terasa turun.
4. **Kepala Dashboard lebih menonjol**: jadikan kartu Saldo **titik fokus utama** yang lebih besar dari tiga kartu lain (mis. melebar dua kolom di desktop), dengan 1–2 lapisan "kertas/lipatan dompet" di belakangnya (pseudo-element, bukan gambar) agar terasa bertumpuk. Tiga kartu ringkasan lain tetap datar atau cukup elevasi 1 supaya Saldo menonjol. Di HP tetap rapi tanpa overflow.
5. **Angkat saat hover hanya untuk elemen yang bisa diklik**: baris tabel laporan yang bisa diklik, kartu/daftar yang bisa diklik (mis. item kategori di breakdown dashboard, sel kalender, kartu budget beserta tombolnya). Terangkat 2–4px dengan bayangan berlapis. Elemen yang tidak interaktif jangan diberi efek hover.
6. **Progress bar budget bertekstur**: track tampak cekung (inset) dan isian tampak timbul, sehingga status aman/hampir habis/terlampaui terasa seperti wadah terisi.
7. **Login/Register**: panel auth diberi 1–2 lembar "kertas" di belakangnya (pseudo-element) agar bertumpuk seperti dompet/catatan. Boleh tilt sangat halus, aturan nonaktifnya sama seperti poin 1.

Batasan dosis: tanpa glassmorphism, tanpa glow di banyak elemen, tanpa animasi berulang tanpa henti, tanpa library 3D, dan tanpa aset/gambar/font baru.

## Standar (sama dengan putaran 1)
- Kontras WCAG AA di kedua tema. Cek ulang pasangan warna baru dengan `python frontend/scripts/check-contrast.py` / `contrast-check.py`, termasuk teks di atas kilau Saldo pada titik paling terang.
- Fokus keyboard terlihat, Escape menutup dropdown/modal, `aria-*` dipertahankan.
- Mobile 360px: tanpa scroll horizontal, target sentuh ≥ 44px. Efek tilt/hover tidak aktif di layar sentuh.
- Semua fitur tetap berfungsi. **Hanya `frontend/`.** Jangan ubah backend, API, route, atau query URL.

## Verifikasi
```
npm --prefix frontend run lint
npm --prefix frontend run build
```
Keduanya lolos tanpa warning; catat ukuran bundle. **Jangan menjalankan atau mematikan server di port 8001/8010. Jangan commit.** Tulis jujur "belum dicek di browser".

## Report
Tambahkan bagian baru **"## Putaran 2"** di akhir `docs/lead/report-11.md` (jangan hapus isi putaran 1):
1. Perbaikan bug A1–A2 (penyebab + cara perbaikan).
2. Setiap efek B1–B7: di mana dipasang, alasan satu baris, kapan nonaktif.
3. Token/nilai baru (bayangan, ubin, tilt) + hasil cek kontras pasangan baru.
4. File yang diubah/dibuat, output lint & build, ukuran bundle.
5. Delivery Gate antislop diperbarui (R-35: PENDING, click-through oleh Claude).
