# Report Phase 11: Redesign UI Pidu-App

Tanggal: 29 September 2026. Executor: Codex. Reviewer berikutnya: Claude.

Implementasi frontend selesai, lint dan build lulus. **Belum dicek di browser.** Skor Lighthouse, hasil visual, scroll, keyboard nyata, dan console browser belum diukur ulang. **R-35: PENDING: click-through oleh Claude di Chrome.**

Tidak ada commit. Tidak menjalankan atau mematikan server di port 8001/8010. Backend, API, route, nama field, query URL, autentikasi, dan dependensi tetap. Build hanya menghasilkan output production di `frontend/dist`.

## 1. Design Read

Reading this as: aplikasi pencatat keuangan pribadi untuk individu, berbahasa visual hangat dan ramah dengan kedalaman CSS, dial **ENERGY 2 / RHYTHM 2 / MOTION 2**.

Dibaca: `DESIGN.md`, `AGENTS.md`, keenam `SKILL.md` antislop (inti, UI, human, layoutmobile, copywriting, code), `contrast-check.py`, `CATATAN.md`, `README.md`, brief Phase 11, serta kode frontend. Antislop diterapkan SELAMA pengerjaan sesuai keputusan pemilik; tidak meminta keputusan itu lagi.

| Dial | Penerapan |
|---|---|
| ENERGY 2 | Krem sebagai kanvas, terakota untuk aksi, peach untuk saldo dan panel fokus; judul serif yang lebih besar memberi karakter pada aplikasi keuangan pribadi. |
| RHYTHM 2 | Header, formulir, dan tabel konsisten; halaman auth memakai bentuk seperti lipatan dompet, statistik sekunder dashboard dibuat datar, saldo memiliki kedalaman lebih kuat. |
| MOTION 2 | Tombol utama turun 2px saat ditekan, panel dialog masuk 180ms, shell konten muncul 180ms, transisi kontrol 160ms, grafik 180ms. Reduced motion menonaktifkan gerak CSS dan animasi Chart.js. |

Motif identitas: panel peach bersudut membulat, dengan satu sudut lebih rapat pada kartu saldo dan tepi melengkung pada panel auth. Bentuk ini mengingatkan pada dompet yang dipakai menyimpan catatan uang. Logo tetap teks Pidu dan ikon `bi-wallet2`.

## 2. Design token dan alasan

Token berada di `frontend/src/styles/tokens.css`; `components.css` menghubungkan token ke komponen Bootstrap dan toast, sedangkan `app.css` mengatur susunan halaman.

### Warna

| Token `--pidu-*` | Light | Dark | Alasan |
|---|---|---|---|
| canvas | #f7f1e8 | #211c19 | Kanvas krem/cokelat memberi suasana hangat tanpa memakai putih atau hitam penuh. |
| surface | #fffaf4 | #2d2521 | Permukaan formulir dan tabel sedikit terangkat dari kanvas agar batas kelompok terbaca. |
| recess | #efe4d7 | #3a3029 | Area filter, header tabel, dan status sekunder tetap tenang. |
| peach | #f6d8c5 | #4a3329 | Menandai saldo, form masuk, total budget, dan export tahunan sebagai fokus terkait uang. |
| ink | #352b26 | #f7ecdf | Teks utama terbaca pada seluruh permukaan. |
| muted | #6d5b50 | #cebaaa | Teks sekunder, placeholder, dan label grafik tetap memenuhi 4.5:1. |
| accent | #994b32 | #f1ad88 | Terakota menandai aksi utama dan navigasi aktif. |
| accent-hover | #7c3824 | #ffc6a4 | Perubahan nada menunjukkan respons kontrol tanpa glow. |
| income | #306747 | #9dcea9 | Hijau membedakan pemasukan, disertai label atau tanda tambah. |
| expense | #a13d32 | #ffa99a | Merah bata membedakan pengeluaran, disertai label atau tanda minus. |
| warning | #805b13 | #e6c378 | Oker untuk status budget hampir habis, selalu disertai teks. |
| on-color | #fffaf4 | #211c19 | Teks tombol/badge penuh dibalik menurut tema agar kontras terjaga. |
| line | #ddcbbd | #58463a | Garis dekoratif membatasi kartu dan grid grafik tanpa memenuhi layar dengan tepi tebal. |
| control-line | #8c7362 | #a58b78 | Batas input, kalender, dan pagination memenuhi kontras nonteks 3:1. |
| focus | #994b32 | #f1ad88 | Outline keyboard 3px terbaca di seluruh permukaan. |
| check-fill | #994b32 | #994b32 | Mempertahankan keterbacaan centang putih bawaan Bootstrap pada kedua tema. |

`--bs-body-*`, `--bs-secondary-*`, `--bs-tertiary-*`, `--bs-primary/success/danger/warning/info`, varian RGB, link, subtle, border, valid/invalid, radius, dan font dipetakan ke token di atas. Info memakai aksen terakota; tidak menambah keluarga biru. Warna kategori adalah data pilihan pengguna, bukan perluasan palet merek.

### Bentuk, tipografi, spasi, elevasi

| Keputusan | Nilai light / dark | Alasan |
|---|---|---|
| Font isi | Segoe UI, system-ui, fallback sistem | Bentuk familiar untuk angka dan formulir; tidak menambah file font atau permintaan CDN. |
| Font judul halaman/auth | Georgia, Times New Roman, serif | Memberi karakter catatan pribadi yang hangat; isi data tetap sans serif. |
| Ukuran judul halaman | clamp(1.8rem, 2.5vw, 2.5rem) | Judul menjadi titik orientasi tanpa mendominasi layar HP. |
| Angka ringkasan | clamp(1rem, 1.5vw, 1.35rem), tabular-nums | Nilai uang mudah dibandingkan dan boleh membungkus tanpa dipotong. |
| Radius | 8px badge, 12px kontrol, 20px kartu, 28px auth/modal | Membedakan status, kontrol, dan permukaan; tidak semua berbentuk pil. |
| Skala spasi | 4, 8, 12, 16, 24, 32px dalam rem | Jarak rapat menghubungkan label dengan input; jarak besar memisahkan bagian. |
| Konten | maksimal 1320px; padding HP 16px, desktop 32px | Memberi ruang bagi tabel pada desktop dan mempertahankan lebar baca di HP. |
| Elevasi dasar | Kartu biasa berbatas, tanpa bayangan | Daftar dan tabel menjadi landasan visual. |
| Elevasi 1 | 0 2px 0 #ddcbbd / #15110f | Total budget dan export tahunan tampak seperti lembar yang ditumpuk. |
| Elevasi 2 | 0 5px 0 + 0 12px 24px, opacity 9% / 18% | Saldo, auth, dan 404 diberi kedalaman sebagai fokus halaman. |
| Elevasi 3 | 0 8px 16px + 0 24px 56px, opacity 12/16% atau 24/32% | Dialog, dropdown, dan toast terlihat berada di depan konten. |
| Tombol utama | Highlight inset 1px, tepi 3px; turun 2px saat ditekan | Memberi umpan balik fisik pada aksi simpan/masuk/tambah. |
| Motion | 160ms kontrol, 180ms panel/grafik | Membantu mengenali respons dan perpindahan perhatian. |
| Tilt | Tidak dipakai | Angka saldo lebih nyaman dibaca pada bidang stabil; dosis 3D dipenuhi elevasi dan tombol. |
| Ikon | Bootstrap Icons yang sudah tersedia | Dompet, arus uang, kalender, kategori, upload/download mengikuti fungsi yang ada. |
| Aset | Tidak menambah aset | Identitas dibentuk melalui CSS dan tipografi sesuai batas brief. |

CSS gradient hanya dipakai sebagai bentuk track/thumb switch yang sudah ada. Tidak ada gradient latar dekoratif, glassmorphism, glow, animasi dekoratif berulang, library 3D, atau font tambahan.

## 3. Hasil kontras

Perintah reproduksi:

```text
python frontend/scripts/check-contrast.py
```

Script membaca token dari CSS, lalu memanggil checker yang diminta untuk **setiap pasangan**. Script tidak mengubah CSS atau source.

Pemetaan penggunaan:
- `ink`: teks biasa, tabel, input, label, dropdown, tooltip grafik.
- `muted`: secondary/tertiary text, placeholder, bantuan form, disabled state, sumbu/legenda grafik.
- `accent/accent-hover`: link, tombol outline, navigasi dan hover.
- `income/expense/warning`: nominal, validasi, status, alert, grafik.
- `on-color`: teks pada tombol penuh, tab aktif, badge dan status penuh.
- Empat latar mencakup kanvas, kartu/modal/toast, filter/tabel hover, panel peach.
- Border dekoratif `line` tidak dipakai sebagai teks atau satu-satunya penanda kontrol.
- Opacity 50% pada konten saat refetch diganti teks warna penuh; `aria-busy`, spinner, dan indikator pembaruan tetap tersedia.
- Thumb switch memakai pasangan warna yang sama secara terbalik; rasio kontras simetris.

### Output checker

Perintah tiap pasangan: python .claude/skills/antislop-human/contrast-check.py "#fg" "#bg"

| Tema | Token depan / belakang | Hex depan / belakang | Rasio | Ambang | Hasil |
|---|---|---|---|---|---|
| light | ink / canvas | #352b26 / #f7f1e8 | 12.26:1 | 4.5:1 | PASS |
| light | ink / surface | #352b26 / #fffaf4 | 13.27:1 | 4.5:1 | PASS |
| light | ink / recess | #352b26 / #efe4d7 | 10.98:1 | 4.5:1 | PASS |
| light | ink / peach | #352b26 / #f6d8c5 | 10.20:1 | 4.5:1 | PASS |
| light | muted / canvas | #6d5b50 / #f7f1e8 | 5.73:1 | 4.5:1 | PASS |
| light | muted / surface | #6d5b50 / #fffaf4 | 6.20:1 | 4.5:1 | PASS |
| light | muted / recess | #6d5b50 / #efe4d7 | 5.13:1 | 4.5:1 | PASS |
| light | muted / peach | #6d5b50 / #f6d8c5 | 4.77:1 | 4.5:1 | PASS |
| light | accent / canvas | #994b32 / #f7f1e8 | 5.49:1 | 4.5:1 | PASS |
| light | accent / surface | #994b32 / #fffaf4 | 5.94:1 | 4.5:1 | PASS |
| light | accent / recess | #994b32 / #efe4d7 | 4.92:1 | 4.5:1 | PASS |
| light | accent / peach | #994b32 / #f6d8c5 | 4.56:1 | 4.5:1 | PASS |
| light | accent-hover / canvas | #7c3824 / #f7f1e8 | 7.64:1 | 4.5:1 | PASS |
| light | accent-hover / surface | #7c3824 / #fffaf4 | 8.26:1 | 4.5:1 | PASS |
| light | accent-hover / recess | #7c3824 / #efe4d7 | 6.84:1 | 4.5:1 | PASS |
| light | accent-hover / peach | #7c3824 / #f6d8c5 | 6.35:1 | 4.5:1 | PASS |
| light | income / canvas | #306747 / #f7f1e8 | 5.92:1 | 4.5:1 | PASS |
| light | income / surface | #306747 / #fffaf4 | 6.41:1 | 4.5:1 | PASS |
| light | income / recess | #306747 / #efe4d7 | 5.31:1 | 4.5:1 | PASS |
| light | income / peach | #306747 / #f6d8c5 | 4.93:1 | 4.5:1 | PASS |
| light | expense / canvas | #a13d32 / #f7f1e8 | 5.79:1 | 4.5:1 | PASS |
| light | expense / surface | #a13d32 / #fffaf4 | 6.27:1 | 4.5:1 | PASS |
| light | expense / recess | #a13d32 / #efe4d7 | 5.19:1 | 4.5:1 | PASS |
| light | expense / peach | #a13d32 / #f6d8c5 | 4.81:1 | 4.5:1 | PASS |
| light | warning / canvas | #805b13 / #f7f1e8 | 5.46:1 | 4.5:1 | PASS |
| light | warning / surface | #805b13 / #fffaf4 | 5.91:1 | 4.5:1 | PASS |
| light | warning / recess | #805b13 / #efe4d7 | 4.89:1 | 4.5:1 | PASS |
| light | warning / peach | #805b13 / #f6d8c5 | 4.54:1 | 4.5:1 | PASS |
| light | on-color / ink | #fffaf4 / #352b26 | 13.27:1 | 4.5:1 | PASS |
| light | on-color / muted | #fffaf4 / #6d5b50 | 6.20:1 | 4.5:1 | PASS |
| light | on-color / accent | #fffaf4 / #994b32 | 5.94:1 | 4.5:1 | PASS |
| light | on-color / accent-hover | #fffaf4 / #7c3824 | 8.26:1 | 4.5:1 | PASS |
| light | on-color / income | #fffaf4 / #306747 | 6.41:1 | 4.5:1 | PASS |
| light | on-color / expense | #fffaf4 / #a13d32 | 6.27:1 | 4.5:1 | PASS |
| light | on-color / warning | #fffaf4 / #805b13 | 5.91:1 | 4.5:1 | PASS |
| light | control-line / canvas | #8c7362 / #f7f1e8 | 3.94:1 | 3:1 | PASS |
| light | control-line / surface | #8c7362 / #fffaf4 | 4.27:1 | 3:1 | PASS |
| light | control-line / recess | #8c7362 / #efe4d7 | 3.53:1 | 3:1 | PASS |
| light | control-line / peach | #8c7362 / #f6d8c5 | 3.28:1 | 3:1 | PASS |
| light | focus / canvas | #994b32 / #f7f1e8 | 5.49:1 | 3:1 | PASS |
| light | focus / surface | #994b32 / #fffaf4 | 5.94:1 | 3:1 | PASS |
| light | focus / recess | #994b32 / #efe4d7 | 4.92:1 | 3:1 | PASS |
| light | focus / peach | #994b32 / #f6d8c5 | 4.56:1 | 3:1 | PASS |
| light | checkmark / check-fill | #ffffff / #994b32 | 6.16:1 | 3:1 | PASS |
| dark | ink / canvas | #f7ecdf / #211c19 | 14.47:1 | 4.5:1 | PASS |
| dark | ink / surface | #f7ecdf / #2d2521 | 12.89:1 | 4.5:1 | PASS |
| dark | ink / recess | #f7ecdf / #3a3029 | 11.02:1 | 4.5:1 | PASS |
| dark | ink / peach | #f7ecdf / #4a3329 | 10.03:1 | 4.5:1 | PASS |
| dark | muted / canvas | #cebaaa / #211c19 | 9.02:1 | 4.5:1 | PASS |
| dark | muted / surface | #cebaaa / #2d2521 | 8.03:1 | 4.5:1 | PASS |
| dark | muted / recess | #cebaaa / #3a3029 | 6.87:1 | 4.5:1 | PASS |
| dark | muted / peach | #cebaaa / #4a3329 | 6.25:1 | 4.5:1 | PASS |
| dark | accent / canvas | #f1ad88 / #211c19 | 8.90:1 | 4.5:1 | PASS |
| dark | accent / surface | #f1ad88 / #2d2521 | 7.92:1 | 4.5:1 | PASS |
| dark | accent / recess | #f1ad88 / #3a3029 | 6.77:1 | 4.5:1 | PASS |
| dark | accent / peach | #f1ad88 / #4a3329 | 6.16:1 | 4.5:1 | PASS |
| dark | accent-hover / canvas | #ffc6a4 / #211c19 | 11.14:1 | 4.5:1 | PASS |
| dark | accent-hover / surface | #ffc6a4 / #2d2521 | 9.92:1 | 4.5:1 | PASS |
| dark | accent-hover / recess | #ffc6a4 / #3a3029 | 8.48:1 | 4.5:1 | PASS |
| dark | accent-hover / peach | #ffc6a4 / #4a3329 | 7.72:1 | 4.5:1 | PASS |
| dark | income / canvas | #9dcea9 / #211c19 | 9.51:1 | 4.5:1 | PASS |
| dark | income / surface | #9dcea9 / #2d2521 | 8.46:1 | 4.5:1 | PASS |
| dark | income / recess | #9dcea9 / #3a3029 | 7.24:1 | 4.5:1 | PASS |
| dark | income / peach | #9dcea9 / #4a3329 | 6.59:1 | 4.5:1 | PASS |
| dark | expense / canvas | #ffa99a / #211c19 | 9.15:1 | 4.5:1 | PASS |
| dark | expense / surface | #ffa99a / #2d2521 | 8.15:1 | 4.5:1 | PASS |
| dark | expense / recess | #ffa99a / #3a3029 | 6.97:1 | 4.5:1 | PASS |
| dark | expense / peach | #ffa99a / #4a3329 | 6.34:1 | 4.5:1 | PASS |
| dark | warning / canvas | #e6c378 / #211c19 | 10.00:1 | 4.5:1 | PASS |
| dark | warning / surface | #e6c378 / #2d2521 | 8.90:1 | 4.5:1 | PASS |
| dark | warning / recess | #e6c378 / #3a3029 | 7.61:1 | 4.5:1 | PASS |
| dark | warning / peach | #e6c378 / #4a3329 | 6.92:1 | 4.5:1 | PASS |
| dark | on-color / ink | #211c19 / #f7ecdf | 14.47:1 | 4.5:1 | PASS |
| dark | on-color / muted | #211c19 / #cebaaa | 9.02:1 | 4.5:1 | PASS |
| dark | on-color / accent | #211c19 / #f1ad88 | 8.90:1 | 4.5:1 | PASS |
| dark | on-color / accent-hover | #211c19 / #ffc6a4 | 11.14:1 | 4.5:1 | PASS |
| dark | on-color / income | #211c19 / #9dcea9 | 9.51:1 | 4.5:1 | PASS |
| dark | on-color / expense | #211c19 / #ffa99a | 9.15:1 | 4.5:1 | PASS |
| dark | on-color / warning | #211c19 / #e6c378 | 10.00:1 | 4.5:1 | PASS |
| dark | control-line / canvas | #a58b78 / #211c19 | 5.27:1 | 3:1 | PASS |
| dark | control-line / surface | #a58b78 / #2d2521 | 4.69:1 | 3:1 | PASS |
| dark | control-line / recess | #a58b78 / #3a3029 | 4.02:1 | 3:1 | PASS |
| dark | control-line / peach | #a58b78 / #4a3329 | 3.65:1 | 3:1 | PASS |
| dark | focus / canvas | #f1ad88 / #211c19 | 8.90:1 | 3:1 | PASS |
| dark | focus / surface | #f1ad88 / #2d2521 | 7.92:1 | 3:1 | PASS |
| dark | focus / recess | #f1ad88 / #3a3029 | 6.77:1 | 3:1 | PASS |
| dark | focus / peach | #f1ad88 / #4a3329 | 6.16:1 | 3:1 | PASS |
| dark | checkmark / check-fill | #ffffff / #994b32 | 6.16:1 | 3:1 | PASS |

88/88 pasangan PASS. Ambang 3:1 hanya untuk batas kontrol, indikator fokus, dan centang radio/checkbox.

### Warna kategori dinamis

`accessibleColor` mempertahankan hue sebisa mungkin dan menggeser warna tampilan ke warna teks bila diperlukan sampai minimal 3:1 terhadap permukaan peach (latar dengan kontras terendah dalam tema). Nilai warna yang dipilih/dikirim/disimpan tetap utuh. Semua nama kategori tetap memakai token teks normal.

Ikon, bar kategori, dan segmen doughnut memakai penyesuaian yang sama. Pemisah segmen memakai warna permukaan grafik sehingga segmen bersebelahan memiliki batas yang terbaca. Hover doughnut mempertahankan warna yang sudah diperiksa. Warna swatch tetap menunjukkan nilai asli dan memiliki batas kontrol serta ring pilihan.

Pemeriksaan Node dengan `assert`: 12 warna preset, putih/hitam, kedua warna peach, masing-masing terhadap 4 latar pada 2 tema, ditambah 8 pemeriksaan fallback. Output berikut menampilkan rasio terendah dari empat latar untuk setiap warna:

| Tema | Warna kategori | Warna tampilan | Kontras minimum pada 4 latar |
|---|---|---|---|
| light | #dc3545 | #dc3545 | 3.35:1 PASS |
| light | #fd7e14 | #c16519 | 3.02:1 PASS |
| light | #b8860b | #a07610 | 3.05:1 PASS |
| light | #198754 | #198754 | 3.35:1 PASS |
| light | #20c997 | #288d6c | 3.04:1 PASS |
| light | #0dcaf0 | #1d899d | 3.04:1 PASS |
| light | #0d6efd | #0d6efd | 3.33:1 PASS |
| light | #6610f2 | #6610f2 | 5.32:1 PASS |
| light | #6f42c1 | #6f42c1 | 4.82:1 PASS |
| light | #d63384 | #d63384 | 3.33:1 PASS |
| light | #795548 | #795548 | 4.85:1 PASS |
| light | #6c757d | #6c757d | 3.47:1 PASS |
| light | #ffffff | #827c78 | 3.05:1 PASS |
| light | #000000 | #000000 | 15.55:1 PASS |
| light | #f6d8c5 | #8c796e | 3.06:1 PASS |
| light | #4a3329 | #4a3329 | 8.65:1 PASS |
| dark | #dc3545 | #e04f5b | 3.03:1 PASS |
| dark | #fd7e14 | #fd7e14 | 4.55:1 PASS |
| dark | #b8860b | #b8860b | 3.59:1 PASS |
| dark | #198754 | #319263 | 3.02:1 PASS |
| dark | #20c997 | #20c997 | 5.49:1 PASS |
| dark | #0dcaf0 | #0dcaf0 | 5.97:1 PASS |
| dark | #0d6efd | #297df9 | 3.00:1 PASS |
| dark | #6610f2 | #9d64eb | 3.04:1 PASS |
| dark | #6f42c1 | #9470c9 | 3.02:1 PASS |
| dark | #d63384 | #da4b90 | 3.00:1 PASS |
| dark | #795548 | #997b6e | 3.01:1 PASS |
| dark | #6c757d | #7b8288 | 3.00:1 PASS |
| dark | #ffffff | #ffffff | 11.69:1 PASS |
| dark | #000000 | #88827b | 3.08:1 PASS |
| dark | #f6d8c5 | #f6d8c5 | 8.65:1 PASS |
| dark | #4a3329 | #917f74 | 3.06:1 PASS |

136 pemeriksaan PASS (128 rasio, 8 fallback).

## 4. Perubahan per halaman

| Halaman/area | Hasil |
|---|---|
| Login dan Register | Panel auth berlapis dengan bagian atas peach seperti lipatan dompet, heading serif, input kontras, tombol utama timbul, toggle tema dan validasi tetap. |
| 404 | Angka 404 sebagai fokus, panel peach dengan elevasi, link dashboard tetap. |
| Sidebar desktop/HP | Navigasi aktif peach, brand tetap Pidu + dompet, kelompok laporan lebih tenang, panel HP tetap bergeser dan sekarang mengelola fokus keyboard. |
| Topbar/menu pengguna | Kontrol tema dan akun berukuran 44px, label Menu terlihat pada HP, dropdown memakai elevasi tertinggi dan mengembalikan fokus saat Escape. |
| Dashboard | Saldo peach sebagai fokus; jumlah transaksi lebih tenang; statistik rata-rata/rasio datar; grafik hangat; daftar kategori dan pengeluaran terbesar membungkus; budget memakai progress dan status baru. |
| Transaksi | Panel filter krem, ringkasan baru, header/hover tabel baru, kartu HP memisahkan deskripsi dari nominal, pagination membungkus, dropdown Export dan modal mengikuti token. |
| Kategori | Tab berstatus jelas, baris bisa membungkus, switch memiliki area 44px, picker ikon/warna memiliki target 44px dan penanda pilihan. |
| Rekap Harian/Mingguan/Bulanan/Tahunan | Header, ringkasan, grafik, tabel, hover, footer total, pagination periode/stepper mengikuti tema; switch harian membungkus pada lebar sempit. |
| Kalender/detail hari | Sel tanggal bertepi kontras, hari ini peach, indikator pemasukan bulat dan pengeluaran persegi pada HP; detail nominal boleh membungkus. |
| Budget | Total budget peach dengan tepi berlapis; kartu per kategori lebih tenang; status teks, progress, link transaksi, dan aksi tetap. |
| Impor | Pemilih file menjadi fokus peach dengan border putus-putus; pratinjau, ringkasan pemeriksaan, error, konfirmasi, dan toast memakai komponen baru. |
| Export & Backup | Export setahun peach sebagai satu file lengkap; export transaksi berupa form; daftar backup, status terbaru, unduh, dan umpan balik memakai token yang sama. |
| Komponen bersama | Tombol, input/select, modal, alert, toast, badge, progress, empty/error/loading, pagination, stepper, dan fokus memakai design system yang sama. |

Pada 360px, nominal kartu transaksi turun di bawah deskripsi, pagination dapat menjadi beberapa baris, aksi header membungkus, dan kalender tetap tujuh kolom. Perhitungan lebar sel kalender: (360 - 32 padding halaman - 2 border kartu - 6 padding kartu - 12 gap) / 7 = 44px. Modal memakai tinggi 100dvh dan footer menghormati safe area. Tabel rekap/pratinjau tetap memiliki scroll lokal di `table-responsive`; tidak menyembunyikan kolom data. Bukti ini berasal dari kode; hasil layout nyata, zoom 200%, dan keyboard HP masih harus diuji di Chrome.

### File dibuat

Semua path berikut relatif terhadap repo.

| File | Isi |
|---|---|
| frontend/src/styles/tokens.css | Palet kedua tema, alias Bootstrap/Toastify, font, radius, spasi, elevasi. |
| frontend/src/styles/components.css | Restyle semua komponen bersama. |
| frontend/src/components/CategoryIcon.jsx | Ikon kategori dengan warna tampilan yang terbaca. |
| frontend/src/hooks/useReducedMotion.js | Preferensi motion yang juga merespons perubahan OS saat aplikasi terbuka. |
| frontend/src/utils/accessibleColor.js | Perhitungan kontras dan penyesuaian warna kategori untuk tampilan. |
| frontend/scripts/check-contrast.py | Verifikasi seluruh pasangan token memakai checker antislop. |
| docs/lead/report-11.md | Laporan ini. |

### File diubah

Prefix `frontend/src/` berlaku untuk baris di bawah kecuali `frontend/index.html`.

| File | Ringkasan |
|---|---|
| frontend/index.html | Mengganti em dash di metadata dengan titik dua. |
| styles/app.css | Komposisi shell, auth, dashboard, halaman, breakpoint, dan reduced motion. |
| components/PageHeader.jsx | Class header dan aksi yang dapat membungkus. |
| components/SummaryCards.jsx | Grid responsif, hook styling saldo/jumlah, ikon dan angka. |
| components/CategoryBadge.jsx | Label kosong eksplisit, hook badge, CategoryIcon. |
| components/BudgetProgress.jsx | CategoryIcon, data/progress tidak berubah. |
| components/ExportMenu.jsx | Fokus kembali ke pemicu saat Escape. |
| components/FullPageSpinner.jsx | Tinggi dinamis untuk boot/loading/error. |
| components/charts/useChartTheme.js | Token surface, ink, peach, font untuk grafik dan warna kategori. |
| components/charts/IncomeExpenseChart.jsx | Warna tooltip, font, radius batang, reduced motion. |
| components/charts/CategoryDoughnut.jsx | Warna kategori/hover yang memenuhi kontras, tooltip dan reduced motion. |
| components/layout/AppLayout.jsx | Meneruskan status sidebar untuk aria-expanded. |
| components/layout/Sidebar.jsx | Class kelompok menu, focus trap dan pemulihan fokus. |
| components/layout/Topbar.jsx | Label Menu, aria-controls/expanded, pemulihan fokus dropdown. |
| components/ui/EmptyState.jsx | Hook visual state. |
| components/ui/ErrorState.jsx | Hook visual state. |
| components/ui/Modal.jsx | Focus trap, pemulihan fokus, komentar singkat. |
| components/ui/Pagination.jsx | Disabled native pada tombol halaman yang tidak tersedia. |
| components/ui/Stepper.jsx | Hook layout yang membungkus. |
| constants/enums.js | Hanya komentar tanpa em dash; nilai enum tetap. |
| pages/LoginPage.jsx | Hook auth-heading. |
| pages/RegisterPage.jsx | Hook auth-heading. |
| pages/NotFoundPage.jsx | Hook panel 404. |
| pages/dashboard/DashboardPage.jsx | Statistik sekunder, daftar terbesar, warna kategori, label rasio belum tersedia. |
| pages/budgets/BudgetsPage.jsx | Hook total/kartu/aksi, CategoryIcon. |
| pages/categories/CategoriesPage.jsx | Baris membungkus, ikon terbaca, tooltip tanpa em dash. |
| pages/categories/IconPicker.jsx | CategoryIcon untuk pilihan belum aktif. |
| pages/export/ExportPage.jsx | Hook export-all. |
| pages/import/ImportPage.jsx | Hook upload, teks kosong/duplikat tanpa em dash. |
| pages/reports/CalendarPage.jsx | Hook panel kalender. |
| pages/reports/DailyReportPage.jsx | Baris petunjuk/switch membungkus. |
| pages/reports/DayDetailModal.jsx | Hook total dan daftar detail. |
| pages/transactions/TransactionFilters.jsx | Hook panel filter. |
| pages/transactions/TransactionList.jsx | Susunan kartu HP dan teks kosong eksplisit. |
| pages/transactions/TransactionTable.jsx | Label kategori kosong eksplisit. |
| pages/transactions/TransactionsPage.jsx | Label deskripsi kosong pada konfirmasi. |

Halaman mingguan/bulanan/tahunan, ReportShell/ReportTable, BackupCard, form transaksi/kategori/budget, ConfirmDialog, ColorPicker, dan AmountInput menerima restyle melalui CSS/komponen bersama; alur data file-file tersebut tetap.

## 5. Verifikasi dan bundle

### Lint akhir

Perintah: `npm --prefix frontend run lint`. Exit code 0, tanpa warning/error. Oxlint pada lingkungan ini tidak mencetak ringkasan tambahan.

```text
> frontend@0.0.0 lint
> oxlint
```

### Build awal

Perintah: `npm --prefix frontend run build`. Exit code 0.

```text
> frontend@0.0.0 build
> vite build

vite v8.3.1 building client environment for production...
transforming...
✓ 156 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               1.15 kB │ gzip:   0.64 kB
dist/assets/bootstrap-icons-mSm7cUeB.woff2  134.04 kB
dist/assets/bootstrap-icons-BeopsB42.woff   180.28 kB
dist/assets/index-jxoaWuWH.css              327.36 kB │ gzip:  48.29 kB
dist/assets/reports-BghRf-x3.js               0.54 kB │ gzip:   0.20 kB
dist/assets/YearlyReportPage-yWcdLORo.js      0.88 kB │ gzip:   0.54 kB
dist/assets/MonthlyReportPage-BX76RGWs.js     1.36 kB │ gzip:   0.80 kB
dist/assets/WeeklyReportPage-DogxfZ8d.js      1.41 kB │ gzip:   0.75 kB
dist/assets/DailyReportPage-DmFapugZ.js       1.68 kB │ gzip:   0.91 kB
dist/assets/PeriodPicker-DGxcqYEm.js          1.89 kB │ gzip:   0.82 kB
dist/assets/DayDetailModal-ZwhI-qSp.js        2.70 kB │ gzip:   1.00 kB
dist/assets/ReportTable-BVFDZqRW.js           3.10 kB │ gzip:   1.12 kB
dist/assets/CalendarPage-Dv2D-DKX.js          3.28 kB │ gzip:   1.39 kB
dist/assets/DashboardPage-EWfqCm3D.js         7.22 kB │ gzip:   2.44 kB
dist/assets/IncomeExpenseChart-BcTPRsTT.js  188.06 kB │ gzip:  65.59 kB
dist/assets/index-D7B9f7E8.js               443.34 kB │ gzip: 134.31 kB

✓ built in 1.94s
```

### Build akhir

Perintah: `npm --prefix frontend run build`. Exit code 0, tanpa warning/error.

```text
> frontend@0.0.0 build
> vite build

vite v8.3.1 building client environment for production...
transforming...
✓ 159 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               1.23 kB │ gzip:  0.66 kB
dist/assets/bootstrap-icons-mSm7cUeB.woff2  134.04 kB
dist/assets/bootstrap-icons-BeopsB42.woff   180.28 kB
dist/assets/index-DzZpC6wS.css              347.84 kB │ gzip: 52.66 kB
dist/assets/reports-CQEQ0tw7.js               0.55 kB │ gzip:  0.21 kB
dist/assets/YearlyReportPage-mUmq3Qst.js      0.89 kB │ gzip:  0.55 kB
dist/assets/MonthlyReportPage-BolWLcAb.js     1.41 kB │ gzip:  0.82 kB
dist/assets/WeeklyReportPage-Ca8A_EVN.js      1.42 kB │ gzip:  0.76 kB
dist/assets/DailyReportPage-CFaPS4vV.js       1.70 kB │ gzip:  0.92 kB
dist/assets/PeriodPicker-DkUS0JV8.js          1.92 kB │ gzip:  0.84 kB
dist/assets/DayDetailModal-Dwk8ich4.js        2.77 kB │ gzip:  1.02 kB
dist/assets/ReportTable-B158naQu.js           3.13 kB │ gzip:  1.14 kB
dist/assets/CalendarPage-SMbDBINN.js          3.33 kB │ gzip:  1.42 kB
dist/assets/DashboardPage-CRF803b9.js         7.52 kB │ gzip:  2.52 kB
dist/assets/SummaryCards-Yq6s2Si5.js        105.64 kB │ gzip: 38.18 kB
dist/assets/IncomeExpenseChart-B4HSKZd7.js  188.19 kB │ gzip: 65.62 kB
dist/assets/index-BM_f0rbq.js               340.25 kB │ gzip: 97.80 kB

✓ built in 513ms
```

Build pertama di sandbox sempat berhenti dengan `spawn EPERM` pada proses internal Vite. Build kemudian berhasil melalui izin eksekusi tool. Konflik environment `NO_COLOR` dan `FORCE_COLOR` dihilangkan dengan menghapus `FORCE_COLOR` hanya pada proses shell verifikasi. Tidak ada konfigurasi proyek atau server yang diubah.

| Artefak | Sebelum → sesudah | Gzip sebelum → sesudah |
|---|---|---|
| CSS | 327.36 → 347.84 kB (+20.48) | 48.29 → 52.66 kB (+4.37) |
| JS awal termasuk modulepreload | 443.34 → 445.89 kB (+2.55) | 134.31 → 135.98 kB (+1.67) |
| Seluruh chunk JS | 655.46 → 658.72 kB (+3.26) | 209.87 → 211.80 kB (+1.93) |
| Chunk grafik | 188.06 → 188.19 kB | 65.59 → 65.62 kB |
| HTML | 1.15 → 1.23 kB | 0.64 → 0.66 kB |
| Font ikon WOFF2 + WOFF | 314.32 → 314.32 kB | Tidak dihitung Vite |
| Font/library tambahan | 0 → 0 | 0 → 0 |

Jumlah memakai angka output Vite yang dibulatkan. Build akhir memecah JS awal menjadi `index` 340.25 kB dan `SummaryCards` 105.64 kB yang di-modulepreload. Penurunan ukuran file bernama index tidak berarti JS awal berkurang. Chart.js tetap berada dalam chunk halaman grafik.

Pemeriksaan tambahan:
- `git diff --check`: PASS, tanpa output masalah whitespace.
- `rg -n '—' frontend/src frontend/index.html`: tidak ada hasil.
- Diff pada backend, API, App.jsx/routes, context auth/theme, hooks fetch, package.json, package-lock.json: kosong.
- Token kontras: 88/88 PASS; warna kategori: 136 pemeriksaan PASS.
- Lighthouse dan console browser: belum dijalankan.

## 6. Delivery Gate antislop

PASS di bawah menunjukkan bukti source/build/perhitungan yang dicantumkan. Pemeriksaan visual dan interaksi nyata belum diklaim lulus. Brief pemilik secara eksplisit menugaskan click-through kepada Claude; status R-35 tetap PENDING.

### Blok 1: Hard Gate

| Item | Status | Bukti |
|---|---|---|
| R-02, em dash | PASS | Scan frontend/src dan index.html bersih; teks kosong memakai frasa yang jelas. |
| R-03, mobile | PASS inspeksi | Grid minmax, wrapping header/kartu/pagination, target kontrol 44px, perhitungan kalender 360px; verifikasi layout nyata di R-35. |
| R-17, angka | PASS | Nilai tetap dari API/formatter; tidak menambah statistik. |
| R-18, testimoni | PASS | Tidak ada testimoni atau identitas orang baru. |
| R-23, aset | PASS | Logo/ikon yang ada dipertahankan; tidak ada logo, avatar, ilustrasi, gambar, atau navigasi baru. |
| R-24, tujuan navigasi | PASS | MENU dan route App.jsx tetap; tidak menambah tujuan fiktif. |
| R-25, kontras | PASS | 88 pasangan token, 128 rasio kategori, 8 fallback; teks normal minimal 4.54:1 dalam matriks. |
| R-26, kontrol berfungsi | PASS inspeksi | Handler submit/CRUD/filter/export/import tetap; disabled pagination native ditambahkan; daftar runtime ada di bawah. |
| R-27, state | PASS inspeksi | Branch empty/loading/error dipertahankan; state-card, spinner, alert, toast dan aria-busy ikut restyle. |
| R-28, FAQ | PASS | Tidak ada FAQ yang ditambahkan. |
| R-32, keyboard | PASS inspeksi | Outline 3px, Tab/Shift+Tab di modal/menu HP, Escape dan pemulihan fokus; aria yang ada tetap. |
| R-33, patch script | PASS | Source/CSS ditulis langsung melalui apply_patch; script contrast hanya membaca token dan menjalankan checker. |
| R-34, tema | PASS inspeksi | Kedua set token lengkap dan lulus kontras; ThemeContext memasang atribut sebelum render seperti sebelumnya. |
| R-35, verifikasi runtime | PENDING | **PENDING: click-through oleh Claude di Chrome**. Build/lint lulus; belum dicek di browser. |
| R-36, klaim | PASS | Tidak menambah klaim keamanan, kecepatan, pengguna, atau compliance. |
| R-37, arah | PASS | Design Read dari DESIGN.md, dial 2/2/2 dinyatakan sebelum implementasi. |
| R-38, konten nyata | PASS | Data/label fitur dari aplikasi yang ada; tidak menambah fixture UI atau orang fiktif. |

### Blok 2: Purpose-Gate

| Item | Status | Bukti/alasan |
|---|---|---|
| R-01, warna/gradient | PASS | Peach/terakota berasal dari brief; gradient hanya menggambar switch sebagai kontrol. |
| R-04, ikon | PASS | Dompet untuk saldo, panah untuk arus uang, kalender untuk periode, file untuk impor/export; tidak menambah set ikon. |
| R-06, tipografi | PASS | Font sistem menjaga keterbacaan; Georgia memberi rasa catatan pribadi pada judul saja. |
| R-07, latar | PASS | Latar solid; tidak ada grid/dot/dekorasi teknis. |
| R-08, panah | PASS | Panah tetap penanda arus uang, urutan, dan periode; tidak ditambahkan ke CTA sebagai hiasan. |
| R-09, badge | PASS | Hanya kategori, jumlah, jenis, status budget, duplikat, terbaru, dan nonaktif yang nyata. |
| R-10, glass | PASS | Tidak memakai backdrop-filter. |
| R-12, bayangan | PASS | Kartu biasa datar; tiga tingkat elevasi memiliki fungsi di tabel keputusan. |
| R-13, glow | PASS | Tidak memakai glow; outline keyboard merupakan indikator fokus. |
| R-14, kartu | PASS | Saldo fokus, jumlah sekunder, statistik dashboard datar, tabel/list mengikuti bentuk datanya. |
| R-19, motion | PASS | Gerak pada respons tombol, masuk panel, dan pembaruan grafik; reduced motion CSS + hook Chart.js. |
| R-22, ilustrasi | PASS | Tidak membuat ilustrasi baru. |

### Blok 3: Liveliness

| Item | Status | Bukti |
|---|---|---|
| Dial eksplisit | PASS | ENERGY 2 / RHYTHM 2 / MOTION 2. |
| Konsisten dengan dial | PASS inspeksi | Aksen hangat dan elevasi terbatas; form/tabel konsisten, auth/statistik memiliki komposisi berbeda. |
| Fokus per layar | PASS inspeksi | Auth: form masuk/daftar; dashboard/rekap: saldo; transaksi/kategori/budget: aksi tambah; impor: unggah; export: berkas tahunan; kalender: hari ini; 404: angka 404. |
| Whitespace struktural | PASS | Spasi form rapat, antarbagian 24/32px, padding mobile 16px. |
| Aksen disengaja | PASS | Terakota pada aksi/link dan peach pada panel fokus; status memakai warna semantik. |
| Motif identitas | PASS | Panel peach, lipatan auth, sudut saldo, tipografi judul catatan pribadi. |
| Design Read sebelum generasi | PASS | Dinyatakan dalam commentary sebelum perubahan source. |

### Blok 4: Craftsmanship & Quality Locks

| Item | Status | Bukti |
|---|---|---|
| C-1, alasan | PASS | Tabel token dan keputusan memuat alasan masing-masing. |
| C-2, kelengkapan kontrol | PASS inspeksi | Callback dan form existing tetap; tidak menambah kontrol kosong. |
| C-3, kebutuhan konten | PASS | Semua bagian tetap melayani saldo, transaksi, kategori, rekap, budget, impor/export/backup. |
| C-4, ketahanan | PASS inspeksi | Kedua tema, branch state, wrapping mobile, keyboard dan reduced motion tercakup; pengujian nyata tetap R-35. |
| C-5, bukti | PASS | Hasil build/checker dicantumkan; tidak mengklaim hasil Chrome atau Lighthouse. |
| R-05, susunan | PASS | Urutan pekerjaan aplikasi tetap; variasi terbatas sesuai RHYTHM 2. |
| R-11, radius | PASS | Skala 8/12/20/28px untuk peran berbeda. |
| R-15, CTA | PASS | Masuk, Daftar, Tambah Transaksi, Simpan, Impor, Export, Coba lagi tetap spesifik. |
| R-16, buzzword | PASS | Tidak menambah copy pemasaran. |
| R-20, identitas | PASS inspeksi | Krem/peach/terakota, motif dompet, judul serif dan angka tabular memberi karakter pada catatan uang. |
| R-21, pilihan tema | PASS | Toggle, preferensi sistem, penyimpanan tema, dan pre-render attribute dipertahankan. |
| R-29, palet | PASS | Keluarga terakota, hijau semantik, oker peringatan dengan dasar netral hangat; warna kategori adalah pilihan data pengguna. |
| R-30, orisinalitas | PASS | Tidak menyalin desain produk populer atau mengambil template. |
| R-31, keputusan tertulis | PASS | Alasan warna, font, spasi, bentuk, kartu, ikon, elevasi, dan motion ada di bagian 2. |

### Pemeriksaan tambahan skill

- UI: tidak menambah hero pemasaran, badge dekoratif, emoji, feed fiktif, terminal, atau section pengisi.
- Human: pasangan warna dihitung, fokus eksplisit, status selalu disertai teks/ikon; skor aksesibilitas belum diukur ulang.
- Mobile: target tombol/input/select/switch/picker/close/pagination minimal 44px; link inline mengikuti teks, checkbox/radio berlabel memakai area label; verifikasi perangkat/zoom pending.
- Copywriting: perubahan teks terbatas pada label kosong, label Menu, tanda baca, dan indikator pembaruan; tidak menambah fakta.
- Code: komentar baru menerangkan batas tampilan warna atau fokus; komentar bisnis yang ada dipertahankan.

## 7. Daftar click-through untuk Claude

Semua baris berikut **PENDING**, bukan bukti interaksi yang sudah dilakukan. Jalankan dalam light/dark; cek console, desktop, 360px, lebar menengah, zoom 200%, reduced motion, dan keyboard.

| Area | Interaksi yang perlu dicoba | Hasil yang diharapkan dari handler existing |
|---|---|---|
| Login | Kirim kosong, password salah, toggle password, isi demo di DEV, login valid | Validasi/error terlihat; login menuju halaman asal/dashboard. |
| Register | Kirim kosong, password pendek/tidak cocok, daftar valid | Validasi terlihat; berhasil masuk seperti sebelumnya. |
| Tema | Toggle pada auth dan setiap halaman grafik | DOM, ikon, tooltip dan grafik langsung mengikuti tema. |
| Sidebar | Buka Menu di HP, Tab/Shift+Tab, Escape, tutup, pilih setiap tujuan | Panel bergeser, fokus tetap di panel, kembali ke pemicu saat tutup; tujuan route benar. |
| Akun/404 | Buka dropdown, Escape, Keluar; akses route tidak dikenal, kembali | Fokus dipulihkan; logout dan link dashboard berjalan. |
| Dashboard | Ganti preset/kustom, link kategori, pengeluaran terbesar, budget | Query/filter sama; nominal, grafik, daftar dan budget sinkron. |
| Transaksi/filter | Cari, jenis, kategori, metode, periode/kustom, reset, sort, per halaman, pagination | URL/query dan hasil sama; kontrol muat/error tetap terlihat. |
| Transaksi/form | Tambah, edit, simpan, simpan & tambah lagi, validasi nominal, batal/Escape/backdrop | Data tersimpan seperti sebelumnya; Tab tetap di modal, fokus kembali. |
| Transaksi/hapus | Buka konfirmasi, batal, konfirmasi | Perilaku penghapusan sama, toast terlihat. |
| Export menu | Buka/tutup/Escape, Excel/PDF dengan filter | File sesuai filter; error/busy tetap terlihat. |
| Kategori | Kedua tab, tampilkan nonaktif, switch, tambah/edit, ikon/warna/custom, hapus | Field/payload sama; warna tampilan terbaca; kategori terpakai tetap tidak bisa dihapus. |
| Rekap | Periode harian/mingguan, stepper bulanan, baris tahun/bulan/minggu/hari, switch hari kosong | Navigasi detail dan nilai total sama; tabel scroll hanya pada wadahnya. |
| Kalender | Prev/next/Hari ini, tanggal kosong/berisi, modal detail, Lihat di Transaksi | Hari tepat dan detail sesuai data; semua target tanggal nyaman disentuh. |
| Budget | Bulan, tambah/edit/hapus, salin bulan lalu, Lihat transaksi | Status/progress sama; tidak ada angka yang terpotong. |
| Impor | Template, file invalid/valid/duplikat, checkbox duplikat, konfirmasi, batal | Pratinjau/error per baris; penyimpanan hanya setelah konfirmasi. |
| Export & Backup | Periode/tahun, Excel/PDF/semua, backup sekarang, unduh, link Impor | Unduhan dan backup sama; status busy/error/toast terlihat. |
| State | Backend tidak terjangkau via simulasi browser, data kosong, loading lambat | Pesan/retry/empty/spinner tetap; jangan mematikan server untuk pengujian ini. |

## 8. Deviasi dan usulan

- Tidak ada deviasi ruang lingkup. Semua perubahan ada di frontend dan laporan ini. File arahan/brief yang sejak awal belum tracked tetap tidak diubah.
- Tilt tidak dipilih karena brief menyediakannya sebagai opsi. Kedalaman memakai skala elevasi, lipatan panel CSS, dan tombol tekan.
- Warna kategori ditampilkan dengan penyesuaian kontras bila dibutuhkan. Nilai asli di picker, payload, dan database tetap; ini perubahan tampilan saja.
- Fokus modal/menu, pemulihan fokus dropdown, dan disabled native pagination diperkuat agar restyle memenuhi keyboard. Alur bisnis tidak diubah.
- Tabel rekap/pratinjau tetap dapat digeser di dalam wadahnya pada HP untuk mempertahankan semua kolom; pemeriksaan scroll halaman nyata masih menunggu Chrome.
- Tidak ada ilustrasi yang diusulkan untuk tahap ini; tampilan sudah memakai motif CSS tanpa aset tambahan.
- Pengukuran Lighthouse 100, hasil visual, keyboard perangkat nyata, console browser, dan click-through tetap menunggu reviewer sesuai brief. Tidak mengklaim desain sudah disetujui visual.

## Putaran 2

Tanggal: 29 September 2026. Executor: Codex. Implementasi A1–A2 dan B1–B7 selesai. **Belum dicek di browser. R-35: PENDING, click-through oleh Claude.**

Dibaca ulang: laporan putaran 1, `docs/lead/phase-11-r2.md`, `DESIGN.md`, core antislop, antislop-ui, antislop-human, antislop-layoutmobile, serta panduan proyek. Antislop diterapkan **selama pengerjaan**, sesuai pilihan eksplisit dalam brief. Tidak meminta pilihan itu lagi.

Reading this as: aplikasi keuangan pribadi untuk individu, hangat dengan motif dompet dan ubin timbul, dial **ENERGY 2 / RHYTHM 2 / MOTION 2**. Saldo kini menjadi fokus yang lebih besar, dengan permukaan perspektif dan dua lembar di belakangnya; angka tetap berada pada bidang datar.

Perubahan aplikasi hanya di `frontend/`, ditambah bagian laporan ini. Backend, API, definisi route, pembentukan query URL, dependensi, font, dan aset tidak diubah. Tidak ada commit. Tidak menjalankan atau mematikan server di port 8001/8010. Perubahan putaran 1 yang sudah ada di workspace dipertahankan.

### A. Perbaikan bug

| ID | Penyebab | Perbaikan dan bukti |
|---|---|---|
| A1 | `.dropdown-menu-end` Bootstrap mengandalkan penempatan Popper; menu React tidak mengaktifkan mekanisme tersebut. | CSS kini menetapkan `right: 0; left: auto`. `useDropdownBounds` mengukur tombol dan lebar menu saat menu dibuka melalui `useLayoutEffect`, lalu menggeser menu bila perlu agar kedua tepinya berjarak minimal 16px dari viewport. Lebar maksimum tetap dibatasi viewport. ResizeObserver, resize, dan scroll memperbarui posisi; semuanya dibersihkan saat tutup. Berlaku pada Topbar dan Export, tanpa ketergantungan tema. Simulasi akhir 48 kasus geometri pada 360/1440/1920px PASS, termasuk scrollbar 17px; posisi hasil render kedua tema masih PENDING browser. |
| A2 | Class `.btn`, `fw-bold`, dan `text-body` menimpa ukuran, bobot, serta warna header; tombol memiliki perataan sendiri. | Tombol sort memakai `.table-sort`: `font: inherit`, `color: inherit`, `text-align: inherit`, tinggi/lebar minimum 44px. Header memakai ukuran 0.8125rem dan bobot 600 yang sama. `th.text-end` dan tombol di dalamnya rata kanan untuk Nominal. `onSort`, ikon arah, dan `aria-sort` dipertahankan. |

Escape, klik di luar menu, `aria-expanded`, dan pengembalian fokus ke pemicu tetap memakai handler putaran 1. Hook posisi hanya mengatur CSS variable, tanpa mengubah state pembukaan atau aksi menu.

### B. Efek dan alasan R-31

| ID | Dipasang di mana / implementasi | Alasan satu baris | Kapan nonaktif |
|---|---|---|---|
| B1 | Semua Saldo di `SummaryCards`: permukaan dan kilau pada pseudo-element memakai perspective 900px, rotateX/Y maksimal ±4°, kembali datar 280ms. Pointer diproses lewat satu requestAnimationFrame yang mengambil posisi terbaru; tidak memakai setState per gerakan. | Perspektif dan kilau terpusat pada Saldo menegaskan uang yang tersisa sebagai fokus utama. | Hanya aktif pada hover + pointer fine + no-preference; touch event diabaikan, keluar/cancel/blur/perubahan preferensi mereset efek, unmount membatalkan frame dan listener. |
| B2 | `.icon-tile` pada ikon ringkasan, CategoryIcon (termasuk CategoryBadge), menu sidebar, dan pilihan ikon kategori; highlight atas, tepi bawah, bayangan pendek konsisten. | Ubin kecil menghubungkan simbol uang, kategori, dan navigasi dalam satu motif yang mudah dikenali. | Statis di semua perangkat; ikon dekoratif tidak mendapat cursor pointer, tabIndex, atau efek angkat. |
| B3 | Navigasi aktif memakai tepi bawah 3px dan bayangan pendek; item lain naik 2px saat hover, item ditekan turun 1px. | Elevasi aktif memperjelas lokasi pengguna, sedangkan gerak memberi respons pada navigasi yang bisa dipilih. | Gerak hover/tekan baru hanya untuk hover + pointer fine + no-preference; penanda aktif tetap terlihat pada sentuh/reduced motion. |
| B4 | Dashboard memakai `prominent`: desktop ≥1200px membagi lebar 2:1:1:1, Saldo pertama di DOM dan tampilan, angka 1.5–2.5rem, dua kertas inset di belakang. Tiga ringkasan lain tetap tanpa shadow kartu. | Saldo mendapat ruang lebih besar karena menjadi hasil akhir pemasukan dan pengeluaran, sementara jumlah transaksi adalah pendukung. | Susunan satu kolom pada <576px; 576–1199px Saldo selebar dua kolom, pemasukan/pengeluaran berpasangan, jumlah transaksi satu baris. Lapisan statis tetap, tilt mengikuti B1. |
| B5 | Baris `.clickable-row` laporan, link breakdown kategori, tombol sel kalender, `.budget-detail-link`, dan link/tombol aksi budget naik 2px dengan shadow berlapis. Area ringkasan budget kini link ke URL yang sama dengan “Lihat transaksi”. | Angkat menandai area yang benar-benar menjalankan navigasi atau aksi, sehingga kedalaman membantu mengenali kontrol. | Hanya hover + pointer fine + no-preference; tombol disabled dikecualikan. Kontainer budget, ringkasan non-Saldo, daftar pengeluaran terbesar, dan baris transaksi biasa tidak mendapat efek angkat. |
| B6 | `.budget-progress` di Dashboard, total Budget, dan setiap budget kategori: track inset, batas kontras, fill memiliki sorotan dan tepi gelap. | Bentuk wadah cekung dengan isian timbul memperjelas proporsi budget terpakai tanpa mengubah arti warna status. | Statis, tanpa animasi tekstur; persentase, status teks, dan aria tetap ada di kedua tema/perangkat. |
| B7 | `.auth-card` Login/Register memakai dua pseudo-element di belakang, inset horizontal 6/12px dan offset bawah 8/16px. | Tumpukan kertas mengulang motif catatan/dompet saat pengguna masuk dan mendaftar. | Selalu statis; tidak menambahkan tilt pada formulir agar input dan fokus tetap stabil. |

Detail B1: transform hanya diterapkan pada permukaan kartu dan kilau; teks/angka serta ikon tidak ditransformasi atau diberi filter. Ini menghindari rasterisasi teks pada bidang miring. Ketajaman visual nyata pada kedua tema tetap perlu diperiksa Claude. Area Saldo tidak ditambahkan aksi klik, role tombol, cursor pointer, atau perubahan skala saat hover.

Lapisan kertas memakai inset horizontal sehingga tidak melebar keluar kartu di HP. Kilau hanya pada Saldo, di bawah teks. Tidak ada glassmorphism, glow di ikon/tombol, animasi dekoratif berulang, library 3D, font, atau gambar baru. Fungsi `accessibleColor` dan tema grafik tetap dipertahankan.

### C. Token, nilai, dan kontras

Palet dan token putaran 1 tetap. Tambahan:

| Token/nilai | Light | Dark | Tujuan |
|---|---|---|---|
| `--pidu-shine-peak` | #fbeadd | #573e31 | Batas warna paling terang kilau Saldo, tetap dalam krem/cokelat hangat. |
| `--pidu-edge` | #c4a58e | #15110f | Tepi bawah ubin dan penanda navigasi aktif. |
| `--pidu-highlight` | #fffaf4 | #795d4b | Sorotan tepi atas setebal 1px. |
| `--pidu-shadow-tile` | inset atas 1px highlight, inset bawah 2px edge, luar bawah 2px edge | Struktur sama, warna tema | Kedalaman kecil yang konsisten tanpa shadow besar di setiap ikon. |
| `--pidu-shadow-lift` | 0 3px 0 #ddcbbd, 0 8px 14px rgb(69 43 28 / 12%) | 0 3px 0 #15110f, 0 8px 14px rgb(0 0 0 / 28%) | Respons hover untuk area interaktif. |
| `--pidu-shadow-inset` | inset 0 2px 3px rgb(69 43 28 / 22%) | inset 0 2px 3px rgb(0 0 0 / 40%) | Track budget dan respons tekan. |
| `--pidu-perspective` / `--pidu-tilt-return` | 900px / 280ms | Sama | Perspektif kecil dengan waktu kembali yang lembut. |
| Tilt / hover / tekan | ±4° / -2px / +1px | Sama | Membatasi gerak pada skala yang masih nyaman untuk data keuangan. |
| Ubin | 28px default, 44px ringkasan/daftar kategori, radius 8/12px | Sama | Ikon kecil tetap berbeda dari target interaksi minimal 44px. |

`python frontend/scripts/check-contrast.py`: **112/112 pasangan PASS**. Script kini memeriksa puncak kilau sebagai latar tambahan, seluruh pasangan lama, serta fill budget terhadap track. Ambang teks normal 4.5:1; batas kontrol, fokus, dan status nonteks 3:1.

| Foreground terhadap puncak kilau | Light: #fbeadd | Dark: #573e31 |
|---|---|---|
| ink | #352b26, 11.75:1 PASS | #f7ecdf, 8.43:1 PASS |
| muted | #6d5b50, 5.49:1 PASS | #cebaaa, 5.25:1 PASS |
| accent | #994b32, 5.26:1 PASS | #f1ad88, 5.18:1 PASS |
| accent-hover | #7c3824, 7.32:1 PASS | #ffc6a4, 6.48:1 PASS |
| income | #306747, 5.68:1 PASS | #9dcea9, 5.53:1 PASS |
| expense | #a13d32, 5.55:1 PASS | #ffa99a, 5.33:1 PASS |
| warning | #805b13, 5.23:1 PASS | #e6c378, 5.82:1 PASS |
| control-line (3:1) | #8c7362, 3.78:1 PASS | #a58b78, 3.07:1 PASS |
| focus (3:1) | #994b32, 5.26:1 PASS | #f1ad88, 5.18:1 PASS |

Kilau berinterpolasi dari peach ke peak tanpa menutupi teks. Kedua endpoint diperiksa: pada light titik terlemah adalah peach (label muted 4.77:1, nominal income 4.93:1, expense 4.81:1); pada dark titik terlemah adalah peak (5.25:1, 5.53:1, 5.33:1). Ubin menggunakan recess yang sudah diperiksa: ikon semantik dan teks sidebar ≥4.89:1 light, ≥6.77:1 dark; ikon kategori tetap disesuaikan `accessibleColor` minimal 3:1.

Enam pemeriksaan tambahan melalui checker antislop menguji bayangan budget dengan compositing warna. Pada light dipakai track tergelap (22% #452b1c di atas recess menghasilkan #cabbae); pada dark dipakai fill tergelap (15% hitam) melawan track tanpa shadow, sehingga mengambil pasangan terburuk untuk bagian fill berwarna.

| Tema/status | Foreground / background | Rasio | Hasil nonteks |
|---|---|---|---|
| light aman | #306747 / #cabbae | 3.56:1 | PASS |
| light terlampaui | #a13d32 / #cabbae | 3.48:1 | PASS |
| light hampir habis | #805b13 / #cabbae | 3.28:1 | PASS |
| dark aman | #85af90 / #3a3029 | 5.22:1 | PASS |
| dark terlampaui | #d99083 / #3a3029 | 5.06:1 | PASS |
| dark hampir habis | #c4a666 / #3a3029 | 5.50:1 | PASS |

Reproduksi tiap baris tambahan: `python .claude/skills/antislop-human/contrast-check.py "#foreground" "#background"`, memakai kolom ambang 3:1. Highlight dan edge hanya tepi dekoratif; bukan latar teks atau satu-satunya indikator status.

### D. File dan verifikasi

File baru:

- `frontend/src/hooks/usePointerTilt.js`: pointer, frame, preferensi perangkat/motion, dan cleanup.
- `frontend/src/hooks/useDropdownBounds.js`: posisi menu dalam viewport dan cleanup observer/listener.

File diubah pada putaran ini:

- `frontend/src/styles/tokens.css`: token kedalaman dan batas kilau.
- `frontend/src/styles/components.css`: ubin, dropdown, tombol sort, tekstur budget.
- `frontend/src/styles/app.css`: hirarki ringkasan, kertas Saldo/auth, sidebar, hover bersyarat, responsive.
- `frontend/src/components/SummaryCards.jsx`: Saldo pertama, ref tilt, varian prominent, ubin.
- `frontend/src/components/CategoryIcon.jsx`: motif ubin, termasuk pemakaian melalui CategoryBadge.
- `frontend/src/components/BudgetProgress.jsx`: class khusus tekstur budget.
- `frontend/src/components/layout/Sidebar.jsx`: ubin ikon menu.
- `frontend/src/components/layout/Topbar.jsx`: hook batas dropdown pengguna.
- `frontend/src/components/ExportMenu.jsx`: hook batas dropdown Export.
- `frontend/src/pages/dashboard/DashboardPage.jsx`: varian ringkasan prominent.
- `frontend/src/pages/budgets/BudgetsPage.jsx`: area ringkasan budget sebagai link nyata ke daftar transaksi yang sama.
- `frontend/src/pages/categories/IconPicker.jsx`: ubin untuk ikon yang sedang dipilih juga.
- `frontend/src/pages/transactions/TransactionTable.jsx`: class tombol sort khusus.
- `frontend/scripts/check-contrast.py`: pasangan kilau dan fill budget.
- `docs/lead/report-11.md`: menambahkan bagian Putaran 2; isi putaran 1 tidak dihapus.

Output akhir lint, exit 0, **tanpa warning/error**:

```text
> frontend@0.0.0 lint
> oxlint
```

Output akhir build, exit 0, **tanpa warning/error**:

```text
> frontend@0.0.0 build
> vite build

vite v8.3.1 building client environment for production...
transforming...
✓ 161 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               1.23 kB │ gzip:  0.66 kB
dist/assets/bootstrap-icons-mSm7cUeB.woff2  134.04 kB
dist/assets/bootstrap-icons-BeopsB42.woff   180.28 kB
dist/assets/index-Yf2yWjyO.css              353.51 kB │ gzip: 53.74 kB
dist/assets/reports-DK7wNeUN.js               0.55 kB │ gzip:  0.21 kB
dist/assets/YearlyReportPage-BSR1NNJU.js      0.89 kB │ gzip:  0.55 kB
dist/assets/MonthlyReportPage-B_ovNoyc.js     1.41 kB │ gzip:  0.82 kB
dist/assets/WeeklyReportPage-CR_4bVrF.js      1.42 kB │ gzip:  0.76 kB
dist/assets/DailyReportPage-CaaTAe1-.js       1.70 kB │ gzip:  0.92 kB
dist/assets/PeriodPicker-D5HoZoS5.js          1.92 kB │ gzip:  0.84 kB
dist/assets/DayDetailModal-BqLDmBPr.js        2.77 kB │ gzip:  1.02 kB
dist/assets/ReportTable-Ccwxm4qe.js           3.13 kB │ gzip:  1.14 kB
dist/assets/CalendarPage-CT6eqfbN.js          3.33 kB │ gzip:  1.42 kB
dist/assets/DashboardPage-cmigYTFK.js         7.54 kB │ gzip:  2.53 kB
dist/assets/SummaryCards-BuF3_p7B.js        107.03 kB │ gzip: 38.66 kB
dist/assets/IncomeExpenseChart-B6olBLf3.js  188.19 kB │ gzip: 65.62 kB
dist/assets/index-BG2dUhx8.js               341.04 kB │ gzip: 98.05 kB

✓ built in 629ms
```

Perintah: `npm --prefix frontend run lint` dan `npm --prefix frontend run build`. Percobaan awal build diblokir sandbox Windows (`spawn EPERM` saat Vite membaca config), lalu berhasil dengan izin subprocess. Konflik bawaan `NO_COLOR`/`FORCE_COLOR` menimbulkan warning Node pada percobaan awal; untuk perintah akhir `FORCE_COLOR` dilepas hanya dalam proses shell tersebut. Tidak mengubah konfigurasi proyek atau mematikan warning dengan `NODE_NO_WARNINGS`.

Bundle utama JS 341.04 kB (gzip 98.05 kB), shared chunk SummaryCards 107.03 kB (38.66 kB), CSS 353.51 kB (53.74 kB). Chunk bersama dapat berisi dependensi yang dipindahkan bundler; ukuran index saja bukan total unduhan aplikasi. Tidak menambah dependensi atau aset.

Batas lebar dropdown dihitung dari `document.documentElement.clientWidth` sehingga ruang scrollbar tidak ikut dihitung sebagai ruang menu. CSS memakai `--dropdown-available-width` untuk batas minimum/maksimum, lalu posisi dikoreksi terhadap viewport yang sama.

Pemeriksaan tambahan:

- Simulasi Node terhadap hook aktual, dengan DOM/event/media/requestAnimationFrame stub: PASS penggabungan pointer event menjadi satu frame, posisi terakhir, clamp ±4°, reset saat keluar, touch/media nonaktif, unmount serta pembatalan frame/listener.
- Simulasi dropdown akhir: **48 kasus PASS**, kombinasi viewport 360/1440/1920px, tanpa/dengan scrollbar 17px, lebar menu 160px/lebar maksimum, anchor di kiri/tengah/kanan/di luar viewport; semua hasil berada dalam margin 16px. Listener resize/scroll dan observer dibersihkan. Ini pengujian geometri dengan stub, bukan pengukuran layout browser.
- `git -c core.safecrlf=false diff --check`: exit 0, tidak ada kesalahan whitespace.
- Pemeriksaan kode: handler sort, Escape dropdown/modal, fokus keyboard, target kontrol minimum 44px, data/chart/empty/loading/error dipertahankan.

### E. Delivery Gate antislop diperbarui

PASS kode di bawah berarti inspeksi source atau pemeriksaan otomatis yang disebutkan. Bukti browser tetap **PENDING** sesuai instruksi brief; tidak mengklaim click-through, console bersih, atau ketajaman hasil render sudah diuji.

#### Hard Gate

| Aturan | Status dan bukti |
|---|---|
| R-02 | PASS: tidak menambah copy UI dengan em dash. |
| R-03 | PASS kode: grid mobile satu kolom, inset kertas tidak melebar, dropdown dibatasi viewport, target 44px; overflow/zoom nyata PENDING browser. |
| R-17 | PASS: angka tetap berasal dari data aplikasi; tidak menambah statistik. |
| R-18 | PASS: tidak menambah testimoni atau identitas orang. |
| R-23 | PASS: seluruh dekorasi pseudo-element CSS yang diminta brief; tidak menambah aset atau navigasi baru. |
| R-24 | PASS: link budget memakai `transactionsLink` yang sudah ada; route tidak berubah. |
| R-25 | PASS: 112 pasangan token dan 6 pasangan compositing budget lulus checker. |
| R-26 | PASS kode: link budget memiliki tujuan, menu/sort/aksi mempertahankan handler; Saldo/ubin dekoratif tidak menjadi tombol semu. |
| R-27 | PASS kode: cabang empty/loading/error dan indikator pembaruan tetap. |
| R-28 | PASS: tidak ada FAQ yang ditambahkan. |
| R-32 | PASS kode: sort tetap button native, link budget native, focus-visible 3px, Escape dan pemulihan fokus dipertahankan; keyboard nyata PENDING. |
| R-33 | PASS: edit langsung melalui patch source; tidak menjalankan script yang menulis ulang UI/CSS. |
| R-34 | PASS token/kontras dua tema; rendering, ketajaman, overflow, dan interaksi dua tema PENDING browser. |
| R-35 | **PENDING: build/lint lulus; belum dicek di browser, click-through oleh Claude.** |
| R-36 | PASS: tidak menambah klaim performa/keamanan atau klaim browser tanpa bukti. |
| R-37 | PASS: DESIGN.md dan brief menjadi dasar; Design Read dinyatakan sebelum implementasi. |
| R-38 | PASS: tidak menambah konten/data/fitur fiktif. |

#### Purpose-Gate

| Aturan | Status dan bukti |
|---|---|
| R-01 | PASS: radial gradient hanya kilau permukaan Saldo; alasan B1 dan warna puncak terukur. |
| R-04 | PASS: ikon dompet, arus uang, receipt, kategori, dan menu memakai glyph yang sudah sesuai fungsi. |
| R-06 | PASS: Georgia judul dan font sistem isi/angka dipertahankan; angka Saldo diperbesar untuk hirarki. |
| R-07 | PASS: tanpa pola latar halaman; tekstur tepi budget menjelaskan wadah terisi. |
| R-08 | PASS: tidak menambah panah dekoratif pada tombol. |
| R-09 | PASS: badge kategori/status tetap merepresentasikan data; tanpa badge promosi. |
| R-10 | PASS: tidak ada glassmorphism. |
| R-12 | PASS: shadow besar tetap Saldo/auth/dialog; ubin memakai tepi pendek, area interaktif terangkat hanya saat hover. |
| R-13 | PASS: kilau hanya Saldo, tidak disebarkan ke ikon/sidebar/auth. |
| R-14 | PASS: Saldo lebih lebar di Dashboard; tiga metrik lain sekunder. |
| R-19 | PASS: tilt dan hover dipicu pengguna, dibatasi media query/motion preference, tanpa loop baru. |
| R-22 | PASS: tidak menambah ilustrasi. |

#### Liveliness

| Item | Status dan bukti |
|---|---|
| Dial eksplisit | PASS: ENERGY 2 / RHYTHM 2 / MOTION 2. |
| Konsistensi dial | PASS kode: satu fokus bergerak, kedalaman kecil konsisten; penilaian visual akhir PENDING Claude. |
| Fokus halaman | PASS kode: Saldo 2fr di Dashboard; hierarki auth dan halaman lain putaran 1 dipertahankan. |
| Whitespace | PASS kode: gap ringkasan 16px, ruang kertas 12px, auth 16px; tidak membuat section kosong. |
| Aksen sengaja | PASS: peach/terakota pada fokus uang dan aksi; kilau dibatasi Saldo. |
| Motif identitas | PASS: tumpukan catatan/dompet serta ubin ikon memakai token yang sama. |
| Design Read | PASS: dicatat pada awal pengerjaan dan awal laporan putaran ini. |

#### Craftsmanship & Quality Locks

| Item | Status dan bukti |
|---|---|
| C-1 | PASS: alasan satu baris untuk seluruh B1–B7 dan token baru tercatat. |
| C-2 | PASS kode: setiap area yang terangkat mempunyai link/button/onClick; pengujian aksi nyata PENDING. |
| C-3 | PASS: seluruh panel menampilkan konten keuangan yang sudah ada; tidak menambah section template. |
| C-4 | PASS kode untuk state, preferensi motion, dan responsive; browser/perangkat/zoom PENDING. |
| C-5 | PASS: hasil otomatis dibedakan dari simulasi dan review browser yang belum dilakukan. |
| R-05 | PASS: lebar Saldo mengikuti prioritas uang tersisa; tiga metrik pendukung tetap teratur, tanpa mosaik dekoratif. |
| R-11 | PASS: memakai radius token 8/12/20/28px sesuai fungsi, tidak menyeragamkan menjadi pil. |
| R-15 | PASS: aksi tetap spesifik, termasuk “Lihat transaksi”, Edit, Hapus, Export, dan Keluar. |
| R-16 | PASS: tidak menambah copy pemasaran generik. |
| R-20 | PASS kode: motif dompet/ubin, Georgia, dan palet hangat dipertahankan; penerimaan visual PENDING. |
| R-21 | PASS kode: pilihan light/dark tetap; tidak memaksa default baru. |
| R-29 | PASS: tambahan warna merupakan turunan palet krem/cokelat, status semantik tetap. |
| R-30 | PASS: tidak mengambil layout/aset dari produk lain. |
| R-31 | PASS: seluruh keputusan utama dan kapan efek nonaktif tercatat pada tabel B/C. |

Checklist UI/human/layoutmobile: struktur dan kontras sudah diperiksa melalui kode/checker; reflow 360px, zoom 200%, keyboard HP, ketajaman angka, console, dan click-through **PENDING**. Tidak ada PASS browser yang disimpulkan dari lint/build atau simulasi hook.

### F. Handoff click-through Claude

Jalankan checklist interaksi putaran 1 pada bagian 7 di atas, ditambah pemeriksaan khusus berikut. Semua baris di bawah **PENDING**:

| Area | Pemeriksaan / hasil yang diharapkan |
|---|---|
| Dropdown | Pada 360/1440/1920px light dan dark, buka akun dan Export; ukur left/right terhadap viewport dan scrollWidth halaman. Uji nama/email panjang, resize saat terbuka, Escape, buka lagi, aksi export/Keluar. |
| Sort | Tanggal/Nominal sama ukuran/bobot dengan header lain; Nominal rata kanan; kedua arah sort, aria-sort, Tab/Enter bekerja. |
| Saldo | Dashboard dan halaman lain dengan SummaryCards: pointer di pusat/tepi/sudut, kembali datar saat keluar, angka positif/negatif/panjang tetap tajam dan terbaca di dua tema. Tidak ada scroll horizontal akibat perspektif. |
| Motion | Emulasi hover none/pointer coarse dan reduced motion, termasuk menggantinya ketika pointer berada di Saldo: tilt/kilau/angkat berhenti; kontrol tetap berfungsi dengan sentuhan dan keyboard. |
| Ubin/sidebar | Ikon kategori/custom/picker, label panjang, nav aktif, hover/tekan/fokus; tidak ada ikon dekoratif yang masuk urutan Tab. |
| Klik/hover | Baris laporan membuka detail, breakdown memfilter transaksi, kalender membuka hari, area ringkasan budget menuju transaksi; Edit/Hapus budget tetap aksi terpisah. Area statis tidak ikut naik. |
| Budget | Status Aman/Hampir habis/Terlampaui, 0%, 80%, ≥100%; tekstur tidak menutupi angka/label. |
| Auth/mobile | Login/Register light/dark, 360px dan zoom 200%, input/fokus/validasi; dua kertas tetap dalam lebar viewport dan tidak memblokir kontrol. |

**Status penyerahan: implementasi dan verifikasi otomatis selesai; belum dicek di browser. R-35: PENDING, click-through oleh Claude.**

## Review Claude (Chrome DevTools, 29 Sep 2026): R-35 click-through

Dicek di `npm start` milik user (port 8001/8010, tidak dimatikan). Viewport 1920×1080, 1440×900, 360×740 (mobile + touch); light & dark.

| Cek | Hasil |
|---|---|
| A1 dropdown pengguna @1920px | Sebelumnya x=1829→1989 (keluar layar 69px, scroll horizontal). Sekarang 1713→1873; `scrollWidth` 1905 (tanpa scroll horizontal); Esc menutup menu |
| A1 dropdown Export @1920px | 1357→1517, di dalam layar |
| A1 dropdown pengguna @360px | 184→344, di dalam layar |
| A2 header tabel Transaksi | Semua header 13px/600; "Nominal" rata kanan |
| B1 tilt Saldo (pointer mouse) | `data-tilting` aktif, `--tilt-x/y` 3,6°, kilau muncul; kembali datar saat pointer keluar. Yang miring hanya lapisan latar + kilau; angka tetap datar & tajam |
| B1 tilt pada pointer sentuh | Tidak aktif (`data-tilting` tidak terpasang) |
| B2–B4 | Ubin ikon timbul di sidebar & kartu; menu aktif timbul; Saldo 2 kolom dengan lapisan kertas bertumpuk |
| B7 login | Lembar bertumpuk di belakang panel (light & dark) |
| Grafik dashboard | Normal; distorsi di screenshot full-page putaran 1 adalah artefak screenshot, bukan bug |
| Mobile 360px | `scrollWidth` 360, 0 elemen meluber, 0 target sentuh < 44px |
| Lighthouse | Accessibility **100** / Best Practices **100** di Dashboard (desktop), Transaksi (mobile), Login dark (mobile). SEO 63 = `noindex` yang disengaja |
| Console | Bersih |
| lint / build | 0 warning / sukses (JS 341 kB, gzip 98 kB) |
| Backend | Tidak ada perubahan |

Token login uji Claude dihapus per ID (6, 7, 8); sesi user tidak disentuh.
