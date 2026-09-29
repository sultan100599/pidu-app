# DESIGN.md: Pidu-App

Arah desain dari pemilik produk (29 Sep 2026), dirangkum dari jawaban user. Dokumen ini berisi **arah**, bukan resep: nilai persis (hex, font, ukuran) dipilih pelaksana dan harus dicatat alasannya.

## Produk & pengguna
- Pidu-App: pencatat keuangan pribadi (pemasukan, pengeluaran, laporan, budget, export/impor).
- Pengguna: orang biasa yang mengurus uangnya sendiri, dipakai di HP maupun desktop.

## Kesan yang diinginkan (kata-kata user)
- "Modern", "eye-catching", "estetik".
- Tampilan saat ini dinilai masih **polos**.
- Mood: **hangat & ramah**, terasa personal dan tidak menakutkan untuk urusan uang.

## Palet
- Nuansa **warna lembut: peach, krem, terakota**.
- Pemasukan dan pengeluaran tetap harus langsung terbedakan. Warna semantik boleh disesuaikan dengan palet hangat, asal kontras memenuhi WCAG AA.
- Wajib punya light mode dan dark mode yang sama-sama berfungsi (toggle sudah ada). Dark mode versi hangat, bukan hitam-biru dingin.

## Bentuk
- **Membulat** (sudut rounded), tetapi tidak semua jadi pil.

## Kedalaman / 3D
- **Sentuhan 3D lewat CSS saja**: bayangan berlapis, elemen timbul, kartu yang sedikit miring mengikuti kursor, transisi perspektif.
- **Tidak** memakai library 3D (Three.js / WebGL).
- Harus ringan di HP dan menghormati `prefers-reduced-motion`.

## Ilustrasi & aset
- Arah "ilustratif" dipilih user, tetapi **aset baru (logo, ilustrasi, avatar, gambar) tidak dibuat tanpa konfirmasi**. Logo tetap teks "Pidu" + ikon dompet yang ada. Bila ilustrasi dirasa perlu, tandai sebagai usulan dan tanyakan dulu.

## Dial (Design Read)
Reading this as: aplikasi keuangan pribadi (dashboard + formulir) untuk individu, bahasa visual hangat-ramah dengan kedalaman CSS, dial **ENERGY 2 / RHYTHM 2 / MOTION 2**.
- ENERGY 2: harus "eye-catching" dan tidak polos, tetapi tetap alat kerja harian, bukan halaman portofolio.
- RHYTHM 2: pola konsisten antarhalaman dengan beberapa pengecualian yang disengaja (misalnya dashboard dan login).
- MOTION 2: transisi, hover-depth, dan tilt yang punya tujuan; tanpa animasi berulang tanpa henti.
