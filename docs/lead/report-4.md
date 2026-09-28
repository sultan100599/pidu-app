# Report Phase 4 — Transaksi CRUD + Kategori UI

Tanggal: 2026-09-29 · Executor: **Kimi (±60%) lalu diselesaikan Claude**. Kimi kena batas kuota 5 jam di tengah jalan (01:08); sesuai permintaan user, sisanya diselesaikan Claude sekaligus review. Mulai phase ini: Claude mengerjakan dan me-review setiap phase, lalu bertanya ke user sebelum lanjut phase berikutnya.

## Ringkasan
Halaman **Transaksi** dan **Kategori** selesai dan dicek langsung di Chrome (desktop 1440px, mobile 360px, dark mode). Lint 0 warning, build lolos. Data demo setelah pengujian kembali persis seperti seed (696 transaksi / 44 kategori / 5 budget).

## Pembagian kerja
- **Dari Kimi (dipakai, sebagian diperbaiki):** carry-over `setInitializing(true)` di AuthContext, `api/transactions.js`, `api/categories.js`, `constants/enums.js`, `hooks/useCategories.js`, `utils/period.js`, `components/{CategoryBadge,SummaryCards}.jsx`, `components/ui/{Modal,ConfirmDialog,Pagination,EmptyState,ErrorState,AmountInput}.jsx`, `pages/transactions/{TransactionFilters,TransactionTable,TransactionList}.jsx`.
- **Dibuat Claude:** `pages/transactions/{TransactionsPage,TransactionFormModal}.jsx`, `pages/categories/{CategoriesPage,CategoryFormModal,IconPicker,ColorPicker}.jsx`, routing di `App.jsx`, CSS utilitas di `styles/app.css`.
- `hooks/useDebounce.js` dihapus: pencarian memakai timer di event handler (lebih sederhana, tanpa effect).

## Bug yang ditemukan saat review & diperbaiki
1. **AmountInput: digit desimal masuk ke bilangan bulat.** Mengetik `1250000,5` menghasilkan `12.500.005,`. Penyebabnya, posisi kursor dihitung hanya dari jumlah digit (koma tidak ikut dihitung), dan kursor dipasang lewat `requestAnimationFrame` yang bisa balapan dengan ketikan cepat. Sekarang koma ikut dihitung dan kursor dipasang di `useLayoutEffect`. Sudah diuji: ketik normal, sisip di tengah, dan Backspace.
2. **Modal: fokus melompat saat mengetik.** Effect bergantung pada `onClose`; `ConfirmDialog` mengirim fungsi inline sehingga effect jalan ulang setiap render dan fokus kembali ke elemen pertama. Sekarang `onClose` dan `busy` disimpan di ref.
3. **Modal: klik di luar dialog tidak menutup.** `.modal` menutupi layar di atas backdrop, jadi handler di backdrop tidak pernah terpanggil. Dipindah ke `onMouseDown` di `.modal` (target = dirinya sendiri).
4. **Modal: fokus awal jatuh di tombol ×.** Sekarang fokus ke field pertama di body. ConfirmDialog → tombol "Batal" (pilihan aman).
5. **Ringkasan di mobile terpotong** ("Rp 11.957…."). Nominal sekarang tidak dipotong (boleh turun baris), dan ikon disembunyikan di < 576px.
6. Kecil: header tabel yang bisa di-sort tidak tebal dan "Nominal" tidak rata kanan; grid filter meluber (lebar kolom total 14/12); card filter mobile punya ruang kosong saat tertutup; `page=1` ikut ditulis ke URL; urutan jenis tidak konsisten (sekarang Pengeluaran lebih dulu di semua tempat).

## Keputusan desain
- **Semua filter, sort, page, dan per_page ada di URL** (`?period=this_month&search=…`). Reload dan back/forward mempertahankan filter. Ketikan pencarian memakai `replace` supaya history tidak penuh; perubahan filter lain di-`push`. Phase 8 (export) bisa memakai query yang sama.
- **Fetch tanpa race:** hasil disimpan bersama key request-nya; `loading = result.key !== requestKey`; AbortController membatalkan request lama. Data lama tetap tampil (opacity 50%) selama refetch.
- Periode kustom yang tidak valid (akhir < mulai) → pesan error, request tidak dikirim.
- Form dipasang ulang (`key`) setiap kali dibuka, sehingga tidak ada effect untuk reset state.
- Tabel (≥ md) dan list kartu (< md) sama-sama di-render, disembunyikan dengan `d-none`. Pilihan ini sederhana dan DOM-nya kecil (≤ 100 baris).
- Toggle kategori tidak optimistic: switch disabled selama request, lalu refetch. Lebih sederhana dan tidak perlu rollback.

## Verifikasi (Chrome DevTools, dijalankan Claude)
| Cek | Hasil |
|---|---|
| `/transactions?period=this_month` → summary | Rp 11.957.000 / Rp 7.456.000 / saldo Rp 4.501.000 / 124 transaksi (cocok dengan report-1) |
| Tambah transaksi via form, nominal `250.000,5` | 201, toast, list refetch |
| Cari "uji review" (debounce) | URL → `?period=this_month&search=uji+review`, 1 hasil, summary ikut filter |
| Kategori duplikat "Makanan" | Error di bawah field: "Nama kategori sudah ada untuk jenis ini." |
| Tambah kategori (ikon + warna + pratinjau) | OK |
| Edit transaksi yang kategorinya sudah nonaktif | Select menampilkan "ZZ Uji (nonaktif)", simpan → 200 |
| POST dengan kategori nonaktif (via API) | 422 (benar) |
| Hapus satu-satunya item di halaman 2 | Kembali ke halaman 1 |
| Hapus kategori tanpa transaksi | Konfirmasi menyebut budget ikut terhapus → terhapus |
| Tombol hapus kategori yang masih dipakai | Disabled + tooltip |
| Mobile 360px + dark mode | Tidak ada horizontal scroll (scrollWidth 360); list kartu, pagination, ringkasan terbaca |
| Console | Tidak ada warning React/Router. Satu-satunya error: 422 dari skrip uji yang sengaja memakai kategori nonaktif |
| `npm run lint` / `npm run build` | 0 warning / sukses (391 kB JS, 120 kB gzip) |
| Data setelah uji | 696 transaksi, 44 kategori, 5 budget (= seed) |
| Port 8001/8010 setelah selesai | kosong |

## Catatan untuk phase berikutnya
- `SummaryCards` dan `CategoryBadge` siap dipakai ulang di Dashboard (Phase 5).
- `utils/period.js` (`PERIOD_PRESETS`, `getPeriodRange`) bisa dipakai untuk filter periode di Dashboard dan Laporan.
