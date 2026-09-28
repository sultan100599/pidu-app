# PHASE 4 — Transaksi CRUD + Kategori UI

Executor: Kimi. Baca `docs/lead/00-PLAN.md`, `docs/lead/report-2.md` (kontrak API), dan `docs/lead/review-3.md`. Working dir `C:\Pidu-App`. Kerjakan **hanya `frontend/`**. Backend sudah final dan ter-test; jangan diubah. Kalau menemukan bug backend, catat di report dan jangan diperbaiki sendiri. Dashboard, laporan, budget, dan export **belum** (tetap placeholder).

## 0. Carry-over dari review Phase 3 (kerjakan dulu)
`AuthContext` → di fungsi retry (`retryRef.current`) tambahkan `setInitializing(true)` sebelum `bootstrap()`. Saat ini, setelah "Coba lagi" berhasil, user mendarat di `/`, bukan di halaman asal, karena sesaat `user=null && initializing=false`.

## A. Kontrak API yang dipakai (sudah final)
```
GET    /api/transactions   ?page&per_page(1-100, default 15)&search&type&category_id&payment_method
                           &start_date&end_date(Y-m-d, keduanya atau tidak sama sekali)&sort(transaction_date|amount|created_at)&dir(asc|desc)
  → { data:[Trx], links, meta:{current_page,last_page,per_page,total,from,to},
      period: {start_date,end_date,days} | null,          // null = semua tanggal
      summary:{income,expense,balance,count} }             // untuk SELURUH hasil filter, bukan halaman ini
GET    /api/transactions/{id} → {data:Trx}
POST   /api/transactions   → 201 {message:"Transaksi berhasil ditambahkan.", data:Trx}
PUT    /api/transactions/{id} → {message, data:Trx}
DELETE /api/transactions/{id} → {message}
Trx = {id, transaction_date:"Y-m-d", type, type_label, category:{id,name,icon,color,type}, amount:number,
       payment_method, payment_method_label, description, notes, created_at, updated_at}

Body POST/PUT: transaction_date (Y-m-d, wajib), type (income|expense, wajib), category_id (wajib),
  amount (number > 0, maks 2 desimal, wajib), payment_method (opsional, default cash), description (≤255), notes (≤5000)
  - category harus milik user, jenisnya = type, dan AKTIF. Saat update, kategori nonaktif boleh HANYA jika category_id tidak berubah.

GET    /api/categories ?type&active(1|0) → {data:[Cat]}  (urut type, name)
POST   /api/categories {name,type,icon?,color?} → 201 {message,data:Cat}
PUT    /api/categories/{id} {name,type,icon?,color?} → {message,data:Cat}
       (type tidak bisa diubah jika sudah dipakai transaksi → 422 errors.type)
PATCH  /api/categories/{id}/toggle → {message,data:Cat}
DELETE /api/categories/{id} → {message}; jika masih dipakai → 422 {message:"Kategori masih dipakai N transaksi. Nonaktifkan saja."}
       Budget milik kategori itu ikut terhapus (cascade).
Cat = {id,name,type,type_label,icon,color,is_active,transactions_count,created_at,updated_at}
```
Enum `payment_method` + label (**harus sama** dengan backend): cash=Cash, transfer=Transfer, debit=Debit, credit_card=Kartu Kredit, e_wallet=E-Wallet, qris=QRIS, other=Lainnya. Taruh di `src/constants/enums.js` bersama `TRANSACTION_TYPES` (income=Pemasukan, expense=Pengeluaran).

## B. Struktur baru
```
src/
  api/transactions.js      # list(params), get(id), create(data), update(id,data), remove(id)
  api/categories.js        # list(params), create, update, toggle, remove
  constants/enums.js
  hooks/useDebounce.js
  hooks/useCategories.js   # fetch semua kategori (tanpa filter) + refetch; dipakai di filter & form
  components/ui/Modal.jsx          # controlled; portal ke body; backdrop; Esc; kunci scroll body; fokus ke elemen pertama; fullscreen-sm-down
  components/ui/ConfirmDialog.jsx  # judul, isi, tombol konfirmasi (variant danger), state loading
  components/ui/Pagination.jsx     # dari meta; « ‹ 1 … 4 5 6 … 20 › »; "Menampilkan x–y dari z"
  components/ui/EmptyState.jsx
  components/ui/ErrorState.jsx     # pesan + tombol "Coba lagi"
  components/ui/AmountInput.jsx
  components/CategoryBadge.jsx     # ikon berwarna (category.color) + nama; latar netral (bg-body-tertiary + border), BUKAN latar berwarna (kontras dark mode)
  components/SummaryCards.jsx      # Pemasukan / Pengeluaran / Saldo / Jumlah transaksi (dipakai lagi di Phase 5)
  pages/transactions/TransactionsPage.jsx
  pages/transactions/TransactionFilters.jsx
  pages/transactions/TransactionTable.jsx     # desktop ≥ md
  pages/transactions/TransactionList.jsx      # mobile < md (kartu)
  pages/transactions/TransactionFormModal.jsx
  pages/categories/CategoriesPage.jsx
  pages/categories/CategoryFormModal.jsx
  pages/categories/IconPicker.jsx
  pages/categories/ColorPicker.jsx
```
Tetap tanpa JS Bootstrap: modal, tab, dan switch dikontrol state React + class Bootstrap.

## C. Halaman Transaksi (`/transactions`)
**Header:** judul "Transaksi" + tombol "Tambah Transaksi" (`bi-plus-lg`).

**Filter (`TransactionFilters`):**
- Pencarian (deskripsi/catatan), debounce 400ms.
- Jenis: Semua / Pemasukan / Pengeluaran.
- Kategori: select berisi kategori sesuai jenis yang dipilih (semua kategori jika jenis = Semua), dikelompokkan `<optgroup>` per jenis. Ganti jenis → reset kategori bila tidak cocok.
- Metode pembayaran.
- Periode: preset **Semua** (default), **Bulan ini**, **Bulan lalu**, **30 hari terakhir**, **Tahun ini**, **Kustom** (dua input date). Hitung tanggal dengan `toYmd` lokal (bukan `toISOString`). Kustom dengan tanggal akhir < tanggal mulai → pesan error di bawah input, request tidak dikirim.
- Tombol "Reset filter" (muncul hanya jika ada filter aktif).
- Di mobile, filter lanjutan boleh dilipat (tombol "Filter" + badge jumlah filter aktif).
- **Semua filter, sort, page, dan per_page disinkronkan ke URL query** (`useSearchParams`) supaya reload, tombol back, dan link yang dibagikan tetap mempertahankan filter. Phase 8 (export) akan memakai query yang sama. Hanya kirim parameter yang terisi. Ganti filter apa pun → `page` kembali ke 1.

**Ringkasan:** `SummaryCards` dari `summary` (Pemasukan hijau, Pengeluaran merah, Saldo hijau/merah sesuai tanda, Jumlah transaksi). Jika `period` ada, tampilkan juga teks periodenya (mis. "1 Sep 2026 – 30 Sep 2026").

**Tabel (≥ md):** kolom Tanggal | Deskripsi (catatan di bawahnya, kecil & muted, dipotong 1 baris) | Kategori (`CategoryBadge`) | Metode | Nominal (rata kanan, `+Rp …` hijau untuk income, `−Rp …` merah untuk expense) | Aksi (edit `bi-pencil`, hapus `bi-trash`; tombol ikon ber-`aria-label`).
- Header Tanggal & Nominal bisa diklik untuk sort (ikon `bi-sort-down`/`bi-sort-up`); klik lagi membalik arah. Default `transaction_date desc`.
- Deskripsi kosong → tampilkan nama kategori dengan teks muted.

**List (< md):** kartu per transaksi: baris 1 deskripsi + nominal berwarna; baris 2 tanggal · kategori · metode; aksi edit/hapus. Tanpa horizontal scroll di 360px.

**Pagination:** komponen `Pagination` + select per halaman (15/25/50/100).

**State:**
- Loading awal → spinner/skeleton. Refetch (ganti filter/halaman) → **data lama tetap tampil** dengan opacity turun + spinner kecil (jangan kedip jadi kosong).
- Respons datang tidak berurutan (ketik cepat) → hanya respons **terbaru** yang dipakai (AbortController atau request id).
- Kosong tanpa filter → EmptyState "Belum ada transaksi" + tombol tambah. Kosong karena filter → "Tidak ada transaksi yang cocok dengan filter" + tombol reset.
- Error → ErrorState + "Coba lagi".

**Form tambah/edit (`TransactionFormModal`):**
- Jenis: toggle 2 tombol (Pengeluaran default | Pemasukan); tombol aktif `btn-danger`/`btn-success`.
- Tanggal: input date, default hari ini (lokal).
- Kategori: select kategori **aktif** sesuai jenis. Saat edit dengan kategori yang sudah nonaktif, tetap tampilkan kategori itu sebagai opsi terpilih berlabel "(nonaktif)". Ganti jenis → kosongkan kategori bila tidak cocok. Jika tidak ada kategori aktif untuk jenis itu → teks + link "Kelola kategori" ke `/categories`.
- Nominal: `AmountInput`, prefix "Rp", tampilan pemisah ribuan titik ("1.500.000"), koma untuk desimal maks 2 digit ("1.500,50"). Nilai yang dikirim = number (1500.5). `inputMode="decimal"`. Kursor tidak boleh melompat ke akhir saat mengetik di tengah angka (minimal: tidak rusak saat mengetik normal dari kiri ke kanan dan saat menghapus).
- Metode (default cash), Deskripsi, Catatan (textarea).
- Validasi client: tanggal, kategori, nominal > 0 wajib. Error 422 server → per field (`getFieldErrors`).
- Tombol: "Batal", "Simpan"; khusus mode tambah juga ada "Simpan & tambah lagi" (form di-reset tetapi jenis, tanggal, dan metode dipertahankan).
- Sukses → toast `message` dari server, modal tutup, refetch list (halaman sekarang), refetch kategori tidak perlu.
- Submit: tombol disabled + spinner, cegah double-submit. Modal tidak bisa ditutup saat submit.

**Hapus:** `ConfirmDialog` "Hapus transaksi?" menampilkan tanggal, deskripsi, dan nominal. Sukses → toast, refetch; jika halaman jadi kosong dan `page > 1` → mundur satu halaman.

## D. Halaman Kategori (`/categories`)
- Tab: **Pengeluaran** | **Pemasukan** (dengan jumlah di badge). Switch "Tampilkan nonaktif" (default: tampilkan semua, kategori nonaktif diberi badge "Nonaktif" dan teks muted). Tab aktif disimpan di query `?type=`.
- Tiap baris/kartu: ikon berwarna, nama, "N transaksi", status, aksi:
  - Edit (`bi-pencil`).
  - Toggle aktif: form-switch dengan label aksesibel. Optimistic boleh, tapi rollback + toast error bila gagal.
  - Hapus (`bi-trash`): jika `transactions_count > 0` → tombol disabled dengan `title` "Masih dipakai N transaksi — nonaktifkan saja". Tetap tangani 422 dari server (tampilkan `message`). Teks konfirmasi: "Budget untuk kategori ini juga akan terhapus."
- Tombol "Tambah Kategori" → jenis default = tab aktif.
- **Form (`CategoryFormModal`):** Nama (wajib, ≤100), Jenis (radio/toggle; **disabled** saat edit jika `transactions_count > 0`, dengan teks bantuan kenapa), `IconPicker` (grid ± 30 ikon bootstrap-icons yang relevan keuangan, termasuk semua ikon default seeder: `bi-cash-stack bi-gift bi-laptop bi-briefcase bi-graph-up-arrow bi-box-seam bi-three-dots bi-cup-hot bi-car-front bi-bag bi-receipt bi-lightning-charge bi-wifi bi-phone bi-house bi-emoji-smile bi-heart-pulse bi-mortarboard bi-film bi-wind bi-airplane`), `ColorPicker` (± 12 warna preset + `<input type="color">`), dan pratinjau `CategoryBadge`. Error 422 (mis. nama duplikat) per field.
- Setelah create/update/toggle/delete kategori → refetch `useCategories` supaya dropdown di halaman Transaksi ikut ter-update.

## E. Aturan umum
- Semua angka uang pakai `formatRupiah`, tanggal pakai `formatDate`. **Jangan** `new Date('Y-m-d')`.
- Semua warna custom via variabel Bootstrap; cek tampilan tetap terbaca di dark mode (terutama `CategoryBadge` dan nominal hijau/merah → pakai `text-success`/`text-danger`).
- Aksesibilitas: setiap input punya `<label>`, tombol ikon punya `aria-label`, modal punya `role="dialog"` + `aria-modal` + `aria-labelledby`.
- Tidak ada warning di console (key, controlled/uncontrolled input, dsb.). Tidak ada `console.log`.
- Hindari file raksasa: pecah komponen sesuai struktur di atas.

## F. Verifikasi (tempel output ke report)
```
npm --prefix frontend run lint
npm --prefix frontend run build
```
Keduanya lolos tanpa error/warning. Lalu `npm start` dan smoke test lewat proxy dengan curl (token demo): buat transaksi → list dengan `search` → update → delete → buat kategori → toggle → delete. Pastikan payload yang dikirim FE sesuai kontrak (tunjukkan contoh body dari kode). Tidak ada akses browser → tulis **"belum dicek di browser"**. Lead akan cek di Chrome: tabel/list, filter + URL sync, AmountInput, form edit dengan kategori nonaktif, hapus di halaman terakhir, dark mode, dan mobile 360px.

Hentikan server **dan buktikan** port kosong:
```powershell
foreach ($p in 8001,8010) { Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | % { Stop-Process -Id $_.OwningProcess -Force } }
Get-NetTCPConnection -LocalPort 8001,8010 -State Listen -ErrorAction SilentlyContinue   # harus kosong
```
Data demo yang dibuat saat smoke test harus **dihapus lagi** (atau jalankan `npm run db:reset` di akhir) supaya angka seed tetap sama dengan report-1.

## G. Selesai
- `git add -A && git commit -m "Phase 4: transactions CRUD and categories UI"`
- Tulis `docs/lead/report-4.md`: file dibuat/diubah, output lint & build, hasil smoke test, keputusan desain, dan deviasi + alasan. **Jangan lanjut ke Phase 5.**
