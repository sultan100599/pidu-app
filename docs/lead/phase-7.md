# PHASE 7 — Budget

Executor & reviewer: Claude. Hanya `frontend/`; backend final (report-2).

## API
- `GET /api/budgets?month&year` → `{month, year, data:[{id, category{id,name,icon,color,type}, month, year, amount, used, remaining, percentage, status: ok|warning|exceeded}], totals{amount,used,remaining}}`
- `POST /api/budgets {category_id, month, year, amount}` → 201. Kategori harus milik user dan jenis pengeluaran. Duplikat (kategori + bulan + tahun) → 422 `errors.category_id` "Budget kategori ini untuk bulan tersebut sudah ada."
- `PUT /api/budgets/{id} {amount, month?, year?}` (kategori tidak bisa diganti) → duplikat 422 `errors.month`
- `DELETE /api/budgets/{id}`
- Status backend: `exceeded` ≥ 100%, `warning` ≥ 80%, selain itu `ok`.

## Rencana
- Halaman `/budgets`: pemilih bulan ‹ September 2026 › + "Bulan ini" (URL `?year=&month=`), tombol "Tambah Budget".
- Ringkasan: total budget, terpakai, sisa/lebih + progress keseluruhan; jumlah per status (aman / hampir habis / terlampaui).
- Daftar budget (urut persentase tertinggi): ikon + nama kategori, badge status, progress (warna status), "Rp terpakai dari Rp budget", sisa/lebih, link ke transaksi kategori bulan itu, edit, hapus.
- Form tambah: select kategori pengeluaran aktif (yang sudah punya budget di bulan itu tampil disabled "(sudah ada)"), nominal (AmountInput), bulan dan tahun (default bulan yang sedang dilihat). Form edit: kategori ditampilkan (tidak bisa diganti), nominal, bulan, tahun.
- **Salin dari bulan lalu** (di empty state dan menu aksi): ambil budget bulan sebelumnya, lalu buat yang belum ada di bulan ini. Hasil: toast "N budget disalin, M dilewati".
- Komponen `BudgetProgress` dipakai bersama dengan Dashboard (menghapus duplikasi dari Phase 5).
- State loading/empty/error, mobile 360px, dark mode, aksesibilitas progress bar.

## Review
Lint + build; di Chrome: Sep 2026 = report-1 (Belanja 110,03% / Rokok 114,93% terlampaui, Hiburan 85,23% / Transportasi 89,99% hampir habis, Makanan 70,01% aman); tambah, edit, hapus, duplikat 422, salin bulan lalu; data dikembalikan ke seed; 360px + dark; console bersih. Tulis `report-7.md`, commit, lalu **tanya user** sebelum Phase 8.
