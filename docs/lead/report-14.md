# Report Phase 14: Dashboard washitsu dan transisi shoji

Tanggal: 29 September 2026. Executor: Codex. Baseline: `0482dd7`. Reviewer: Claude (Chrome).

Implementasi frontend selesai. Lint, build, check-locales, verify-phase13, verify-phase14, dan tes backend lulus. Backend: **89 passed, 851 assertions**. Kontras: **240/240 pasangan PASS**. Tambahan seluruh CSS/JS: **2.569 byte gzip**, tanpa font, gambar, atau dependensi baru.

**Belum dicek di browser. R-35: PENDING, click-through oleh Claude.** Angka viewport di bawah adalah perhitungan CSS, bukan pengukuran DOM. ScrollHeight, ketajaman grafik pada layar pendek, kelancaran animasi, console browser, dan Lighthouse accessibility 100 belum diverifikasi ulang.

Tidak commit, tidak menjalankan atau mematikan server di port 8001/8010. Perubahan aplikasi hanya di `frontend/`; laporan ini merupakan tambahan dokumentasi yang diminta. Backend, API, route, query URL, dan nama field tidak diubah. Perubahan awal milik pengguna pada DESIGN.md dan file brief phase-14.md tetap utuh. Tes backend memakai SQLite `:memory:` dari phpunit.xml.

## 1. Design Read dan susunan dashboard

Dibaca: AGENTS.md, DESIGN.md termasuk Tambahan Phase 14, CATATAN.md, README.md, phase-14.md, report-11/12/13, serta skill antislop core, UI, human, layoutmobile, copywriting, dan code. Antislop diterapkan selama pengerjaan sesuai jawaban pemilik dalam brief, tanpa menanyakan ulang.

Reading this as: dashboard keuangan pribadi untuk individu, dengan bahasa visual washitsu yang hangat, **ENERGY 2 / RHYTHM 2 / MOTION 2**. Bento dipakai sesuai permintaan eksplisit pemilik: grafik memerlukan bidang lebar, kategori memerlukan panel tinggi, sedangkan ringkasan hanya memerlukan beberapa baris angka. Ini juga menjadi alasan R-05, bukan grid dekoratif dengan isi buatan.

### Desktop, minimal 1280 × 720 CSS px

`AppLayout` memberi class `app-main-dashboard` hanya pada route `/`. Halaman lain mempertahankan lebar maksimum, padding, dan tata letak sebelumnya.

Dashboard memakai seluruh lebar setelah sidebar 252px, dengan padding 16px di setiap sisi. `.dashboard-room` memiliki tinggi `calc(100dvh - 96px)`: topbar 64px ditambah padding vertikal 32px. Kontainer flex mengalokasikan tinggi intrinsik bagi header, strip sapaan, dan ringkasan; sisa tinggi diberikan ke grid panel. Tidak memakai `overflow: hidden` pada halaman untuk menyembunyikan konten yang tidak muat.

Susunan ringkasan empat kolom `1.6fr 1fr 1fr 1fr`, dua baris `minmax(90px, auto)` dan `minmax(60px, auto)`, gap 12px:

```text
Saldo        Pemasukan       Pengeluaran        Jumlah transaksi
Saldo        Rata-rata/hari  Rasio pengeluaran (dua kolom)
```

Saldo tetap count-up dan memiliki tilt lapisan permukaan dari Phase 11/12. Ikon Saldo diperkecil pada desktop; ikon tiga metrik pendukung disembunyikan secara visual karena labelnya sudah menjelaskan data. Pemasukan, pengeluaran, dan Saldo tetap menampilkan perbandingan periode lengkap. Ringkasan tidak memiliki tinggi tetap yang memotong label saat bahasa berubah.

Panel bawah memakai tiga kolom `repeat(3, minmax(0, 1fr))` dan dua baris `minmax(0, 1.7fr) minmax(0, 1fr)`, gap 12px:

```text
Grafik pemasukan/pengeluaran (dua kolom)   Kategori
Pengeluaran terbesar       Budget        Kategori
```

Grafik menjadi bidang terbesar; kategori mendapat tinggi kedua baris untuk doughnut dan daftar. `maintainAspectRatio: false` yang sudah ada tetap; Dashboard mengirim `height="100%"`. Wrapper grafik desktop diposisikan dalam card-body agar canvas mengikuti ruang yang dialokasikan grid, tanpa ukuran intrinsik canvas memperbesar baris.

Kategori, pengeluaran terbesar, dan budget memiliki scroll internal, scrollbar, serta garis hinoki pada tepi bawah. Area scroll memakai `tabIndex=0`, `role=region`, label aksesibel terjemahan, dan outline fokus 3px. Tidak ada penanganan wheel/touch yang mencegah scroll berpindah ke halaman.

### Perhitungan empat viewport

Asumsi untuk estimasi panel: zoom 100%, root font 16px, topbar 64px, header 68px, strip sapaan sekitar 31px, ringkasan sekitar 168px termasuk gap. Tiga sela vertikal total 36px. Estimasi tinggi panel bawah adalah `H - 399px`; tinggi aktual menyesuaikan pembungkusan teks. Dua baris panel berbagi sisa tinggi setelah gap 12px dengan rasio 1.7:1.

| Viewport | Lebar dashboard, W - 284 | Tinggi dashboard, H - 96 | Estimasi panel bawah | Estimasi baris grafik / daftar | Total shell yang ditargetkan |
|---|---:|---:|---:|---:|---:|
| 1280 × 720 | 996px | 624px | 321px | 194.6 / 114.4px | 720px |
| 1366 × 768 | 1082px | 672px | 369px | 224.8 / 132.2px | 768px |
| 1440 × 900 | 1156px | 804px | 501px | 307.9 / 181.1px | 900px |
| 1920 × 1080 | 1636px | 984px | 681px | 421.2 / 247.8px | 1080px |

Target keempat ukuran: tanpa scroll halaman pada state data normal. Pada 1366 × 768 implementasi juga menargetkan tanpa scroll, lebih ketat daripada toleransi brief. **Hasil ukur scroll aktual di keempat viewport: belum dicek di browser.** Lebar kolom panel masing-masing sekitar 324, 352.7, 377.3, dan 537.3px. Pada 1280 × 720 canvas grafik diperkirakan sekitar 128px setelah header, border, dan inset; keterbacaan tick/tooltip pada ukuran minimum menjadi langkah review khusus.

Ruang pada layar besar masuk ke grafik dan daftar, bukan margin kosong: batas max-width 1320px lama dilepas hanya untuk Dashboard desktop.

### Tablet dan HP

| Rentang | Susunan | Scroll |
|---|---|---|
| 768–1279px | Ringkasan dua kolom, Saldo selebar dua kolom. Grafik dan budget selebar dua kolom; kategori dan pengeluaran terbesar berdampingan. | Halaman boleh bergulir; daftar internal dibatasi 340px. |
| <768px | Satu kolom: sapaan, Saldo, pemasukan/pengeluaran/jumlah/rata-rata/rasio, grafik, kategori, terbesar, budget. | Daftar mengikuti tinggi isi, tanpa scroll internal atau pencegahan scroll halaman. |
| Lebar ≥1280 tetapi tinggi <720px | Memakai susunan tablet yang mengalir. | Tidak memaksa grid pendek ketika zoom atau jendela mengurangi tinggi layar. |

Mobile memakai padding shell 16px, gap 12px, angka boleh membungkus, judul/deskripsi/kategori panjang tidak dipotong menjadi lebar tetap. Target tombol/tautan tetap minimal 44px; padding bawah dan scroll-padding milik BottomNav tetap mengikuti tinggi terukur serta safe area. Uji overflow 360px dan zoom 200% masih PENDING.

### State dan regresi

- Skeleton Dashboard sekarang memiliki enam posisi ringkasan dan empat panel dengan grid yang sama; tanpa nominal sementara. Status `Memuat…`, aria-busy, dan reduced-motion shimmer tetap.
- Periode kosong menampilkan EmptyState dan tombol Catat di posisi grafik; kategori/terbesar menunjukkan pesan kosong dan Budget tetap bisa dikelola.
- Gagal pemuatan awal memakai ErrorState dan retry. Gagal refetch mempertahankan data dengan alert. Gagal perbandingan tetap mempunyai retry terpisah.
- Bila ada alert/retry tambahan, tinggi dashboard boleh mengalir dan panel bawah minimal 360px agar pesan serta kontrol tidak menindih data. Batas satu layar dihitung untuk state normal, bukan dengan menyembunyikan error.
- Refetch memakai status terjemahan berwarna penuh; tidak meredupkan teks data di atas tekstur.
- PeriodPicker, parameter URL, link Lihat transaksi/Semua/Kelola/Atur budget, shortcut N, tombol Catat yang sudah ada, bottom nav, count-up, perbandingan, heatmap, undo, bahasa dan tagline dipertahankan. Tidak menambahkan kembali tombol Catat duplikat Topbar yang sudah dihapus pada baseline Phase 13.

## 2. Material, token, dan alasan R-31

Token baru di `frontend/src/styles/tokens.css`; material dan grid berada di `styles/washitsu.css`, dimuat setelah stylesheet lama. Palet teks, status, dan permukaan Phase 13 tetap.

| Token `--pidu-*` | Terang | Gelap | Alasan |
|---|---|---|---|
| hinoki | #d4bea3 | #65503e | Garis kayu membatasi kelompok data tanpa menyaingi angka. |
| fiber | #ddcbbd | #795d4b | Serat mengambil nada kayu yang dekat dengan permukaan agar kontras teks terjaga. |
| fiber-alpha | 0.025 | 0.025 | Opasitas 2.5% memberi detail material dengan gangguan minimal. |
| shoji-paper | #f5ead7 | #47372a | Kertas terang atau ruang sumi meredup mengikuti tema tujuan. |
| shoji-light | #fffaf4 | #8e6847 | Cahaya di balik kertas memberi kesan tembus cahaya tanpa memperlihatkan pergantian UI di bawahnya. |
| shoji-frame | #b29978 | #30251d | Rangka dan kisi membedakan panel pintu dari permukaan data. |

| Keputusan | Teknik dan alasan |
|---|---|
| Washi | Repeating linear gradient 7°, serat 1px dengan pengulangan 11px pada kartu dan topbar; memberi karakter kertas yang konsisten antarhalaman. |
| Tatami | Dua repeating linear gradient tegak lurus, interval 4px dan 12px di app-content serta area nav sidebar; anyaman menempatkan panel di atas latar yang tenang. |
| Hinoki | Border kartu/sidebar/topbar dan garis ganda 3px pada header panel/brand; menjelaskan pembagian ruang serta batas daftar yang bergulir. |
| Kumiko | Kisi CSS vertikal dan horizontal pada kedua pintu; menguatkan bentuk shoji ketika tema berubah. |
| Tokonoma | Saldo membentang dua baris, permukaan peach, garis hinoki atas dan shadow pendek; uang tersisa menjadi fokus pertama. |
| Andon | Satu radial gradient statis pada Saldo gelap, dari shine-peak lama #573e31 ke peach #4a3329; membantu menemukan panel utama pada tema malam. |
| Ma | Gap antarpanel 12px dan padding panel 8–16px; ruang mengelompokkan data tanpa membuat dashboard panjang. |
| Tipografi | Fraunces tetap pada judul, sistem sans pada angka/isi; mempertahankan karakter Pidu dan lebar angka yang mudah dipindai. Tidak menambah font. |
| Radius | Menggunakan token kartu/kontrol lama 20/12px dan radius 8px pada tepi scroll; kartu, kontrol, dan pembatas tetap punya bentuk berbeda. |
| Ikon | Hanya ikon Bootstrap yang sudah ada; glyph dompet, kategori, dan arus uang mengikuti fungsi. Tidak membuat file ikon/aset baru. |

Tekstur statis, tidak memakai backdrop-filter. Animasi shoji hanya transform; bayangan dan gradient tidak dianimasikan. Kilau/tilt Saldo lama tetap tunduk pada pointer fine, hover, serta reduced motion. Border hinoki bersifat dekoratif, bukan satu-satunya penanda kontrol; batas kontrol memakai control-line, fokus memakai focus.

## 3. Arsitektur transisi shoji

`ThemeProvider` memasang satu portal ke document.body untuk seluruh aplikasi, termasuk Login/Register yang memang sudah memiliki toggle. Overlay `position: fixed; inset: 0`, z-index 2147483647, `aria-hidden=true`, tanpa kontrol/tab stop. Atribut `hidden` melepasnya dari tampilan saat tidak aktif; pointer-events memblokir klik hanya ketika overlay muncul.

`utils/shoji.js` menyediakan controller yang menerima dua elemen pintu, callback penerapan tema, dan pembacaan preferensi motion. Native Web Animations API menggeser kiri dari -101%, kanan dari +101%; tidak ada library animasi baru.

| Tahap | Durasi | Perilaku |
|---|---:|---|
| Tutup | 380ms | Kedua panel menuju translateX(0). |
| Tertutup | 120ms | Posisi dipertahankan; controller menunggu kedua animasi selesai. |
| Terapkan tema | Setelah 500ms | data-bs-theme dan pidu_theme ditulis sebelum setTheme memicu render Chart.js. |
| Buka | 420ms | Panel keluar ke kiri/kanan, kemudian animasi dibersihkan dan overlay disembunyikan. |
| Total | 920ms | Easing `cubic-bezier(0.45, 0, 0.2, 1)` untuk gerakan tutup/buka. |

Tema tujuan dipasang pada overlay sendiri sejak awal sehingga pintu tidak berganti warna mendadak ketika root theme berubah. Menuju gelap memakai kertas cokelat hangat dengan cahaya andon; menuju terang memakai kertas krem bercahaya. Lapisan dasar pintu tetap opak agar data di baliknya benar-benar tertutup; gradasi di balik kisi menyimulasikan cahaya menembus kertas. Lebar masing-masing panel 50% + 1px menghindari celah subpixel di tengah.

Lock controller dipasang sinkron sebelum animasi mulai. Klik berikutnya saat aktif diabaikan, bukan membentuk antrean. Hanya satu commit tema per transisi. Setelah selesai, fokus kembali ke tombol pemicu jika masih terpasang. Pembatalan animasi yang tidak terduga menerapkan tema tujuan lalu melepaskan overlay; unmount membatalkan tanpa update state atau memindahkan fokus.

Reduced motion mengganti tema langsung tanpa menjalankan animasi. Bila preferensi berubah menjadi reduce ketika pintu sedang berjalan, controller menyelesaikan transisi langsung dan membersihkan animasi. Browser tanpa Element.animate juga memakai pergantian langsung.

Reload tidak memulai controller: inline script index.html memilih nilai light/dark valid sebelum React dimuat; ThemeProvider memakai nilai tersimpan atau preferensi sistem. Storage diblokir ditangani dengan try/catch. Perbaikan kecil index.html menyamakan fallback nilai storage rusak dengan provider sehingga tema awal tidak berbeda. Label tombol tema ID/EN/SU tetap memakai kamus yang sudah ada.

## 4. Kontras

Perintah: `python frontend/scripts/check-contrast.py`. Script membaca token dan memanggil `.claude/skills/antislop-human/contrast-check.py` untuk setiap pasangan. Selain 132 pasangan baseline, ditambahkan 108 pasangan untuk titik tekstur terpekat: semua tujuh warna teks pada lima permukaan, tambahan permukaan tatami sidebar, serta control-line/focus pada permukaan yang sama, di kedua tema.

Compositing menggunakan serat 2.5%; persilangan dua garis tatami memakai alpha gabungan `1 - (1 - 0.025)^2`. Tabel di bawah menyalin hasil checker untuk seluruh pasangan baru dalam bentuk matriks. Semua rasio terhadap 1; teks minimal 4.5, batas/fokus minimal 3. Permukaan tanpa serat juga tetap diperiksa oleh 132 pasangan baseline sehingga kedua ujung pola tercakup.

| Latar dengan serat | Terang | Gelap |
|---|---|---|
| canvas-fiber | #f6efe6 | #251f1b |
| surface-fiber | #fef9f3 | #2f2622 |
| recess-fiber | #efe3d6 | #3c312a |
| peach-fiber | #f5d8c5 | #4b342a |
| shine-peak-fiber | #fae9dc | #583f32 |

| Tema / depan | Hex depan | Canvas | Surface | Recess | Peach | Shine-peak | Ambang / hasil |
|---|---|---:|---:|---:|---:|---:|---|
| Light ink | #352b26 | 12.07 | 13.15 | 10.90 | 10.17 | 11.64 | 4.5 PASS |
| Light muted | #6d5b50 | 5.64 | 6.15 | 5.10 | 4.75 | 5.44 | 4.5 PASS |
| Light accent | #994b32 | 5.40 | 5.89 | 4.88 | 4.55 | 5.21 | 4.5 PASS |
| Light accent-hover | #7c3824 | 7.52 | 8.19 | 6.79 | 6.34 | 7.25 | 4.5 PASS |
| Light income | #306747 | 5.83 | 6.35 | 5.27 | 4.91 | 5.62 | 4.5 PASS |
| Light expense | #a13d32 | 5.70 | 6.21 | 5.15 | 4.80 | 5.50 | 4.5 PASS |
| Light warning | #805b13 | 5.38 | 5.86 | 4.86 | 4.53 | 5.19 | 4.5 PASS |
| Light control-line | #8c7362 | 3.88 | 4.23 | 3.51 | 3.27 | 3.74 | 3 PASS |
| Light focus | #994b32 | 5.40 | 5.89 | 4.88 | 4.55 | 5.21 | 3 PASS |
| Dark ink | #f7ecdf | 13.96 | 12.68 | 10.82 | 9.88 | 8.30 | 4.5 PASS |
| Dark muted | #cebaaa | 8.70 | 7.90 | 6.74 | 6.16 | 5.17 | 4.5 PASS |
| Dark accent | #f1ad88 | 8.58 | 7.79 | 6.65 | 6.07 | 5.10 | 4.5 PASS |
| Dark accent-hover | #ffc6a4 | 10.74 | 9.76 | 8.33 | 7.60 | 6.38 | 4.5 PASS |
| Dark income | #9dcea9 | 9.17 | 8.33 | 7.11 | 6.49 | 5.45 | 4.5 PASS |
| Dark expense | #ffa99a | 8.83 | 8.02 | 6.84 | 6.25 | 5.25 | 4.5 PASS |
| Dark warning | #e6c378 | 9.64 | 8.75 | 7.47 | 6.82 | 5.73 | 4.5 PASS |
| Dark control-line | #a58b78 | 5.09 | 4.62 | 3.94 | 3.60 | 3.02 | 3 PASS |
| Dark focus | #f1ad88 | 8.58 | 7.79 | 6.65 | 6.07 | 5.10 | 3 PASS |

```text
240/240 pasangan PASS. Ambang 3:1 untuk batas kontrol, fokus, centang, dan isian budget.
```

Tambahan pemeriksaan dua garis tatami pada permukaan sidebar, bukan hanya canvas: latar terpekat light #fdf8f1, dark #312823.

| Depan | Light | Dark | Ambang / hasil |
|---|---:|---:|---|
| ink | 13.03 | 12.36 | 4.5 PASS |
| muted | 6.09 | 7.70 | 4.5 PASS |
| accent | 5.83 | 7.59 | 4.5 PASS |
| accent-hover | 8.12 | 9.51 | 4.5 PASS |
| income | 6.30 | 8.12 | 4.5 PASS |
| expense | 6.15 | 7.81 | 4.5 PASS |
| warning | 5.80 | 8.53 | 4.5 PASS |
| control-line | 4.19 | 4.50 | 3 PASS |
| focus | 5.83 | 7.59 | 3 PASS |

Pemeriksaan awal menangkap tiga pasangan yang turun akibat warna serat terlalu kontras: accent/peach, warning/peach, dan control-line/shine-peak. Warna serat diperbaiki sebelum hasil akhir di atas. Tidak menurunkan ambang checker.

Hinoki dan tiga token shoji tidak dipakai untuk teks, status, atau batas kontrol. Pintu sepenuhnya aria-hidden dan tidak memuat informasi; kontras kisi tidak dinyatakan sebagai kontras teks. Pemasukan/pengeluaran tetap hijau/merah bata bertanda label, kategori tetap memakai accessibleColor dan nama kategori. Heatmap dan pasangan semantik lama tetap lulus checker.

## 5. Verifikasi dan bundle

Semua perintah akhir exit 0. Build baseline dan final membutuhkan izin subprocess Windows karena Vite terkena `spawn EPERM` dalam sandbox. Check-locales juga memerlukan izin subprocess PHP untuk membandingkan snapshot server. Tidak ada perubahan konfigurasi sandbox, dependensi, atau server aplikasi.

```text
> npm --prefix frontend run lint
> frontend@0.0.0 lint
> oxlint
(exit 0, tanpa warning/error)

> node frontend/scripts/check-locales.mjs
Server locale snapshot matches all three PHP catalogs.
PASS: 487 keys in id/en/su; values, interpolation, source references and server snapshot checked.

> node frontend/scripts/verify-phase13.mjs
PASS saved locale and html lang are applied during module initialization
PASS locale cycle persists, notifies subscribers and updates language
PASS date and month select labels change while Rupiah remains Indonesian
PASS greetings and previous calendar month retain Phase 12 behaviour
PASS existing client validation and server feedback retranslate
PASS combined import summaries translate every sentence
PASS interpolated user text remains unchanged
PASS API interceptor always uses the current language
PASS blocked storage still allows switching and invalid storage falls back to id
9/9 checks passed.

> node frontend/scripts/verify-phase14.mjs
PASS initial overlay is hidden and theme is not mutated
PASS both doors must close before a single commit; repeated clicks are ignored; focus returns
PASS reduced motion applies immediately without doors
PASS unsupported animation applies immediately without doors
PASS changing motion preference while closing finishes once and releases overlay
PASS changing motion preference while opening never toggles twice
PASS unmount cancels pending work without setting state or focusing a removed control
PASS animation rejection still applies the requested theme and releases the click blocker
8/8 checks passed.

> cd backend; php artisan test
PASS Tests\Unit\ExampleTest
PASS Tests\Feature\Api\AuthTest
PASS Tests\Feature\Api\BackupTest
PASS Tests\Feature\Api\BudgetTest
PASS Tests\Feature\Api\CategoryTest
PASS Tests\Feature\Api\DashboardTest
PASS Tests\Feature\Api\ErrorHandlingTest
PASS Tests\Feature\Api\ExportTest
PASS Tests\Feature\Api\ImportTest
PASS Tests\Feature\Api\IsolationTest
PASS Tests\Feature\Api\LocaleTest
PASS Tests\Feature\Api\ReportTest
PASS Tests\Feature\Api\TransactionTest
PASS Tests\Feature\ExampleTest
Tests: 89 passed (851 assertions)
Duration: 27.02s

> git -c core.safecrlf=false diff --check
(exit 0)
```

Tidak ada frasa produk baru: label region dan status refresh memakai kunci ID/EN/SU existing. Tidak mengubah katalog atau snapshot server. Tes Phase 14 memakai animation promises yang dikendalikan sebagai stub; menguji controller aktual, bukan durasi/render/fokus nyata dalam browser.

Output build akhir:

```text
> npm --prefix frontend run build
> frontend@0.0.0 build
> vite build
vite v8.3.1 building client environment for production...
✓ 184 modules transformed.
dist/index.html                                      1.27 kB | gzip:   0.67 kB
dist/assets/fraunces-latin-700-normal-CEOla-zY.woff2   18.21 kB
dist/assets/bootstrap-icons-mSm7cUeB.woff2           134.04 kB
dist/assets/bootstrap-icons-BeopsB42.woff            180.28 kB
dist/assets/index-YFRke1sP.css                       369.53 kB | gzip:  56.77 kB
dist/assets/reports-C9vVsJrl.js                        0.54 kB | gzip:   0.20 kB
dist/assets/YearlyReportPage-B-uUZJBK.js               0.91 kB | gzip:   0.56 kB
dist/assets/MonthlyReportPage-BTPWvCk4.js              1.45 kB | gzip:   0.84 kB
dist/assets/WeeklyReportPage-Bj33PMR6.js               1.47 kB | gzip:   0.78 kB
dist/assets/DailyReportPage-A7dI6731.js                1.73 kB | gzip:   0.94 kB
dist/assets/PeriodPicker-kzfgU3fC.js                   1.92 kB | gzip:   0.83 kB
dist/assets/DayDetailModal-3SnoEdJ6.js                 2.78 kB | gzip:   1.02 kB
dist/assets/ReportTable-B5et8Lej.js                    2.97 kB | gzip:   1.10 kB
dist/assets/CalendarPage-C1-Cn1mI.js                   3.85 kB | gzip:   1.60 kB
dist/assets/DashboardPage-BNbqqjX9.js                 10.03 kB | gzip:   3.32 kB
dist/assets/locales-BpHFwp8v.js                       40.00 kB | gzip:  12.18 kB
dist/assets/IncomeExpenseChart-BTW3dQXW.js           187.97 kB | gzip:  65.52 kB
dist/assets/index-C5xUt3bl.js                        465.84 kB | gzip: 142.14 kB
✓ built in 445ms
```

Pengukuran berikut menjumlahkan seluruh file .js/.css di dist/assets dan gzip setiap file menggunakan Node zlib.gzipSync default. Metode sebelum/sesudah identik; angka gzip Vite sedikit berbeda karena opsi kompresinya. Angka ini bukan ukuran transfer jaringan atau pengukuran performa HP.

| Kelompok | Sebelum byte | Sesudah byte | Selisih |
|---|---:|---:|---:|
| Semua JS mentah | 718371 | 721514 | +3143 |
| Semua CSS mentah | 360348 | 369536 | +9188 |
| Semua JS gzip | 228110 | 229013 | +903 |
| Semua CSS gzip | 54647 | 56313 | +1666 |
| Total CSS + JS gzip | 282757 | 285326 | **+2569** |

Tambahan 2.57 kB gzip berada di bawah sasaran 25 kB. Font dan aset lain tetap. Tidak mengukur FPS, CPU/GPU, atau waktu render browser.

## 6. Delivery Gate antislop

PASS source berarti inspeksi kode; PASS test berarti hasil otomatis pada bagian 4/5. Tidak menyamakan keduanya dengan pemeriksaan browser.

### Hard Gate

| Aturan | Status dan bukti |
|---|---|
| R-02 | PASS: tidak menambah teks UI baru atau em dash; check-locales lolos. |
| R-03 | PASS source: reflow satu/dua/empat kolom, min-width 0, label membungkus, target kontrol 44px; ukuran DOM dan zoom PENDING. |
| R-17 | PASS: nominal, persen, dan jumlah tetap dari API. |
| R-18 | PASS: tidak ada testimoni atau orang fiktif. |
| R-23 | PASS: layout/tekstur/pintu diminta eksplisit; tanpa aset gambar baru. |
| R-24 | PASS source: link Dashboard mempertahankan route dan query existing. |
| R-25 | PASS test: 240 pasangan kontras termasuk titik tekstur terpekat. |
| R-26 | PASS source/test: semua kontrol punya handler/link; state animasi diuji, klik browser PENDING. |
| R-27 | PASS source: skeleton, empty, error/retry dan refetch tetap; layout skeleton mengikuti grid. |
| R-28 | PASS: tidak menambah FAQ. |
| R-32 | PASS source: scroll region berlabel bisa Tab, fokus 3px; controller mengembalikan fokus, keyboard browser PENDING. |
| R-33 | PASS: UI ditulis langsung melalui patch source; script verifikasi tidak menulis ulang UI/CSS. |
| R-34 | PASS source/test: dua tema lengkap dan kontras lolos, render nyata PENDING. |
| R-35 | **PENDING: build lulus, belum dicek di browser; click-through dan Lighthouse oleh Claude.** |
| R-36 | PASS: angka bundle/kontras/tes berasal dari perintah; estimasi viewport dilabeli perhitungan. |
| R-37 | PASS: DESIGN.md dan brief mendasari Design Read sebelum implementasi. |
| R-38 | PASS: tidak menambah konten, statistik, atau fitur fiktif. |

### Purpose Gate

| Aturan | Status dan bukti |
|---|---|
| R-01 | PASS: gradient hanya cahaya Saldo dan material pintu, alasan di bagian 2. |
| R-04 | PASS: ikon existing mengikuti dompet, kategori, dan arus uang. |
| R-06 | PASS: Fraunces dan font sistem dipertahankan untuk identitas dan keterbacaan. |
| R-07 | PASS: pola washi/tatami/kumiko diminta pemilik; opasitas dibatasi dan diperiksa. |
| R-08 | PASS: tanpa tambahan panah CTA dekoratif. |
| R-09 | PASS: badge kategori dan status existing tetap bermakna data. |
| R-10 | PASS: tidak menambah glassmorphism atau backdrop-filter. |
| R-12 | PASS: shadow baru hanya pendek pada Saldo; panel lain bertepi kayu. |
| R-13 | PASS: glow andon hanya pada panel utama; pintu muncul sementara saat transisi. |
| R-14 | PASS: lebar/tinggi panel mengikuti jenis data, bukan kartu seragam. |
| R-19 | PASS source/test: gerak shoji hanya setelah toggle, reduced motion langsung, tanpa loop baru. |
| R-22 | PASS: tanpa ilustrasi/aset baru. |

### Liveliness

| Item | Status dan bukti |
|---|---|
| Dial eksplisit | PASS: ENERGY 2 / RHYTHM 2 / MOTION 2. |
| Konsistensi dial | PASS source: permukaan halus, Saldo dominan, gerak saat perubahan tema; evaluasi visual PENDING. |
| Titik fokus | PASS source: Saldo membentang dua baris dengan permukaan peach. |
| Whitespace struktural | PASS source: gap 12px memisahkan panel; viewport besar memperbesar bidang data. |
| Aksen disengaja | PASS: terakota tetap untuk aksi, glow hangat untuk Saldo. |
| Motif identitas | PASS source: kertas, hinoki, dompet/Pidu/Piduiteun tetap sekeluarga. |
| Design Read | PASS: dinyatakan sebelum implementasi dan dicatat pada bagian 1. |

### Craftsmanship dan Quality Locks

| Item | Status dan bukti |
|---|---|
| C-1 | PASS: alasan layout, tekstur, font, warna, jarak, dan animasi tertulis. |
| C-2 | PASS source/test: link/handler tetap, transisi diuji; interaksi browser PENDING. |
| C-3 | PASS: seluruh panel adalah data Dashboard existing. |
| C-4 | PENDING browser: source menangani state, breakpoint, tema, keyboard, motion; bukti perangkat belum ada. |
| C-5 | PASS: hasil otomatis dibedakan dari hitungan dan review yang belum dilakukan. |
| R-05 | PASS: bento diminta pemilik dan ukuran mengikuti kebutuhan grafik/daftar. |
| R-11 | PASS: memakai skala radius existing, bukan semua pil. |
| R-15 | PASS: Lihat transaksi, Semua, Kelola, Atur budget, Coba lagi tetap menuju aksi nyata. |
| R-16 | PASS: tidak menambah copy pemasaran. |
| R-20 | PASS source: material washitsu mendukung identitas hangat Pidu; persetujuan visual PENDING. |
| R-21 | PASS source/test: dua tema dan toggle auth/aplikasi memakai provider sama. |
| R-29 | PASS: tambahan netral kayu/kertas; aksen terakota dan status semantik tetap. |
| R-30 | PASS: tidak menggunakan aset/referensi produk lain. |
| R-31 | PASS: alasan satu baris keputusan utama di bagian 1–3. |

Checklist UI/human/layoutmobile/copywriting/code: kontras, struktur, label, source order, motion controller, dan copy diperiksa. Reflow aktual, keyboard, zoom, keyboard layar HP, console, Lighthouse dan semua interaksi tetap PENDING. Tidak ada klaim PASS browser.

## 7. Click-through Claude

Gunakan server milik pengguna tanpa menjalankan atau mematikannya. Catat hasil setiap kontrol, console, viewport, tema, bahasa, dan screenshot. Semua langkah berikut PENDING.

1. Buka Dashboard periode berisi data pada **1280×720, 1366×768, 1440×900, 1920×1080**, zoom 100%, light/dark. Ukur documentElement.scrollHeight/clientHeight dan scrollWidth/clientWidth, serta rect setiap panel. Target tidak ada scroll halaman; laporkan angka nyata khusus 1366×768. Periksa tidak ada celah kosong besar pada 1920×1080.
2. Ulangi keempat ukuran dengan **IN, EN, SU**. Uji preset bulanan, tahunan dan rentang custom beserta dua input tanggal. Pastikan header, perbandingan, rasio, nilai negatif dan nominal panjang utuh. Periksa keterbacaan grafik pada 1280×720: tick, legenda dan tooltip tetap bisa dipakai.
3. Ukur kategori/terbesar/budget: scrollHeight panel boleh lebih tinggi dari clientHeight, tetapi halaman tidak ikut memanjang. Tab ke setiap region; ArrowDown/PageDown menggeser daftar, Tab berikutnya bisa keluar. Garis tepi dan fokus harus terlihat. Klik tiap kategori untuk membuka transaksi terfilter; kembali lewat Back.
4. Klik **Lihat transaksi**, **Semua** dan **Kelola**: cocokkan periode/type/category/sort URL yang dipertahankan dan tujuan budget. Klik **Atur budget** saat kosong. Semua wajib benar-benar berpindah ke halaman tujuan.
5. Pada **768×1024, 992×768 dan 1279×900**, verifikasi dua kolom, scroll wajar, sidebar/nav sesuai breakpoint lama. Pada **360×740** dan 390×844, verifikasi satu kolom sesuai urutan brief, scrollWidth sama dengan viewport, daftar tidak bergulir sendiri, semua target ≥44px, dan budget terakhir bisa dilihat di atas bottom nav.
6. Uji zoom **200%** pada desktop dan HP, nama akun/kategori/deskripsi panjang, keyboard layar untuk tanggal custom, rotate/resize ketika halaman terbuka. Tidak boleh ada teks tertutup atau angka terpotong.
7. Throttle request Dashboard untuk skeleton awal dan refetch. Skeleton mengikuti bento, status tersedia untuk pembaca layar, refetch mempertahankan data. Pilih periode kosong; tombol **Catat transaksi** membuka form. Blokir request utama dan pembanding secara terpisah, klik **Coba lagi**, pastikan error tidak menindih panel dan data kembali.
8. Klik tema light→dark lalu dark→light pada Dashboard. Rekam sekitar **920ms**: pintu datang dari kiri/kanan, rapat, tema berubah saat tertutup, lalu terbuka. Pintu menuju dark meredup dengan cahaya hangat; menuju light krem terang. Periksa tidak ada celah tengah, kedip, atau overlay tertinggal.
9. Klik ganda/berulang pada toggle sebelum pintu selesai: satu pergantian saja. Aktifkan toggle dengan Enter dan Space; setelah selesai fokus tetap pada toggle dan aria-label menyebut tema tujuan berikutnya dalam tiga bahasa. Cek Chart.js memakai warna tema baru pada sumbu, legenda, batang, doughnut dan tooltip.
10. Uji toggle pada **Login dan Register**, light/dark serta IN/EN/SU, termasuk 360px. Jangan menambahkan toggle baru. Reload setiap tema; tema awal langsung benar tanpa pintu. Uji pidu_theme invalid dan storage diblokir pada profil uji terpisah.
11. Emulasi **prefers-reduced-motion: reduce**: tema langsung berganti tanpa pintu; count-up, tilt, shimmer dan chart mengikuti preferensi lama. Ubah preferensi menjadi reduce ketika pintu sedang menutup dan ketika membuka; overlay harus hilang, tema tujuan tetap, klik kembali berfungsi.
12. Uji lapisan pintu saat toast masih tampil; tidak ada toast/nav/modal yang muncul di atas pintu. Pastikan selesai animasi tidak meninggalkan layer yang memblokir pointer. Jalankan Performance recording di emulasi HP untuk memeriksa frame, repaint tekstur dan memori layer; hasil FPS belum diklaim.
13. Regresi Phase 1–13: N membuka form di desktop, tidak saat mengetik; Catat bottom nav berfungsi; simpan memperbarui dashboard; hapus dan Batalkan memulihkan; heatmap/kalender, laporan, CRUD kategori/budget, impor/export, dropdown pengguna, bahasa dan Piduiteun tetap. Bandingkan halaman lain untuk memastikan hanya material shell/kartu berubah.
14. Periksa console/network, seluruh alur keyboard termasuk Escape/modal/focus return, lalu ukur Lighthouse accessibility pada Dashboard desktop/mobile dan auth dua tema. Target **100**. R-35 baru boleh PASS setelah mencatat hasil click-through nyata, termasuk temuan/perbaikannya.
