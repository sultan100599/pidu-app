# PHASE 14: Dashboard washitsu (satu layar penuh) + pintu shoji saat ganti tema

Executor: **Codex**. Reviewer: Claude (Chrome). Baseline: commit `0482dd7` (Phase 13 sudah di-commit).

## Peran
Kamu adalah **desainer UI/UX dan front-end engineer senior** yang dashboard buatannya dipakai perusahaan besar. Standarmu: hierarki informasi jelas, kepadatan terkendali, detail material yang halus, dan animasi yang punya alasan. Tugasmu membuat **Dashboard Pidu penuh satu layar, elegan, dan estetik**, dengan sentuhan **washitsu** (ruang tradisional Jepang), plus **animasi pintu shoji** saat ganti tema terang/gelap.

## Wajib dibaca dulu
`DESIGN.md` (terutama bagian **Tambahan Phase 14**), `AGENTS.md` → antislop mode **selama pengerjaan** (sudah dijawab pemilik, jangan tanya lagi): `.claude/skills/antislop/SKILL.md`, `antislop-ui`, `antislop-human`, `antislop-layoutmobile`, `antislop-copywriting` (jika ada teks baru). Lalu `CATATAN.md`, `docs/lead/report-11.md`, `docs/lead/report-12.md`, `docs/lead/report-13.md`.

## Ruang lingkup
- **Hanya `frontend/`.** Backend, API, route, query URL, dan nama field tidak diubah.
- Fokus utama: **halaman Dashboard** (tata letak baru). Material washitsu dipasang lewat **token & shell bersama** (tokens, sidebar, topbar, kartu, latar) supaya halaman lain ikut serasi, tetapi tata letak halaman lain **tidak** dirombak.
- Semua fitur Phase 1–13 tetap berfungsi persis: shortcut `N`, tombol Catat, navigasi bawah HP, skeleton, heatmap kalender, sapaan + ringkasan hari ini, perbandingan periode, count-up Saldo, tiga bahasa (ID/EN/SU), tombol bahasa, tagline Piduiteun, undo hapus.

## A. Dashboard "penuh satu layar"
Masalah sekarang: kartu disusun menumpuk vertikal (ringkasan → 2 stat → grafik lebar penuh → kategori + terbesar → budget), sehingga di desktop harus scroll jauh.

Target:
1. **Desktop ≥ 1280×720: seluruh isi Dashboard muat tanpa scroll halaman.** Di 1440×900 dan 1920×1080 juga tanpa scroll dan tanpa ruang kosong besar yang janggal (grid mengisi tinggi viewport, mis. `height: calc(100dvh - topbar - padding)` dengan baris grid `minmax`). Di 1366×768 boleh maksimal ±1 layar kecil, tulis hasil ukurnya di report.
2. Susunan **bento grid** dengan hierarki jelas, contoh arah (boleh kamu perbaiki, tulis alasannya):
   - Baris atas: sapaan + ringkasan hari ini dipadatkan jadi satu strip; Saldo sebagai "tokonoma" (panel kehormatan, elemen paling menonjol) dengan Pemasukan, Pengeluaran, Jumlah transaksi, Rata-rata/hari, Rasio pengeluaran sebagai tile ringkas di sekitarnya (perbandingan periode tetap tampil).
   - Tengah: grafik Pemasukan vs Pengeluaran sebagai panel terbesar.
   - Samping/bawah: Pengeluaran per kategori (doughnut + daftar), Pengeluaran terbesar, Budget.
3. Panel yang isinya bisa panjang (daftar kategori, pengeluaran terbesar, budget) **scroll di dalam panelnya sendiri** dengan batas yang terlihat (fade/garis kayu di tepi), bukan memanjangkan halaman. Scroll dalam panel harus bisa dengan keyboard (panel `tabindex="0"` + label aksesibel) dan tidak menjebak scroll halaman di HP.
4. Grafik mengikuti tinggi panel (`maintainAspectRatio: false`), tetap terbaca, warna dari token tema.
5. **Tablet (768–1279):** 2 kolom, boleh scroll wajar. **HP (< 768):** satu kolom ringkas, urutan: sapaan → Saldo → ringkasan → grafik → kategori → terbesar → budget. Tidak ada scroll horizontal di 360px, target sentuh ≥ 44px, navigasi bawah tidak menutupi konten.
6. Empty state (periode tanpa transaksi), error state, dan skeleton tetap ada; skeleton meniru layout bento yang baru.
7. PeriodPicker dan tautan "Lihat transaksi / Semua / Kelola" tetap ada dan berfungsi.

## B. Sentuhan washitsu (elegan, bukan kostum)
Lihat `DESIGN.md` Tambahan Phase 14. Arahan konkret:
- **Material lewat CSS saja:** tekstur serat washi halus pada permukaan kartu, garis kayu hinoki tipis sebagai pembatas/bingkai panel, anyaman tatami sangat samar pada latar halaman atau sidebar (repeating-gradient), kisi kumiko tipis sebagai aksen (mis. header panel atau sidebar). Opasitas rendah; data tetap yang paling menonjol.
- **Terang:** washi krem, kayu hinoki pucat, tatami jerami, aksen terakota/shu. **Gelap:** arang sumi hangat, kayu gelap, cahaya lentera andon (glow hangat lembut di panel utama). Bukan hitam-biru.
- "Ma": jarak antar panel lega dan konsisten; sudut tetap membulat halus (DESIGN.md), tidak semua pil.
- Tipografi: Fraunces untuk judul/angka tetap boleh; tanpa font baru kecuali kamu yakin perlu (self-host npm, subset latin, < 60 kB, tulis alasannya).
- **Dilarang:** kanji dekoratif, sakura, torii, samurai, emoji, gambar/ikon/ilustrasi baru dari file. Tidak ada aset gambar baru (DESIGN.md).
- Semua warna baru lolos **WCAG AA** di kedua tema; teks di atas tekstur tetap ≥ 4.5:1 (cek dengan `.claude/skills/antislop-human/contrast-check.py` atau `frontend/scripts/check-contrast.py`, tempel hasilnya).
- Warna pemasukan/pengeluaran tetap langsung terbedakan.

## C. Animasi pintu shoji saat ganti tema
Pilihan pemilik: **tutup lalu buka.**
1. Klik tombol tema (Topbar, dan di mana pun toggle tema ada): dua panel shoji (rangka kayu + kisi kumiko + kertas washi tembus cahaya, dibuat CSS) **menggeser menutup dari kiri dan kanan** menutupi seluruh viewport → saat tertutup rapat, tema diganti (`data-bs-theme` + simpan `pidu_theme` seperti sekarang) → pintu **menggeser terbuka** memperlihatkan tema baru. Total ±0,9 detik (mis. tutup 380 ms, jeda ±120 ms, buka 420 ms, easing seperti pintu kayu yang berat: mulai halus, berhenti lembut; boleh sedikit "bump" saat bertemu di tengah).
2. Warna pintu mengikuti arah: menuju gelap = pintu terlihat dari ruang yang meredup (kertas washi dengan cahaya andon di balik); menuju terang = kertas washi terang. Tulis keputusanmu.
3. Implementasi: satu overlay di level layout (portal/komponen di `AppLayout` atau `ThemeProvider`), `aria-hidden="true"`, `pointer-events` memblokir klik hanya selama animasi, `position: fixed` + `inset: 0` + z-index di atas modal/toast/bottom nav. Hanya `transform`/`opacity` (GPU), tanpa reflow berat; tanpa library animasi baru.
4. Klik ganda cepat tidak boleh merusak state (abaikan klik saat animasi berjalan atau antrekan dengan benar). Fokus tetap di tombol tema setelah selesai. Grafik Chart.js berganti warna dengan benar setelah tema berganti (logika `toggleTheme` yang memasang atribut sebelum render harus tetap dijaga).
5. `prefers-reduced-motion: reduce` → tanpa geser; ganti tema langsung (boleh fade ≤ 150 ms).
6. Muat awal halaman (reload) **tidak** memutar animasi; tema awal langsung benar tanpa kedip.
7. Halaman Masuk/Daftar: jika ada toggle tema di sana, perilakunya sama; jika tidak ada, jangan tambahkan.
8. Tombol tema: label aksesibel tetap jelas di tiga bahasa (mis. "Ganti ke mode gelap"). Boleh ikon kecil bergaya pintu geser, tetap dengan `aria-label`.

## D. i18n
Semua teks baru lewat `t('teks Indonesia')` dan ditambahkan ke kamus `frontend/src/i18n/` dalam **ID, EN, SU (lemes)**. `node frontend/scripts/check-locales.mjs` harus lolos. Tanpa em dash di semua bahasa.

## Standar (tidak boleh turun)
- Lighthouse accessibility tetap 100 (Claude mengukur).
- Keyboard: semua kontrol dan panel scroll bisa di-Tab, fokus terlihat di atas tekstur.
- Performa: tekstur tidak membuat scroll/animasi patah di HP (hindari `backdrop-filter` berat dan `box-shadow` animasi pada banyak elemen). Catat ukuran bundle sebelum → sesudah; tambahan CSS/JS usahakan < 25 kB (gzip), di luar font.
- `prefers-reduced-motion` dihormati untuk semua animasi baru.
- Tanpa klaim atau angka karangan dalam teks.

## Verifikasi
```
npm --prefix frontend run lint
npm --prefix frontend run build
node frontend/scripts/check-locales.mjs
node frontend/scripts/verify-phase13.mjs
cd backend && php artisan test
```
Semua lolos (backend harus tetap 89 lulus walau tidak diubah). Boleh tambah `frontend/scripts/verify-phase14.mjs` untuk logika murni (mis. state mesin animasi pintu). **Jangan menjalankan atau mematikan server di port 8001/8010. Jangan commit.** Tulis jujur "belum dicek di browser" untuk hal yang belum kamu lihat.

## Report: `docs/lead/report-14.md`
1. Tata letak Dashboard: struktur grid per breakpoint (desktop/tablet/HP), cara mencapai "tanpa scroll" dan ukuran yang kamu hitung untuk 1280×720, 1366×768, 1440×900, 1920×1080.
2. Material washitsu: token baru (nama, nilai light/dark), teknik CSS tiap tekstur, alasan satu baris per keputusan (R-31).
3. Animasi shoji: arsitektur, timing & easing, penanganan klik ganda, reduced-motion, muat awal.
4. Hasil cek kontras semua pasangan baru di kedua tema.
5. Output lint, build, check-locales, verify-phase13 (dan 14 jika ada), test backend; ukuran bundle sebelum → sesudah.
6. Delivery Gate antislop (R-35: PENDING, click-through oleh Claude).
7. Daftar langkah click-through konkret untuk Claude (ukuran viewport, tema, bahasa, reduced-motion).
