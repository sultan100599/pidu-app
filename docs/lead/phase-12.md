# PHASE 12: UX & visual polish (10 fitur)

Executor: **Codex**. Reviewer: Claude (Chrome). Baseline: commit `722d512` (redesign putaran 1–2 sudah diterima).

## Peran
Kamu tetap **front-end developer profesional yang sangat ahli di bidang UI/UX**. Pemilik sudah menyetujui 10 peningkatan di bawah agar Pidu **lebih menawan dan lebih enak dipakai sehari-hari**.

## Wajib dibaca dulu
`DESIGN.md`, `AGENTS.md` → antislop (mode **selama pengerjaan**; jangan tanya lagi): `.claude/skills/antislop/SKILL.md`, `antislop-ui`, `antislop-human`, `antislop-layoutmobile`, dan `antislop-copywriting` (ada teks baru). Lalu `docs/lead/report-11.md` (token & keputusan desain yang **dipertahankan**) serta `CATATAN.md`.

## Ruang lingkup
- **Hanya `frontend/`.** Backend, API, route, dan query URL tidak diubah. Semua data yang dibutuhkan sudah tersedia lewat endpoint yang ada (lihat poin 7 & 8).
- Palet, token, font isi, motif ubin/lipatan dompet, tilt Saldo, dan perbaikan dropdown dari putaran 1–2 **dipertahankan**.
- Semua fitur lama tetap berfungsi persis sama.

## 10 fitur

### A. UX
1. **Tombol "Catat" global.**
   - HP (< lg): tombol "+" di tengah navigasi bawah (lihat poin 4).
   - Desktop: tombol "Catat transaksi" di Topbar + shortcut keyboard **`N`** dari halaman mana pun (abaikan jika fokus sedang di input/textarea/select/contenteditable atau ada modal terbuka; tulis `aria-keyshortcuts="n"` dan tampilkan petunjuk shortcut di tooltip/label).
   - Membuka `TransactionFormModal` yang sama (dipindah/di-host di level layout, mis. `AppLayout` + context). Setelah simpan, halaman yang sedang tampil (Dashboard, Transaksi, laporan, Kalender, Budget) **refetch** otomatis (mis. context `dataVersion` yang dinaikkan, atau event) sehingga angka langsung ter-update tanpa reload.
   - Halaman Transaksi boleh tetap punya tombol "Tambah Transaksi" sendiri, tapi keduanya membuka form yang sama.
2. **Form catat lebih pintar.**
   - Di atas select kategori: **pilihan cepat** 4–6 kategori yang paling sering dipakai user untuk jenis yang dipilih, sebagai chip berikon (ubin ikon). Klik chip = pilih kategori. Select tetap ada untuk kategori lain.
   - Sumber "paling sering": hitungan pemakaian per kategori yang disimpan di `localStorage` per user (kunci berisi user id), diperbarui setiap simpan. Jika belum ada riwayat, ambil dari transaksi terakhir user (mis. `GET /api/transactions?per_page=50`) atau sembunyikan chip. Jangan menampilkan chip kategori nonaktif.
   - **Ingat metode pembayaran terakhir** per user (`localStorage`) sebagai default form tambah (edit tetap memakai data transaksi).
   - Fokus awal di field **Nominal** pada form tambah (aksi terpenting), bukan di tanggal.
   - `localStorage` dibungkus try/catch (bisa diblokir), dan fallback ke perilaku lama.
3. **"Batalkan" setelah menghapus transaksi.** Setelah hapus sukses: toast "Transaksi dihapus" dengan tombol **Batalkan** (±6 detik). Klik → buat ulang transaksi dengan data yang sama lewat `POST /api/transactions` (tanggal, jenis, kategori, nominal, metode, deskripsi, catatan), toast sukses, lalu refetch. Tulis jujur di report bahwa transaksi yang dipulihkan mendapat ID/`created_at` baru. Dialog konfirmasi hapus **tetap ada** (hapus tetap harus disengaja). Jika kategorinya sudah nonaktif sehingga POST ditolak (422), tampilkan pesan error dari server. Tombol Batalkan harus bisa diakses keyboard.
4. **Navigasi bawah di HP** (< lg): Dashboard · Transaksi · **+ Catat** (tengah, menonjol, ubin timbul) · Laporan (→ `/reports/daily`) · Budget. Item aktif ditandai (bukan warna saja). Menu hamburger/offcanvas tetap ada untuk halaman lain (Kategori, laporan lain, Kalender, Impor, Export). Wajib:
   - `padding-bottom` konten = tinggi nav + `env(safe-area-inset-bottom)`, sehingga **tidak ada konten, pagination, atau toast yang tertutup nav** (antislop-layoutmobile: "Bottom Nav That Eats Content").
   - Target sentuh ≥ 44px, label teks di bawah ikon, `aria-current="page"`.
   - Tidak tampil di desktop.
5. **Skeleton loading** menggantikan spinner saat pemuatan **pertama** di Dashboard, Transaksi (tabel/list), laporan, Kalender, Budget, dan Kategori. Bentuknya meniru layout asli (kartu ringkasan, baris tabel, sel kalender). Refetch tetap memakai pola "data lama redup" yang ada. Aksesibilitas: `aria-busy="true"` + teks `visually-hidden` "Memuat…". Animasi shimmer mati saat `prefers-reduced-motion`.

### B. Visual
6. **Kalender jadi heatmap pengeluaran.** Warna latar sel mengikuti besar pengeluaran hari itu relatif terhadap hari dengan pengeluaran terbesar bulan itu, dalam 4–5 tingkat dari krem → peach → terakota (light) dan padanan hangat (dark). Wajib:
   - Kontras teks di **setiap tingkat** ≥ 4.5:1 (cek dengan `contrast-check.py`, cantumkan hasilnya).
   - Informasi tidak hanya lewat warna: nominal/titik yang ada tetap, dan label aksesibel sel tetap menyebut nominal.
   - Legenda kecil "Sedikit → Banyak" (tingkat warna) di bawah kalender.
   - Hari tanpa pengeluaran = warna dasar. Pemasukan tetap ditandai seperti sekarang.
7. **Sapaan & ringkasan hari ini di Dashboard** (di atas kartu ringkasan): "Selamat pagi/siang/sore/malam, {nama}" (berdasarkan jam lokal) + satu baris data **asli**: pengeluaran hari ini (dari `GET /api/reports/day/{YYYY-MM-DD}` → `totals.expense`) dan sisa budget bulan ini (jumlah `amount - used` dari `budgets` di response dashboard; jika tidak ada budget, jangan tampilkan bagian itu). Jika pengeluaran hari ini 0, tulis kalimat yang jujur ("Belum ada pengeluaran hari ini"). Tanpa emoji dan tanpa kalimat motivasi palsu.
8. **Perbandingan dengan periode sebelumnya** di kartu ringkasan Dashboard (Pemasukan, Pengeluaran, Saldo): panggil `GET /api/dashboard` untuk periode sebelumnya yang **sama panjang** tepat sebelum `start_date` (mis. Sep 1–30 → Agu 2–31, atau untuk preset "Bulan ini/Bulan lalu" boleh memakai bulan kalender sebelumnya; tulis aturanmu di report). Tampilkan "▲ 12% dari {label periode}" / "▼ …" / "sama". Warna mengikuti makna (pengeluaran naik = kurang baik), tetapi **arah panah + teks** tetap ada (bukan warna saja). Jika nilai periode sebelumnya 0, tampilkan "belum ada data {periode}" (tanpa pembagian nol dan tanpa "∞%"). Pemuatan data pembanding tidak boleh menahan tampilan utama (tampilkan skeleton kecil di badge).
9. **Angka Saldo "menghitung naik"** sekali saat Dashboard pertama tampil (±600 ms, easing halus) menuju nilai akhir yang **persis**. Ganti periode = animasi dari nilai lama ke nilai baru (singkat) atau langsung. Mati saat `prefers-reduced-motion`. Pembaca layar hanya membaca nilai akhir (angka animasi `aria-hidden`, nilai akhir `visually-hidden`), tanpa pengumuman berulang.
10. **Font judul berkarakter.** Ganti Georgia untuk judul (h1 halaman, brand "Pidu", judul auth, angka Saldo boleh) dengan serif hangat yang **di-self-host lewat npm** (mis. `@fontsource-variable/fraunces` atau `@fontsource/fraunces`, subset latin, hanya bobot yang dipakai). Tulis alasannya (R-06), `font-display: swap`, fallback ke Georgia. Catat kenaikan ukuran bundle; usahakan < 60 kB tambahan.

## Standar (tidak boleh turun)
- Kontras WCAG AA di kedua tema untuk semua warna baru (chip, badge perbandingan, heatmap, bottom nav, skeleton, toast undo).
- Keyboard: semua kontrol baru bisa di-Tab, fokus terlihat, Esc menutup modal. Shortcut `N` tidak mengganggu pengetikan.
- Lighthouse accessibility tetap 100 (Claude akan mengukur).
- Mobile 360px: tanpa scroll horizontal, target ≥ 44px, bottom nav tidak menutupi konten.
- `prefers-reduced-motion` dihormati untuk count-up, shimmer, dan transisi baru.
- Teks Bahasa Indonesia, tanpa em dash, tanpa angka/klaim karangan (antislop-copywriting).
- Tidak ada aset gambar/logo/ilustrasi baru.

## Verifikasi
```
npm --prefix frontend run lint
npm --prefix frontend run build
```
Keduanya lolos tanpa warning; catat ukuran bundle sebelum → sesudah (termasuk file font). **Jangan menjalankan atau mematikan server di port 8001/8010. Jangan commit.** Tulis jujur "belum dicek di browser".

## Report: `docs/lead/report-12.md`
1. Per fitur 1–10: apa yang dibuat, file, keputusan + alasan satu baris (R-31), kapan nonaktif/fallback.
2. Aturan periode pembanding (poin 8) dan cara refetch global (poin 1).
3. Hasil cek kontras semua pasangan baru (kedua tema), termasuk tiap tingkat heatmap.
4. Output lint & build, ukuran bundle.
5. Delivery Gate antislop (R-35: PENDING, click-through oleh Claude).
6. Daftar click-through yang perlu Claude uji (langkah konkret per fitur).
