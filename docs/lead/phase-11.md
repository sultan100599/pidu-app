# PHASE 11: Redesign UI Pidu-App (hangat & ramah, kedalaman CSS)

Executor: **Codex**. Reviewer: Claude (cek di Chrome setelah kamu selesai).

## Peranmu
Kamu adalah **front-end developer profesional yang sangat ahli di bidang UI/UX**. Buat tampilan Pidu-App **se-modern mungkin, eye-catching, dan estetik**, dengan **sentuhan 3D**. Pemilik produk menilai tampilan sekarang masih **polos**.

## Wajib dibaca dulu (urut)
1. `DESIGN.md`: arah desain dari pemilik (hangat & ramah; peach, krem, terakota; membulat; 3D lewat CSS saja; dial ENERGY 2 / RHYTHM 2 / MOTION 2).
2. `AGENTS.md` → aturan **antislop**. Pemilik sudah memutuskan antislop diterapkan **SELAMA pengerjaan** (mode 1). Jangan tanya lagi. Baca dan patuhi:
   - `.claude/skills/antislop/SKILL.md` (inti: 38 aturan + Delivery Gate)
   - `.claude/skills/antislop-ui/SKILL.md`
   - `.claude/skills/antislop-human/SKILL.md` (+ `contrast-check.py`)
   - `.claude/skills/antislop-layoutmobile/SKILL.md`
   - `.claude/skills/antislop-copywriting/SKILL.md` (hanya jika mengubah teks)
3. `CATATAN.md` dan `README.md`: konteks aplikasi.
4. Kode frontend yang ada: `frontend/src/**`.

Tujuan antislop di sini **bukan** membuat desain jadi datar. "Eye-catching" tetap wajib; antislop memastikan setiap efek punya alasan dan dosisnya pas (lihat R-01, R-10, R-12, R-13, R-19, R-31 dan Liveliness Toolkit).

## Ruang lingkup
- **Hanya `frontend/`** (+ tulis report di `docs/lead/report-11.md`). **Jangan ubah `backend/`**, API, route, nama field, atau query URL.
- Semua fitur harus tetap berfungsi persis sama. Ini redesign tampilan, bukan perubahan perilaku.
- Halaman yang harus ikut diredesign (semua):
  - Login, Register, 404
  - Layout: sidebar (desktop + menu geser di HP), topbar, dropdown user, toggle tema
  - Dashboard: kartu ringkasan, grafik, pengeluaran per kategori, pengeluaran terbesar, budget
  - Transaksi: filter, ringkasan, tabel (desktop), kartu (HP), pagination, modal form, konfirmasi hapus, menu Export
  - Kategori (tab, list, switch, modal ikon/warna)
  - Rekap Harian / Mingguan / Bulanan / Tahunan, Kalender, modal detail hari
  - Budget, Impor, Export & Backup
  - Komponen bersama: tombol, input, select, modal, toast (react-toastify), badge, progress, empty/loading/error state, pagination, stepper

## Keputusan teknis
- **Bootstrap 5.3 tetap dipakai.** Restyle lewat **design token CSS** (custom properties) untuk `:root`/`[data-bs-theme=light]` dan `[data-bs-theme=dark]`, dengan meng-override variabel Bootstrap (`--bs-*`) di `frontend/src/styles/`. Boleh memecah CSS jadi beberapa file (mis. `tokens.css`, `components.css`). Jangan menulis script yang mem-patch CSS (R-33).
- **3D hanya lewat CSS**: tanpa Three.js/WebGL/library 3D. Contoh teknik yang boleh (pilih yang punya tujuan, catat alasannya):
  - skala elevasi berlapis (mis. 3 level) untuk hierarki: kartu biasa, kartu fokus, modal/dropdown;
  - **satu-dua** elemen fokus dengan tilt perspektif mengikuti kursor (mis. kartu saldo/ringkasan di dashboard); pada perangkat sentuh dan `prefers-reduced-motion`, tilt nonaktif;
  - tombol dengan efek timbul/ditekan (tekanan terasa fisik);
  - transisi masuk halaman/modal yang halus.
  Dosis sesuai antislop: jangan beri glow/blur/shadow besar ke semua elemen.
- Font boleh diganti (mis. via paket `@fontsource/*` dari npm, di-self-host, tanpa CDN) jika alasannya ditulis. Jaga ukuran bundle tetap wajar dan catat perubahan ukurannya.
- **Grafik** (Chart.js) harus ikut palet baru: `frontend/src/components/charts/useChartTheme.js` membaca variabel CSS, jadi pastikan token pemasukan/pengeluaran/teks/grid terdefinisi di kedua tema. Toggle tema harus tetap langsung mengganti warna grafik (lihat `ThemeContext.jsx`: atribut tema dipasang sebelum render; jangan dirusak).
- Aset: **jangan membuat logo, ilustrasi, avatar, atau gambar baru** (R-23). Logo tetap teks "Pidu" + ikon `bi-wallet2`. Jika menurutmu ilustrasi perlu, tulis sebagai usulan di report.
- Teks UI tetap Bahasa Indonesia. Jangan menambah klaim, angka, atau fitur karangan (R-17, R-36, R-38). Tanpa em dash.

## Standar yang tidak boleh turun
- Kontras teks **WCAG AA** di kedua tema: 4.5:1 teks normal, 3:1 teks besar. Periksa **setiap pasangan token** teks/latar dengan `python .claude/skills/antislop-human/contrast-check.py "#fg" "#bg"` dan cantumkan hasilnya di report. Termasuk teks pemasukan/pengeluaran, teks sekunder, placeholder, badge, tombol, link, dan teks di atas warna aksen.
- Keyboard: fokus terlihat jelas (jangan `outline: none` tanpa pengganti), Escape menutup modal/menu, urutan Tab logis. Semua `aria-*`, label, dan role yang ada **dipertahankan**. Saat ini Lighthouse accessibility 100 di semua halaman; jangan sampai turun.
- Mobile 360px: tanpa scroll horizontal, target sentuh ≥ 44px, sidebar geser tetap berfungsi.
- Empty, loading, dan error state tetap ada dan ikut diredesign.
- `prefers-reduced-motion`: animasi dan tilt dimatikan atau diperhalus.

## Verifikasi (wajib, tempel output ke report)
```
npm --prefix frontend run lint
npm --prefix frontend run build
```
Keduanya harus lolos tanpa error/warning (catat ukuran bundle sebelum/sesudah).

**Jangan menjalankan atau mematikan server di port 8001/8010**, karena pemilik mungkin sedang menjalankan `npm start`. Kamu tidak punya browser, jadi tulis jujur "belum dicek di browser". Claude akan melakukan click-through di Chrome (R-35).

**Jangan commit.** Claude akan me-review lalu commit.

## Laporan: `docs/lead/report-11.md`
1. Design Read + dial (ENERGY/RHYTHM/MOTION) dan bagaimana dial itu terlihat di hasil.
2. Tabel **design token** (warna light & dark, radius, elevasi, tipografi, spasi) + **alasan satu baris untuk setiap keputusan besar** (R-31): warna, font, radius, bayangan, di mana 3D dipakai dan kenapa di situ, identitas motif.
3. Hasil cek kontras (semua pasangan, kedua tema).
4. Daftar file yang dibuat/diubah + ringkasan perubahan per halaman.
5. Output lint & build, ukuran bundle sebelum → sesudah.
6. **Delivery Gate antislop** (4 blok, PASS/FAIL per item dengan bukti). Untuk R-35 tulis "PENDING: click-through oleh Claude di Chrome".
7. Deviasi dari brief + alasan, dan usulan (mis. ilustrasi) yang butuh keputusan pemilik.
