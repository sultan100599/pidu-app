# Report Phase 12: UX dan visual polish

Tanggal: 29 September 2026. Executor: Codex. Baseline: `722d512`. Reviewer berikutnya: Claude (Chrome).

Implementasi 10 fitur selesai. Lint dan build akhir lulus tanpa warning. Pemeriksaan logika 12/12 dan kontras 132/132 lulus. **Belum dicek di browser. R-35: PENDING, click-through oleh Claude.** Lighthouse accessibility 100 belum diukur ulang.

Perubahan aplikasi hanya di `frontend/`, ditambah laporan yang diminta ini. Backend, definisi API, route, dan pembentukan query URL tetap. Tidak commit, tidak menjalankan atau mematikan server di port 8001/8010. File brief `docs/lead/phase-12.md` yang sudah ada tidak diubah.

## 1. Arah dan implementasi per fitur

Dibaca: `DESIGN.md`, `AGENTS.md`, `CATATAN.md`, `README.md`, brief Phase 12, laporan Phase 11 termasuk Putaran 2 dan review Chrome, serta skill antislop core, UI, human, layoutmobile, copywriting, dan code. Antislop diterapkan selama pengerjaan sesuai brief, tanpa menanyakan mode lagi.

Design Read: aplikasi keuangan pribadi untuk individu, hangat dengan motif dompet dan ubin timbul, **ENERGY 2 / RHYTHM 2 / MOTION 2**. Palet dasar, font isi, tilt Saldo, lapisan dompet/auth, dan perbaikan dropdown sebelumnya dipertahankan. Warna baru hanya skala heatmap dan hijau pemasukan yang disesuaikan untuk latar tersebut.

Path di tabel berikut relatif terhadap `frontend/src/` kecuali dinyatakan lain.

`main.jsx` memuat `styles/polish.css` setelah `styles/app.css`, sehingga aturan heatmap mengungguli latar kalender lama pada hari kosong, hari ini, dan hover.

| Fitur | Yang dibuat dan file | Keputusan dan alasan R-31 | Nonaktif / fallback |
|---|---|---|---|
| 1. Catat global | `context/TransactionContext.js`, `components/layout/TransactionProvider.jsx`, `AppLayout.jsx`, `Topbar.jsx`, `BottomNav.jsx`; integrasi `pages/transactions/TransactionsPage.jsx`, `hooks/useFetch.js`, `hooks/useCategories.js`. Satu host `TransactionFormModal` untuk tambah maupun edit. Tombol Topbar berlabel Catat transaksi, petunjuk N terlihat, tooltip, dan `aria-keyshortcuts="n"`. | Form di layout membuat pencatatan tersedia dari setiap halaman tanpa mengganti halaman atau filter aktif. | N hanya desktop ≥992px; diabaikan untuk input, textarea, select, contenteditable, textbox, modal/offcanvas terbuka, modifier Ctrl/Alt/Meta, repeat, dan komposisi IME. Hanya tersedia di layout pengguna yang sudah masuk. |
| 2. Form pintar | `pages/transactions/TransactionFormModal.jsx`, `utils/transactionPreferences.js`, `components/ui/Modal.jsx`. Chip kategori aktif sesuai jenis, ikon ubin, status `aria-pressed` dan centang; select tetap. Metode terakhir menjadi default tambah. Fokus awal dan setelah Simpan & tambah lagi ke Nominal. | Maksimal enam kategori diurutkan menurut frekuensi simpan agar kategori yang benar-benar dipakai cepat dijangkau. | Tanpa riwayat lokal, chip disembunyikan sesuai opsi brief; tidak mengambil seed 50 transaksi. Bila baru ada 1–3 kategori yang dipakai, hanya kategori tersebut ditampilkan. Storage diblokir/rusak: default Cash dan select biasa tetap berfungsi. Edit tetap mengambil metode dari transaksi. |
| 3. Batalkan hapus | `components/TransactionUndo.jsx`, `pages/transactions/TransactionsPage.jsx`, `styles/polish.css`. Dialog konfirmasi tetap; DELETE sukses membuka toast Transaksi dihapus dengan tombol Batalkan, POST pemulihan, toast hasil, dan refetch. | Kesempatan enam detik memperbaiki salah hapus setelah konfirmasi tanpa mengubah kontrak backend. | Hover, fokus keyboard, dan kehilangan fokus jendela menjeda timer. Klik ganda diblokir, tombol menjadi Memulihkan saat POST berjalan. 422 menampilkan pesan field server; error lain memakai pesan server/fallback koneksi. Undo ditutup saat akun berubah. |
| 4. Navigasi bawah | `components/layout/BottomNav.jsx`, `AppLayout.jsx`, `styles/polish.css`. Dashboard, Transaksi, + Catat, Laporan → `/reports/daily`, Budget. Label di bawah ikon. NavLink memberi `aria-current="page"`; item aktif punya garis bawah 3px dan bobot tebal. | Lima tujuan utama dekat jempol, dengan ubin + terangkat sebagai aksi pencatatan. | Hanya <992px. Hamburger/offcanvas untuk halaman lain tetap. Tinggi nav diukur dengan ResizeObserver; padding konten dan batas tinggi toast mengikuti ukuran sebenarnya termasuk safe area. |
| 5. Skeleton | `components/ui/PageSkeleton.jsx`, `SummaryCards.jsx`, `AppLayout.jsx`, `pages/dashboard/DashboardPage.jsx`, `pages/transactions/TransactionsPage.jsx`, `pages/reports/ReportShell.jsx`, `CalendarPage.jsx`, `pages/budgets/BudgetsPage.jsx`, `pages/categories/CategoriesPage.jsx`, `styles/polish.css`. Varian ringkasan, grafik, tabel/list, overview budget dan kartu, serta 35 sel kalender. | Bentuk placeholder menunjukkan susunan data yang sedang ditunggu tanpa menampilkan angka sementara. | Hanya pemuatan pertama tanpa data. Refetch mempertahankan data lama dan pola pembaruan yang ada; Kategori kini juga memakai pola tersebut. `aria-busy` dan teks tersembunyi Memuat… tersedia. Shimmer hanya aktif pada no-preference. Spinner aksi simpan/hapus dan detail dialog lama tetap. |
| 6. Heatmap | `pages/reports/CalendarPage.jsx`, `utils/dashboard.js`, `styles/tokens.css`, `styles/polish.css`. Lima tingkat termasuk nol; legenda Sedikit → Banyak. Nominal bertanda +/minus di desktop dan titik bulat/persegi di HP tetap. Label aksesibel menyebut pengeluaran, termasuk Rp0. | Krem sampai terakota menunjukkan distribusi pengeluaran relatif dalam bulan tanpa menambah grafik terpisah. | Pengeluaran nol memakai surface, termasuk hari ini. Hari ini diberi tepi lebih tebal dan tanggal bergaris bawah. Bulan kosong seluruhnya tingkat 0. Hover mempertahankan warna heatmap. |
| 7. Sapaan dan hari ini | `pages/dashboard/TodaySummary.jsx`, `DashboardPage.jsx`, `utils/dashboard.js`. Nama dari AuthContext, jam lokal, pengeluaran `reports/day` dan jumlah sisa budget dari response dashboard bulan berjalan. | Sapaan singkat disertai angka hari ini membuat Dashboard berguna untuk keputusan harian. | Pengeluaran nol: Belum ada pengeluaran hari ini. Tanpa budget: bagian budget hilang. Kegagalan request ditulis sebagai belum tersedia dengan Coba lagi; tidak diganti angka nol. Nama tidak tersedia: sapaan tanpa nama. |
| 8. Perbandingan | `components/PeriodComparison.jsx`, `SummaryCards.jsx`, `pages/dashboard/DashboardPage.jsx`, `utils/dashboard.js`. Request dashboard terpisah untuk periode sebelumnya; panah, persentase, tanggal pembanding, dan warna bermakna. | Rentang sama panjang membuat semua preset dan rentang kustom mengikuti satu aturan yang dapat diperiksa. | Badge menampilkan skeleton saat pembanding atau periode utama belum siap. Request pembanding tidak menahan tampilan utama. Nilai lama nol: belum ada data beserta tanggal. Error: Perbandingan belum tersedia dan tombol Coba lagi. |
| 9. Count-up Saldo | `components/AnimatedBalance.jsx`, `SummaryCards.jsx`. requestAnimationFrame dengan easing cubic-out, 600ms pertama dan 300ms saat nilai berubah. Frame terakhir memakai nilai asli, termasuk pecahan dan nilai negatif. | Gerak singkat mengarahkan perhatian ke Saldo setelah data tersedia, sambil mempertahankan angka akhir yang tepat. | Hanya SummaryCards prominent di Dashboard; refetch dengan nilai sama tidak mengulang. Reduced motion langsung menampilkan nilai akhir. Frame dibatalkan saat cleanup. Angka bergerak `aria-hidden`, satu nilai akhir `visually-hidden`, tanpa live region. |
| 10. Fraunces | `styles/tokens.css`, `styles/polish.css`, `frontend/package.json`, `frontend/package-lock.json`. `@fontsource/fraunces` 5.3.0; satu WOFF2 Latin normal 700 untuk judul halaman, brand, auth, dan 404. | R-06: serif dengan bentuk bulat Fraunces menguatkan karakter hangat motif dompet, sementara angka dan isi tetap memakai font sistem yang sudah dikenal. | `font-display: swap`, fallback Georgia lalu Times New Roman. Tidak memakai CDN, italic, subset tambahan, font variable penuh, atau aset gambar baru. File font 18.212 byte. |

### Detail preferensi dan pemulihan

Kunci storage: `pidu:transaction-preferences:{userId}`, berisi `counts` menurut ID kategori dan `payment`. Hitungan ditambah hanya sesudah API simpan berhasil, baik tambah maupun edit. Urutan seri memakai nama kategori. ID kategori nonaktif tidak ditampilkan sebagai chip meskipun hitungannya masih tersimpan. Semua akses storage memakai try/catch; data yang rusak dan metode di luar enum diabaikan. Dalam dialog yang masih terbuka, preferensi dapat bertahan di memori bila storage diblokir; buka dialog berikutnya kembali ke fallback apabila penyimpanan tidak tersedia.

POST Batalkan mengirim kembali `transaction_date`, `type`, `category_id`, `amount`, `payment_method`, `description`, dan `notes`. **Transaksi yang dipulihkan mendapat ID dan `created_at` baru**, sehingga urutan transaksi pada tanggal yang sama dapat berubah. Pemulihan tidak mengirim ID/timestamp lama. Kegagalan POST tidak diklaim berhasil dan tidak mengubah backend agar menerima kategori nonaktif.

Toastify menggunakan `animationend` pada progress bar sebagai timer. Aturan reduced motion umum proyek memendekkan animasi; khusus toast undo, durasi timer dipertahankan 6000ms dan progress bar disembunyikan pada reduced motion. Dengan begitu waktu Batalkan tetap tersedia tanpa gerak progress yang terlihat. Tombol bisa dicapai dengan Tab; shortcut bawaan notifikasi Alt+T juga masih tersedia.

### Ruang navigasi mobile

Nav memiliki padding bawah `0.5rem + env(safe-area-inset-bottom)`. ResizeObserver menyimpan tinggi keseluruhan nav, termasuk inset tersebut, dalam `--pidu-bottom-nav-height`. Konten memakai tinggi terukur + 1rem; inset tidak dijumlahkan dua kali. Sebelum pengukuran, fallback memakai 84px + safe area. Scroll padding mengikuti ukuran yang sama. Container toast dibatasi tinggi viewport dikurangi nav dan margin, dengan scroll internal bila banyak toast; posisi toast bawah juga dinaikkan di atas nav. Modal dan offcanvas tetap mempunyai lapisan lebih tinggi dari nav. Target item nav minimal 56px; ubin + 44px; chip dan tombol Batalkan minimal 44px.

## 2. Data, periode pembanding, dan refetch

`TransactionProvider` mempertahankan `dataVersion` selama layout aktif. Setiap simpan, hapus, dan pemulihan berhasil memanggil `refreshTransactions()`. Versi ini menjadi bagian request key `useFetch`, serta request key daftar Transaksi. Akibatnya Dashboard, seluruh rekap, Kalender/detail hari, Budget, dan Kategori mengambil ulang data yang sedang dilihat. URL, filter, pagination, dan state halaman tidak di-reset. Pengecualian lama tetap: menghapus satu-satunya baris halaman Transaksi selain halaman pertama memundurkan pagination satu halaman.

`useFetch` menyimpan data lama selama request baru berjalan, membatalkan request yang mendukung signal, dan mengabaikan hasil request yang sudah ditinggalkan. Wrapper API kategori lama tidak menerima signal, sehingga request tersebut boleh selesai di jaringan tetapi hasil usangnya diabaikan. Modal kategori mengambil daftar terbaru saat dibuka. Halaman yang belum terpasang melakukan fetch saat navigasi seperti sebelumnya.

Aturan pembanding berlaku sama untuk seluruh preset, termasuk Bulan ini dan Bulan lalu:

1. Panjang dihitung inklusif dari `start_date` sampai `end_date`.
2. Akhir pembanding = sehari sebelum `start_date`.
3. Awal pembanding = `start_date` dikurangi panjang periode.
4. Aritmetika tanggal memakai tengah malam UTC untuk menghitung hari kalender, agar DST tidak mengubah panjang. Tampilan tanggal tetap format Indonesia.

Contoh: 1–30 September 2026 dibandingkan dengan 2–31 Agustus 2026. Rentang 1–31 Maret 2024 dibandingkan dengan 30 Januari–29 Februari 2024. Ini bukan aturan bulan kalender sebelumnya.

Persentase = `abs((nilai sekarang - nilai sebelumnya) / nilai sebelumnya) × 100`; arah panah ditentukan selisih nominal. Nilai sebelumnya negatif tetap menghasilkan arah yang benar, misalnya Saldo -100 menjadi -50 adalah naik 50%. Teks dibulatkan maksimal satu desimal; selisih nonnol <0,1% ditulis `<0,1%`, bukan 0%. Selisih nol ditulis sama. Baseline nol selalu memakai belum ada data tanpa pembagian. Pengeluaran naik memakai expense, turun income; Saldo dan Pemasukan sebaliknya. Data usang tidak dipasangkan dengan label periode baru saat request masih berjalan atau gagal.

Sapaan memakai jam lokal: pagi 05.00–10.59, siang 11.00–14.59, sore 15.00–17.59, malam di luar itu. Jam diperbarui tiap menit selama Dashboard terpasang. Request hari ini dan dashboard bulan berjalan terpisah dari filter periode utama. Ini memastikan sisa budget bulan ini tetap benar saat pengguna melihat laporan bulan/tahun lain. Dashboard melakukan empat request independen: periode utama, pembanding, detail hari ini, dan dashboard bulan berjalan untuk budget. Tidak ada agregasi keuangan baru di backend. Sisa budget dapat negatif dan tidak dijepit ke nol.

Heatmap memakai maksimum pengeluaran dari `days` bulan yang terlihat: 0 untuk nol; 1 untuk >0 sampai 25%; 2 untuk >25 sampai 50%; 3 untuk >50 sampai 75%; 4 untuk >75 sampai 100%. Nominal/titik dan label lengkap tetap membawa informasi selain warna.

## 3. Kontras kedua tema

Perintah: `python frontend/scripts/check-contrast.py`. Script memanggil `.claude/skills/antislop-human/contrast-check.py` untuk setiap pasangan. Hasil akhir **132/132 PASS**, mencakup 112 pasangan lama dan 20 pemeriksaan teks heatmap. Ambang teks normal 4.5:1; batas kontrol, fokus, dan bentuk indikator 3:1.

### Setiap tingkat heatmap

Ink dipakai untuk tanggal, nominal pengeluaran, jumlah transaksi, persegi pengeluaran, batas sel, dan fokus internal. Pemasukan tetap hijau dan bertanda tambah, dengan warna khusus agar lolos pada tingkat terpekat. Bulat pemasukan menggunakan hijau yang sama. Karena semua pasangan teks lolos 4.5:1, pasangan bentuk/batas tersebut juga melampaui 3:1.

| Tema / tingkat | Latar | Ink | Rasio ink | Hijau pemasukan | Rasio pemasukan | Hasil |
|---|---|---|---|---|---|---|
| Light 0 | #fffaf4 | #352b26 | 13.27 | #1c442b | 10.59 | PASS |
| Light 1 | #f6e6d6 | #352b26 | 11.28 | #1c442b | 9.00 | PASS |
| Light 2 | #f6d8c5 | #352b26 | 10.20 | #1c442b | 8.14 | PASS |
| Light 3 | #eab99d | #352b26 | 7.82 | #1c442b | 6.24 | PASS |
| Light 4 | #dba080 | #352b26 | 6.13 | #1c442b | 4.89 | PASS |
| Dark 0 | #2d2521 | #f7ecdf | 12.89 | #c9f1cf | 12.13 | PASS |
| Dark 1 | #3a3029 | #f7ecdf | 11.02 | #c9f1cf | 10.38 | PASS |
| Dark 2 | #4a3329 | #f7ecdf | 10.03 | #c9f1cf | 9.44 | PASS |
| Dark 3 | #60402f | #f7ecdf | 7.93 | #c9f1cf | 7.47 | PASS |
| Dark 4 | #764b38 | #f7ecdf | 6.36 | #c9f1cf | 5.99 | PASS |

Rasio ditulis terhadap 1. Pada percobaan awal, hijau #234c33 hanya 4.34:1 pada light tingkat 4; diganti #1c442b sebelum verifikasi akhir.

### Pasangan untuk chip, nav, perbandingan, sapaan, dan toast

Latar light: surface #fffaf4, recess #efe4d7, peach #f6d8c5, shine-peak #fbeadd, canvas #f7f1e8. Latar dark: surface #2d2521, recess #3a3029, peach #4a3329, shine-peak #573e31, canvas #211c19. Semua rasio teks dalam tabel ini PASS ≥4.5:1.

| Tema / teks | Hex | Surface | Recess | Peach | Shine-peak | Canvas |
|---|---|---|---|---|---|---|
| Light ink | #352b26 | 13.27 | 10.98 | 10.20 | 11.75 | 12.26 |
| Light muted | #6d5b50 | 6.20 | 5.13 | 4.77 | 5.49 | 5.73 |
| Light accent | #994b32 | 5.94 | 4.92 | 4.56 | 5.26 | 5.49 |
| Light accent-hover | #7c3824 | 8.26 | 6.84 | 6.35 | 7.32 | 7.64 |
| Light income | #306747 | 6.41 | 5.31 | 4.93 | 5.68 | 5.92 |
| Light expense | #a13d32 | 6.27 | 5.19 | 4.81 | 5.55 | 5.79 |
| Dark ink | #f7ecdf | 12.89 | 11.02 | 10.03 | 8.43 | 14.47 |
| Dark muted | #cebaaa | 8.03 | 6.87 | 6.25 | 5.25 | 9.02 |
| Dark accent | #f1ad88 | 7.92 | 6.77 | 6.16 | 5.18 | 8.90 |
| Dark accent-hover | #ffc6a4 | 9.92 | 8.48 | 7.72 | 6.48 | 11.14 |
| Dark income | #9dcea9 | 8.46 | 7.24 | 6.59 | 5.53 | 9.51 |
| Dark expense | #ffa99a | 8.15 | 6.97 | 6.34 | 5.33 | 9.15 |

Pemetaan penggunaan:

- Chip: ink pada surface, recess saat hover, peach saat dipilih; centang ink, tepi pilihan accent. Ubin kategori tetap memakai recess dan algoritme `accessibleColor` Phase 11, minimal 3:1 untuk ikon dinamis. Nama kategori memakai ink, bukan warna pilihan pengguna.
- Nav: muted pada surface, accent pada peach saat aktif dan recess saat hover. Garis bawah accent menjadi penanda tambahan. Label Catat accent pada surface/recess.
- Perbandingan: income, expense, atau muted pada surface; kartu Saldo pada peach sampai shine-peak ketika tilt. Sapaan ink dan baris data muted pada canvas.
- Toast: ink pada surface; Batalkan accent pada surface, on-color pada accent saat hover/aktif. Ikon toast income pada surface. Legenda heatmap muted pada surface.

| Tema / pasangan tombol penuh | Hex depan / belakang | Rasio | Hasil |
|---|---|---|---|
| Light on-color / accent | #fffaf4 / #994b32 | 5.94 | PASS |
| Light on-color / accent-hover | #fffaf4 / #7c3824 | 8.26 | PASS |
| Dark on-color / accent | #211c19 / #f1ad88 | 8.90 | PASS |
| Dark on-color / accent-hover | #211c19 / #ffc6a4 | 11.14 | PASS |

Pasangan ini juga mencakup simbol + pada ubin dan huruf N pada tombol Topbar.

| Tema / batas atau fokus | Surface | Recess | Peach | Shine-peak | Canvas | Ambang / hasil |
|---|---|---|---|---|---|---|
| Light control-line #8c7362 | 4.27 | 3.53 | 3.28 | 3.78 | 3.94 | ≥3 PASS |
| Dark control-line #a58b78 | 4.69 | 4.02 | 3.65 | 3.07 | 5.27 | ≥3 PASS |
| Light focus #994b32 | 5.94 | 4.92 | 4.56 | 5.26 | 5.49 | ≥3 PASS |
| Dark focus #f1ad88 | 7.92 | 6.77 | 6.16 | 5.18 | 8.90 | ≥3 PASS |

Skeleton tidak mengandung teks visual; bar statis control-line pada surface/peach mempunyai rasio di atas. Shimmer memakai recess di atas bar, bersifat dekoratif dan `aria-hidden`; tidak digunakan sebagai batas kontrol atau satu-satunya penanda status. Status aksesibel berupa teks Memuat…. Outline kalender memakai ink terhadap setiap tingkat heatmap, bukan accent. Border swatch legenda memakai ink, dan permukaan swatch tidak memuat teks. Bayangan/highlight ubin hanya tepi dekoratif, mengikuti token lama.

## 4. Verifikasi dan ukuran bundle

Perintah akhir, exit 0 tanpa warning/error:

```text
> frontend@0.0.0 lint
> oxlint
```

```text
> frontend@0.0.0 build
> vite build

vite v8.3.1 building client environment for production...
transforming...
✓ 172 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                        1.14 kB │ gzip:   0.63 kB
dist/assets/fraunces-latin-700-normal-CEOla-zY.woff2     18.21 kB
dist/assets/bootstrap-icons-mSm7cUeB.woff2             134.04 kB
dist/assets/bootstrap-icons-BeopsB42.woff              180.28 kB
dist/assets/index-B2gIu2DI.css                        359.68 kB │ gzip:  54.96 kB
dist/assets/reports-CSPOPuVM.js                         0.54 kB │ gzip:   0.20 kB
dist/assets/YearlyReportPage-agLbjRY8.js                 0.88 kB │ gzip:   0.54 kB
dist/assets/MonthlyReportPage-Vsuauqgo.js                1.37 kB │ gzip:   0.80 kB
dist/assets/WeeklyReportPage--0nxwDq5.js                 1.41 kB │ gzip:   0.75 kB
dist/assets/DailyReportPage-DsUyN9oN.js                 1.69 kB │ gzip:   0.92 kB
dist/assets/PeriodPicker-DuLe2T6I.js                    1.89 kB │ gzip:   0.81 kB
dist/assets/DayDetailModal-BvR_pEN5.js                  2.73 kB │ gzip:   1.01 kB
dist/assets/ReportTable-Ch-r9tYB.js                    2.93 kB │ gzip:   1.07 kB
dist/assets/CalendarPage-DpuZhHBU.js                   3.78 kB │ gzip:   1.57 kB
dist/assets/DashboardPage-kGxjc6ig.js                  9.51 kB │ gzip:   3.13 kB
dist/assets/IncomeExpenseChart-Dfb5lXbY.js           187.95 kB │ gzip:  65.53 kB
dist/assets/index-inQ6fyFa.js                        456.85 kB │ gzip: 138.76 kB
✓ built in 695ms
```

Ukuran persis seluruh file dalam `dist/assets`, hasil pengukuran filesystem sebelum implementasi dan sesudah build akhir. kB memakai 1000 byte; bukan ukuran transfer jaringan.

| Kelompok | Sebelum (byte) | Sesudah (byte) | Perubahan |
|---|---|---|---|
| Semua chunk JS | 660.978 | 671.591 | +10.613 |
| CSS | 353.517 | 359.688 | +6.171 |
| WOFF2, termasuk font baru | 134.044 | 152.256 | +18.212 |
| WOFF ikon lama | 180.288 | 180.288 | 0 |
| Total aset build | 1.328.827 | 1.363.823 | **+34.996 byte / 35,00 kB** |

Tambahan font sendiri 18,21 kB, di bawah sasaran 60 kB; keseluruhan tambahan aset juga di bawah 60 kB. Tidak ada gambar/logo/ilustrasi baru.

Index JS berubah 341,04 kB (gzip 98,05) menjadi 456,85 kB (138,76). Bundler kini menggabungkan shared chunk SummaryCards lama 107,03 kB (38,66) ke index setelah komponen layout/context dipakai bersama. Karena itu penilaian kenaikan menggunakan seluruh chunk, bukan index saja. CSS berubah 353,51 kB (gzip 53,74) menjadi 359,68 kB (54,96). Chart tetap dalam chunk terpisah.

Build awal sempat diblokir sandbox Windows dengan `spawn EPERM`; build baseline dan final kemudian berjalan dengan izin subprocess. Pemasangan font awal tidak dapat menulis cache npm profil pengguna; berhasil dengan cache di `frontend/node_modules/.cache/npm`, tanpa mengubah konfigurasi npm global. Konflik environment NO_COLOR/FORCE_COLOR dihilangkan pada shell verifikasi dengan melepas NO_COLOR, bukan menyembunyikan warning melalui NODE_NO_WARNINGS.

Pemeriksaan tambahan:

```text
node frontend/scripts/verify-phase12.mjs
PASS 30 September days compare with August 2 to 31
PASS single day crosses year boundary
PASS leap day and DST do not change inclusive length
PASS invalid or incomplete range has no comparison
PASS zero baseline never divides by zero
PASS expense increase is unfavorable, income increase is favorable
PASS negative balance improvement keeps the correct direction
PASS all heatmap thresholds and an empty month
PASS greeting changes at local hour boundaries
PASS frequency and payment are isolated per user
PASS malformed storage and invalid methods fall back safely
PASS blocked storage does not throw or prevent remembering in memory
12/12 checks passed

python frontend/scripts/check-contrast.py
132/132 pasangan PASS.

git -c core.safecrlf=false diff --check
exit 0
```

Pemeriksaan Node menggunakan fungsi source dan storage stub; tidak menguji DOM, jaringan, atau klik browser. Tidak ada tes backend dijalankan karena backend tidak diubah.

## 5. Delivery Gate antislop

PASS kode berarti inspeksi source atau bukti otomatis di bagian 3–4. Pemeriksaan render dan interaksi nyata tetap PENDING sesuai pembagian executor/reviewer dalam brief.

### Hard Gate

| Aturan | Status dan bukti |
|---|---|
| R-02 | PASS kode: copy baru Bahasa Indonesia, tanpa em dash; angka dan sapaan bersumber dari data/jam lokal. |
| R-03 | PASS kode: nav lima kolom minmax, chip membungkus, padding terukur dan safe area; overflow 360px/zoom nyata PENDING. |
| R-17 | PASS: nominal hanya dari response API; angka skeleton tidak dibuat-buat. |
| R-18 | PASS: tidak menambah testimoni atau orang fiktif. |
| R-23 | PASS: nav, font, dan efek yang dibuat memang diminta brief; tanpa aset gambar baru. |
| R-24 | PASS kode: seluruh link nav menuju route yang sudah ada. |
| R-25 | PASS: 132/132 pasangan checker, termasuk semua tingkat heatmap dua tema. |
| R-26 | PASS kode: semua tombol baru memiliki onClick/onSubmit atau tujuan link; click-through PENDING. |
| R-27 | PASS kode: skeleton, empty state lama, error/retry, baseline nol, storage fallback, serta error undo tersedia. |
| R-28 | PASS: tidak menambah FAQ. |
| R-32 | PASS kode: button/link native, aria-pressed/current/keyshortcuts, fokus, focus trap dan Escape modal tetap; keyboard nyata PENDING. |
| R-33 | PASS: implementasi langsung di source melalui patch; script verifikasi hanya membaca/menguji, tidak menulis ulang UI. |
| R-34 | PASS kode dan checker: dua tema punya token baru lengkap; hasil render PENDING. |
| R-35 | **PENDING: build lulus; belum dicek di browser. Click-through dan Lighthouse oleh Claude.** |
| R-36 | PASS: tidak mengklaim Lighthouse 100 atau hasil browser tanpa pengukuran. |
| R-37 | PASS: DESIGN.md dan dial Phase 11 menjadi arah kerja. |
| R-38 | PASS: data keuangan asli, placeholder jelas berupa skeleton, tidak ada angka promosi. |

### Purpose Gate

| Aturan | Status dan bukti |
|---|---|
| R-01 | PASS: skala hangat menunjukkan besar pengeluaran; shimmer hanya penanda loading. |
| R-04 | PASS: ikon rumah, receipt, plus, grafik, dan piggy-bank mengikuti fungsi navigasi; ubin lama dipakai ulang. |
| R-06 | PASS: alasan Fraunces dicatat pada fitur 10; isi dan angka tetap font sistem. |
| R-07 | PASS: tidak membuat pola latar dekoratif baru. |
| R-08 | PASS: panah hanya arah perbandingan dan legenda intensitas. |
| R-09 | PASS: label perbandingan menampilkan perubahan data dan tanggal pembanding, tanpa badge promosi. |
| R-10 | PASS: tidak menambah glassmorphism. |
| R-12 | PASS: kedalaman baru hanya ubin aksi Catat; kartu lain memakai hierarki lama. |
| R-13 | PASS: kilau tetap terbatas pada Saldo. |
| R-14 | PASS: Saldo prominent tetap paling besar; tidak menambah kartu fitur generik. |
| R-19 | PASS kode: count-up 600/300ms, shimmer loading, reduced motion; timer undo tetap 6 detik tanpa progress terlihat pada reduced motion. |
| R-22 | PASS: tidak menambah ilustrasi. |

### Liveliness

| Item | Status dan bukti |
|---|---|
| Dial eksplisit | PASS: ENERGY 2 / RHYTHM 2 / MOTION 2. |
| Konsistensi dial | PASS kode: aksi timbul, Saldo tetap fokus, motion hanya loading/perubahan data; penilaian visual PENDING. |
| Fokus halaman | PASS kode: Saldo prominent dan + Catat sebagai aksi utama mobile. |
| Whitespace | PASS kode: chip gap 8px, nav ringkas, ruang konten mengikuti ukuran nav aktual. |
| Aksen sengaja | PASS: terakota pada aksi dan navigasi aktif; heatmap membawa makna jumlah. |
| Motif identitas | PASS: ubin dan lipatan dompet dipertahankan, serif hangat ditambah. |
| Design Read | PASS: dinyatakan sebelum implementasi dan di bagian 1. |

### Craftsmanship dan Quality Locks

| Item | Status dan bukti |
|---|---|
| C-1 | PASS: alasan satu baris untuk tiap fitur pada tabel implementasi. |
| C-2 | PASS kode: aksi global, chip, retry, undo, dan nav terhubung; interaksi nyata PENDING. |
| C-3 | PASS: tambahan hanya membantu pencatatan, orientasi, loading, dan pemahaman data. |
| C-4 | PASS kode: fallback/error, dua tema, reduced motion, dan layout mobile; uji perangkat PENDING. |
| C-5 | PASS: ukuran diukur, kontras dihitung, keterbatasan tes dijelaskan. |
| R-05 | PASS: hierarki Dashboard Phase 11 tetap; baris sapaan menambah konteks waktu. |
| R-11 | PASS: radius chip/control mengikuti token, tidak semua elemen menjadi pil. |
| R-15 | PASS: label Catat transaksi, Batalkan, Coba lagi, dan Muat kategori lagi menyebut aksi nyata. |
| R-16 | PASS: tidak menambah copy pemasaran atau motivasi generik. |
| R-20 | PASS kode: motif dompet/ubin dan palet hangat tetap; persetujuan tampilan PENDING. |
| R-21 | PASS kode: toggle light/dark tetap tersedia, tanpa default tema baru. |
| R-29 | PASS: warna baru berasal dari krem, peach, terakota, dan hijau semantik untuk pemasukan. |
| R-30 | PASS: tidak menyalin layout produk lain. |
| R-31 | PASS: keputusan, alasan, dan kondisi fallback tercatat per fitur. |

Checklist tambahan UI/human/layoutmobile/copywriting: kontras dan source sudah diperiksa; reflow 360px, zoom 200%, keyboard layar HP, focus ring nyata, console, dan semua interaksi tetap PENDING. Audit copy tidak menemukan klaim data baru tanpa sumber atau kalimat pemasaran generik.

## 6. Click-through Claude

Semua langkah berikut **PENDING**. Gunakan server yang sudah disediakan pengguna. Uji light dan dark, desktop 1440/1920px, mobile 360px, serta lebar sekitar breakpoint 992px. Pakai data uji yang dapat dibersihkan; undo menghasilkan ID baru.

| Fitur | Langkah konkret dan hasil yang diharapkan |
|---|---|
| 1. Catat global | Dari Dashboard, Transaksi, keempat laporan, Kalender, Budget, Kategori, Impor, dan Export: klik Catat atau tekan N di desktop. Form yang sama muncul dan fokus ke Nominal. Tab ke input/textarea/select/contenteditable lalu tekan N: tidak membuka form. Uji Ctrl/Alt/Meta+N, tahan N, modal detail/konfirmasi terbuka: shortcut aplikasi tidak aktif. Simpan transaksi dalam periode yang sedang terlihat: angka/daftar refetch tanpa reload, URL dan filter tetap. Uji tombol Tambah Transaksi lokal dan Edit. |
| 2. Preferensi | Pada user A, simpan beberapa transaksi dalam ≥6 kategori, lalu buka form lagi: chip aktif terurut frekuensi, maksimal enam. Ganti jenis: daftar berubah. Klik chip lalu pilih kategori lain via select: nilai dan centang sinkron. Nonaktifkan kategori yang sering dipakai: chip hilang. Uji Simpan & tambah lagi dan fokus Nominal. Ganti metode, buka tambah lalu edit transaksi dengan metode berbeda: tambah mengingat, edit mengikuti transaksi. Masuk user B: preferensi A tidak terbawa. Blokir storage atau rusakkan JSON: simpan API tetap berhasil. |
| 3. Undo | Batal pada dialog hapus: transaksi tetap ada. Konfirmasi hapus: toast dan Batalkan tampil sekitar enam detik. Tab/Alt+T, Enter pada Batalkan: semua tujuh field pulih dan ID/created_at berbeda. Hover/fokus toast menghentikan timer; klik ganda hanya satu POST. Hapus baris terakhir halaman >1, pulihkan, periksa pagination dan total. Pindah ke Dashboard sebelum undo: Dashboard ikut refetch. Nonaktifkan kategori via tab kedua sebelum undo: 422 server tampil. Uji gagal jaringan, kedaluwarsa toast, logout, dan reduced motion: kesempatan undo tetap enam detik. |
| 4. Nav bawah | Pada 360px, klik empat tujuan dan + Catat; label, ikon, garis aktif, dan aria-current benar. Scroll Transaksi sampai pagination, Budget sampai kartu terakhir; semuanya bisa dijangkau di atas nav. Buka banyak toast, uji safe-area inset, resize/zoom, dan keyboard HP. Buka hamburger untuk Kategori, Kalender, laporan lain, Impor, Export. Pada ≥992px nav bawah hilang dan Catat Topbar muncul. Ukur target baru ≥44px dan document.scrollWidth sama dengan viewport. |
| 5. Skeleton | Throttle jaringan dan buka setiap halaman sasaran dari kondisi baru: placeholder sesuai bentuk halaman, aria-busy dan teks Memuat tersedia. Untuk halaman lazy, fallback layout juga skeleton. Ganti filter/periode atau simpan transaksi: data lama tetap terlihat selama refetch. Uji response kosong dan gagal, termasuk Kategori setelah pernah berhasil fetch. Emulasi reduced motion: shimmer berhenti. |
| 6. Heatmap | Bulan dengan pengeluaran bervariasi: cocokkan tiap tingkat dengan perbandingan terhadap maksimum. Uji hari income-only, hari kosong, hari ini, dan bulan kosong. Hover/fokus tidak menghapus tingkat warna. Desktop tetap menampilkan +/minus nominal, HP bulat/persegi. Baca accessible name tiap sel, buka detail dengan Enter, Escape untuk tutup. Periksa legenda kedua tema. |
| 7. Hari ini | Cocokkan pengeluaran dengan response `/api/reports/day/{tanggal-lokal}`. Uji 0, nilai positif, dan gagal request. Jumlahkan amount-used budget bulan berjalan; tanpa budget, fragmen tersebut tidak tampil. Pilih periode lama pada Dashboard: baris hari ini tetap memakai bulan sekarang. Uji pergantian sapaan pada 05/11/15/18 dan pergantian tanggal, nama panjang pada 360px. |
| 8. Perbandingan | Pilih 1–30 Sep: Network menunjukkan dashboard 2–31 Agu. Coba satu hari, lintas tahun, Februari kabisat, dan rentang kustom. Cocokkan persen/arah, expense naik turun, Saldo negatif, sama, dan baseline 0. Perlambat/gagalkan request pembanding saja: Dashboard utama tetap muncul; badge skeleton/error dan Coba lagi bekerja. Ganti periode cepat: hasil request lama tidak muncul di label baru. |
| 9. Count-up | Buka Dashboard: Saldo menuju angka API dalam sekitar 600ms, akhir tepat termasuk desimal/negatif. Ganti periode: mulai dari angka lama, sekitar 300ms. Refetch angka yang sama tidak mengulang. Reduced motion, termasuk menggantinya saat berjalan: angka langsung final. Accessibility tree hanya memiliki nilai akhir; tidak ada pengumuman tiap frame. Tilt lama tetap bekerja dan angka tetap datar. |
| 10. Font | Periksa computed font pada h1, Pidu/sidebar, auth dan 404: Fraunces 700. Network production hanya satu font Latin WOFF2 baru, self-host. Blokir font: Georgia tetap terbaca dengan swap. Isi/tabel/nominal tetap font sistem. Periksa judul panjang, zoom 200%, auth, dan dropdown Phase 11 pada 360/1440/1920px. |

Ulangi regresi lama: sort Nominal/Tanggal, filter URL dan back/forward, pagination, edit, validasi, export dengan filter, CRUD kategori/budget, drill-down laporan, dialog, toggle tema, dan dropdown akun/Export. Periksa console browser. Ukur Lighthouse accessibility pada Dashboard, Transaksi mobile, Kalender, dan Login dark; target tetap 100, hasil belum diklaim.

**Status penyerahan: implementasi dan verifikasi otomatis selesai; belum dicek di browser. R-35: PENDING, click-through oleh Claude.**

## Review Claude (Chrome DevTools, 29 Sep 2026): R-35 click-through

Server `npm start` milik user (tidak dimatikan). Viewport 1440×900 dan 360×740 (touch).

| # | Fitur | Hasil |
|---|---|---|
| 1 | Catat global | Tombol "Catat transaksi [N]" di Topbar. Tombol `N` (keyboard asli) membuka form, fokus di Nominal. Tidak aktif saat fokus di select. Simpan → Dashboard langsung ter-update tanpa reload |
| 2 | Form pintar | Metode terakhir (QRIS) diingat; chip "Makanan" muncul setelah simpan dan memilih kategori saat diklik. **Kurang:** cadangan dari riwayat transaksi (brief) tidak dibuat → chip kosong sampai user menyimpan di browser tersebut |
| 3 | Batalkan hapus | Toast "Transaksi dihapus · Batalkan", tombol bisa difokus; klik → "Transaksi dipulihkan", data identik, ID baru (701) |
| 4 | Nav bawah HP | 5 item (tinggi 72px), "Catat" di tengah, `aria-current` pada item aktif; konten terakhir (y=635) di atas nav (y=651); `scrollWidth` 360 |
| 5 | Skeleton | Tampil saat pemuatan pertama Dashboard |
| 6 | Heatmap | 30 sel `calendar-heat`, 5 Sep (Rp 980 rb, tertinggi) paling gelap, legenda "Sedikit → Banyak", label aksesibel menyebut nominal |
| 7 | Sapaan | "Selamat siang, Demo User · Belum ada pengeluaran hari ini · Sisa budget bulan ini Rp 953.000" (cocok: 6.583.000 − 5.630.000); setelah catat Rp 12.000 → berubah jadi "Pengeluaran hari ini Rp 12.000 · Sisa … Rp 941.000" |
| 8 | Perbandingan | ▲5% / ▼9,5% / ▲42,9% = dihitung ulang dari API (Sep 1–30 vs Agu 2–31). **Catatan UX:** label "dari 2 Agu 2026 sampai 31 Agu 2026" panjang; untuk preset bulan lebih alami "dari Agustus 2026" |
| 9 | Count-up | Nilai akhir tepat Rp 4.501.000; teks pembaca layar hanya nilai akhir |
| 10 | Font | h1 memakai Fraunces (terpasang, woff2 18 kB) |
| - | Lighthouse | A11y **100** / BP **100**: Kalender (desktop), Dashboard (mobile) |
| - | Bundle | Total JS 661 → 672 kB (+10,6 kB). Main chunk 341 → 457 kB karena chunk bersama `SummaryCards` (107 kB) kini digabung ke main (form transaksi di-host di layout); beban muat awal praktis sama |
| - | Console / lint / build / audit | Bersih / 0 warning / sukses / 0 vulnerabilities |

Data uji (transaksi id 701) dan token uji (id 9) dihapus per ID → 696 transaksi / 44 kategori / 5 budget.

## Perbaikan kecil oleh Claude (setelah review)
1. **Chip kategori tanpa riwayat lokal** (`TransactionFormModal.jsx`): jika `localStorage` belum punya hitungan, kategori favorit dihitung dari 50 transaksi terakhir (`GET /api/transactions?per_page=50&sort=transaction_date&dir=desc`). Gagal memuat → chip tidak tampil (select tetap bisa dipakai). Simpan pertama menyimpan hitungan itu ke `localStorage`. Diverifikasi di konteks browser baru: pengeluaran Makanan, Transportasi, Rokok, Belanja, Hiburan; pemasukan Bonus, Freelance, Gaji.
2. **Periode & label pembanding** (`utils/dashboard.js` `previousPeriod`, `DashboardPage.jsx`): satu bulan kalender penuh → bulan sebelumnya ("dari Agustus 2026"); satu tahun penuh → tahun sebelumnya ("dari 2025"); lainnya → rentang sama panjang dengan label ringkas ("1 Agu – 30 Agu 2026", satu hari: "9 Sep 2026"). Diuji dengan Node: pergantian tahun, Februari 28/29 (kabisat), tahun penuh, 30 hari terakhir, satu hari, rentang tidak valid (`null`). Di Chrome: Saldo ▲71,2%, Pemasukan ▲5%, Pengeluaran ▼14,9% dari Agustus 2026 (cocok dengan hitungan manual dari data seed).
Lint 0 warning, build sukses. Token uji (id 10) dihapus.
