# Report Phase 7 — Budget

Tanggal: 2026-09-29 · Executor & reviewer: Claude · Scope: `frontend/` saja (backend tidak diubah).

## Ringkasan
Halaman **Budget** selesai: tambah, edit (termasuk pindah bulan), hapus, "Salin bulan lalu", ringkasan total, dan jumlah per status. Dicek di Chrome (desktop, 360px, dark mode). Semua angka September 2026 cocok dengan report-1. Lint 0 warning, build sukses.

## File
**Baru**
- `api/budgets.js`
- `components/BudgetProgress.jsx`: bar + persen + pemakaian, beserta `BUDGET_STATUS`. Dipakai bersama Dashboard dan halaman Budget; duplikasi dari Phase 5 dihapus.
- `pages/budgets/BudgetsPage.jsx`, `pages/budgets/BudgetFormModal.jsx`

**Diubah / dipindah**
- `components/ui/Stepper.jsx` (dipindah dari `pages/reports/`, sekarang dipakai Kalender, Rekap Bulanan, dan Budget)
- `components/ui/ConfirmDialog.jsx`: prop `confirmVariant` (default `danger`; "Salin" memakai `primary`)
- `pages/dashboard/DashboardPage.jsx`: memakai `BudgetProgress`
- `App.jsx`: route `/budgets`

## Fitur
- Navigasi ‹ bulan › + "Hari ini" (tampil hanya jika bukan bulan berjalan); state di URL `?year=&month=`.
- **Ringkasan:** progress total (warna mengikuti ambang yang sama: ≥ 80% kuning, ≥ 100% merah), "Rp terpakai dari Rp budget · sisa/lebih", badge jumlah aman / hampir habis / terlampaui.
- **Kartu per budget** (urut persentase tertinggi): ikon dan nama kategori, badge status, progress, sisa atau lebih (merah), persen, link "Lihat transaksi" (kategori + bulan tersebut), edit, hapus.
- **Form tambah:** kategori pengeluaran aktif; yang sudah punya budget di bulan itu tampil disabled "(sudah ada)"; nominal (AmountInput); bulan dan tahun (default bulan yang sedang dilihat). Budget yang dibuat atau dipindah ke bulan lain → tampilan ikut pindah ke bulan itu.
- **Form edit:** kategori ditampilkan sebagai badge (API tidak mengizinkan ganti kategori); nominal, bulan, dan tahun bisa diubah. Error duplikat dari server tampil di field Bulan.
- **Salin bulan lalu** (di empty state dan di samping stepper) dengan konfirmasi. Budget bulan sebelumnya disalin, kategori yang sudah ada dilewati, lalu toast "N budget disalin, M dilewati".
- Hapus dengan konfirmasi ("Transaksi tidak ikut terhapus").
- Progress bar punya `role="progressbar"`, `aria-valuenow`, dan label berisi persen + status.

## Verifikasi (Chrome DevTools)
| Cek | Hasil |
|---|---|
| September 2026 | Rokok 114,93% & Belanja 110,03% **Terlampaui**; Transportasi 89,99% & Hiburan 85,23% **Hampir habis**; Makanan 70,01% **Aman** (= report-1) |
| Total | Rp 5.630.000 dari Rp 6.583.000 (85,52%) = jumlah per kategori; badge 1 / 2 / 2 |
| Form tambah | Fokus ke select kategori; 5 kategori yang sudah punya budget disabled |
| Tambah Anak Rp 500.000 | 201; pemakaian Rp 481.000 (96,2%, Hampir habis), sama dengan angka Dashboard |
| Edit Anak → Oktober | 200; URL → `?year=2026&month=10`, kartu pindah |
| Salin bulan lalu (Okt) | "5 budget disalin."; nominal sama dengan September |
| Edit Makanan (Okt) → September | 422: "Budget kategori ini untuk bulan tersebut sudah ada." di field Bulan |
| Hapus via UI | Konfirmasi benar; kartu hilang |
| Empty state (Okt setelah dibersihkan) | "Belum ada budget untuk Oktober 2026" + Tambah + Salin |
| 360px + dark | scrollWidth 360, tidak ada elemen meluber |
| Console | Hanya 422 dari uji duplikat yang disengaja |
| Data setelah uji | 696 transaksi / 44 kategori / 5 budget (= seed) |
| lint / build / port | 0 warning / sukses / 8001 & 8010 kosong |

## Perbaikan selama review
- Tombol "Salin bulan lalu" di samping stepper memakai `btn-sm`, supaya tingginya sama dengan stepper.
- Varian tombol salin diganti `outline-primary`, karena `outline-secondary` terlihat seperti tombol nonaktif di dark mode.
