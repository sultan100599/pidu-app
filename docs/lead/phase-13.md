# PHASE 13: Tagline "Piduiteun" + tiga bahasa (IN / EN / SU)

Executor: **Codex**. Reviewer: Claude (Chrome + test suite). Baseline: commit `3592949`.

## Peran
Kamu adalah **full-stack developer profesional yang sangat ahli di UI/UX dan internasionalisasi (i18n)**. Kerjakan dua permintaan pemilik produk di bawah secara lengkap dan rapi.

## Wajib dibaca dulu
`AGENTS.md` → antislop (mode **selama pengerjaan**; jangan tanya lagi): `.claude/skills/antislop/SKILL.md`, `antislop-ui`, `antislop-human`, `antislop-layoutmobile`, dan **`antislop-copywriting`** (banyak teks baru di tiga bahasa). Lalu `DESIGN.md`, `CATATAN.md`, `docs/lead/report-11.md`, dan `docs/lead/report-12.md` (desain & fitur yang **dipertahankan**).

## Keputusan pemilik (final)
| Hal | Keputusan |
|---|---|
| Tagline | **"Piduiteun"** di bawah tulisan "Pidu" pada menu (sidebar desktop + menu geser HP). Filosofi: nama Pidu berasal dari kata Sunda *piduiteun*. Tagline **tidak diterjemahkan**, selalu "Piduiteun" di ketiga bahasa |
| Pilihan bahasa | Tombol di **Topbar** dengan teks **IN**, **EN**, **SU** (Indonesia, English, Sunda). Tulis persis "IN" sesuai permintaan pemilik (kode HTML tetap `lang="id"`) |
| Cakupan terjemahan | **Seluruh aplikasi**: semua teks tampilan **dan** pesan dari server (error validasi, pesan sukses/gagal, label jenis & metode dari API, nama bulan/"Minggu N" di laporan, pesan 404/500, impor, backup, dll.) |
| Tidak diterjemahkan | File **export Excel/PDF** (tetap Bahasa Indonesia) dan **data milik user** (nama kategori, deskripsi, catatan; termasuk kategori default hasil seeder) |
| Bahasa Sunda | Tingkat tutur **lemes (sopan)**, contoh: "Mangga lebetkeun nominal", "Transaksi parantos disimpen" |
| Default | Bahasa Indonesia |

## A. Tagline (frontend)
- Di `Sidebar` (dipakai juga oleh menu geser HP), di bawah brand "Pidu": teks **Piduiteun** kecil, miring, warna teks sekunder (kontras ≥ 4.5:1 di kedua tema), dengan `lang="su"` agar pembaca layar melafalkannya dengan benar.
- Jaga layout brand tetap rapi (ubin ikon dompet + "Pidu" + tagline), tanpa overflow di menu geser 280px.

## B. Pemilih bahasa (frontend)
- Topbar: kontrol tiga tombol **IN | EN | SU** (segmented control sesuai gaya Pidu: ubin/tombol timbul untuk yang aktif). Juga tampil di halaman **Login/Register** (di sebelah tombol tema, karena user belum login).
- Aksesibilitas: grup berlabel (mis. `role="group" aria-label="Bahasa"`), tiap tombol `aria-pressed` + `aria-label` nama bahasa lengkap ("Bahasa Indonesia", "English", "Basa Sunda"), fokus terlihat, bisa dipakai lewat keyboard.
- **Mobile 360px**: Topbar sudah berisi Menu, judul, tema, dan menu pengguna. Kontrol bahasa **harus muat tanpa scroll horizontal** dengan target sentuh ≥ 44px. Jika tiga tombol tidak muat, di layar kecil boleh diganti satu tombol yang menampilkan kode aktif (mis. "IN") dan membuka pilihan (dropdown yang dikontrol React, tetap di dalam viewport; pakai pola `useDropdownBounds` yang sudah ada). Judul halaman boleh terpotong (truncate) tetapi tidak boleh bertumpuk.
- Pilihan disimpan di `localStorage` (`pidu_locale`, dibungkus try/catch), diterapkan **sebelum render pertama** (tanpa kedipan bahasa), dan `document.documentElement.lang` = `id` / `en` / `su`.
- Ganti bahasa = seluruh teks langsung berganti **tanpa reload**, termasuk judul tab (`document.title`), aria-label, placeholder, toast, legenda/tooltip grafik, dan skeleton teks pembaca layar. Data yang sudah dimuat dari API boleh di-refetch agar label dari server ikut berganti.

## C. i18n frontend
- Solusi ringan tanpa library besar lebih disukai (mis. context `LocaleProvider` + kamus `id/en/su` + fungsi `t(key, params)` dengan interpolasi dan bentuk jamak sederhana bila perlu). Jika memilih library, tulis alasannya dan catat kenaikan bundle.
- **Semua** string UI dipindah ke kamus. Tidak boleh ada teks Indonesia yang tertinggal saat EN/SU aktif (cek dengan pencarian di kode dan saat review).
- Kunci kamus konsisten di ketiga bahasa. Tambahkan skrip cek kecil (mis. `frontend/scripts/check-locales.mjs`) yang gagal jika ada kunci yang hilang di salah satu bahasa, lalu jalankan.
- Format:
  - **Nominal Rupiah tetap format Indonesia** di semua bahasa (Rp 1.500.000), karena mata uangnya Rupiah.
  - **Tanggal, nama bulan & hari** ikut bahasa. `Intl` untuk `su` belum lengkap, jadi sediakan nama bulan/hari Sunda sendiri (mis. Januari, Pébruari, Maret, April, Méi, Juni, Juli, Agustus, Séptémber, Oktober, Nopémber, Désémber; Senén, Salasa, Rebo, Kemis, Jumaah, Saptu, Minggu). Untuk `en` pakai `Intl` `en-GB`/`en-US` (tulis pilihanmu).
  - Sapaan Dashboard ikut bahasa (mis. EN "Good morning", SU "Wilujeng énjing/siang/sonten/wengi").
- Header `Accept-Language: id|en|su` dikirim di setiap request API (axios interceptor) sesuai pilihan aktif.

## D. i18n backend (Laravel)
- Middleware (mis. `SetLocaleFromRequest`) untuk grup API: baca `Accept-Language`; `id`/`en`/`su` → `app()->setLocale()`; lainnya/kosong → `id`. Daftarkan di `bootstrap/app.php`.
- Pindahkan semua teks yang ditujukan ke user dari kode ke file bahasa `lang/{id,en,su}/…` (mis. `validation.php` untuk pesan & nama atribut, `messages.php` untuk pesan controller/service):
  - pesan & atribut validasi di `ApiRequest` dan turunannya (termasuk pesan custom seperti "Nominal harus lebih dari 0.", duplikat budget, kategori);
  - pesan controller/service: login gagal, sukses tambah/ubah/hapus, kategori masih dipakai, logout, 404 "Data tidak ditemukan.", 500, throttle, impor (semua pesan error per baris & ringkasan), backup;
  - label enum (`TransactionType::label()`, `PaymentMethod::label()`) yang dikirim API sebagai `type_label` / `payment_method_label`;
  - nama bulan & label minggu di `ReportService` / `Period::MONTHS` (hanya untuk response API).
- **Export Excel/PDF tetap Bahasa Indonesia**, apa pun locale-nya (paksa locale `id` saat membuat export, atau pakai teks tetap).
- `APP_LOCALE` default tetap `id`. Pastikan kunci yang dipakai tersedia di ketiga bahasa (jangan jatuh ke fallback Inggris framework untuk SU/ID).
- Isi Sunda memakai tingkat lemes. Isi English natural dan ringkas.

## E. Tes (wajib)
- Seluruh test suite backend yang ada (**76 tes**) harus tetap lolos tanpa mengubah ekspektasi Bahasa Indonesianya (tanpa header = `id`).
- Tambahkan feature test: dengan `Accept-Language: en` dan `su`, (1) pesan validasi + nama atribut, (2) pesan sukses tambah transaksi, (3) login gagal, (4) `type_label`/`payment_method_label`, (5) label bulan laporan bulanan, (6) 404 berbahasa sesuai locale; header tidak dikenal → Indonesia; export tetap Indonesia saat `Accept-Language: en`.
- Jalankan `cd backend && php artisan test` dan tempel hasilnya.

## Standar (tidak boleh turun)
- Lighthouse accessibility tetap 100 (Claude mengukur); kontras AA kedua tema; keyboard; mobile 360px tanpa overflow; `prefers-reduced-motion`.
- Semua fitur Phase 1–12 tetap berfungsi. Jangan ubah route/URL/nama field API.
- Tanpa em dash di semua bahasa. Tanpa klaim/angka karangan.

## Verifikasi
```
cd backend && php artisan test
npm --prefix frontend run lint
npm --prefix frontend run build
node frontend/scripts/check-locales.mjs   (atau nama skripmu)
```
Semua lolos; catat ukuran bundle sebelum → sesudah. **Jangan menjalankan atau mematikan server di port 8001/8010. Jangan commit.** Tulis jujur "belum dicek di browser".

## Report: `docs/lead/report-13.md`
1. Tagline: file & keputusan.
2. Arsitektur i18n frontend & backend (alur `Accept-Language`, lokasi kamus/lang file, fallback), alasan pilihan (library atau tidak).
3. Daftar area yang diterjemahkan + yang sengaja tidak (export, data user) dan alasannya.
4. Contoh terjemahan kunci penting di tiga bahasa (tabel ±20 baris), termasuk pesan validasi dan sapaan, supaya pemilik bisa memeriksa bahasa Sunda-nya.
5. Output test backend, lint, build, cek kunci locale; ukuran bundle.
6. Delivery Gate antislop (R-35: PENDING, click-through oleh Claude).
7. Daftar langkah click-through untuk Claude + catatan bagian yang terjemahannya perlu dicek penutur asli.
