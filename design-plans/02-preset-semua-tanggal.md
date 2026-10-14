# Preset periode "all" bernama "Semua tanggal" di semua tempat

Written against: 990be50

## Evidence chain

- Surface: `/transactions` (subjudul dan pilihan Periode di filter), `/export` (select Periode)
- Problem: keadaan tanpa batas tanggal disebut "Semua tanggal" di subjudul Transaksi dan di kartu Unduh data, tapi "Semua" di pilihan Periode filter Transaksi.
- Design evidence: `TransactionsPage.jsx` (subjudul 'Semua tanggal'), `ExportPage.jsx` (menimpa label preset `all` menjadi 'Semua tanggal')
- Owner: `frontend/src/utils/period.js` (`PERIOD_PRESETS`)
- Scope and affected surfaces: `TransactionFilters.jsx`, `ExportPage.jsx`; `PeriodPicker` membuang preset `all`, jadi tidak terdampak
- Uncertainty: none

## Design decision

Label preset `all` di sumbernya menjadi "Semua tanggal", sehingga penimpaan khusus di `ExportPage` tidak diperlukan lagi.

## Reuse

- Kunci kamus "Semua tanggal" yang sudah ada (`i18n/areas.js`)
- Exemplar: `ExportPage.jsx`

## Changes

1. `frontend/src/utils/period.js`
   - Change: `{ value: 'all', label: 'Semua tanggal' }`
   - Preserve: nilai `all` dan urutan preset
   - Verify: filter Transaksi menampilkan "Semua tanggal"
2. `frontend/src/pages/export/ExportPage.jsx`
   - Change: hapus penimpaan label khusus `all`, pakai `t(p.label)`
   - Verify: select Periode di Unduh data tetap "Semua tanggal"

## Scope

- Inherit: TransactionFilters, ExportPage
- Verify: e2e yang memilih preset Periode
- Exclude: label "Semua" lain (jenis transaksi, saringan Pribadi/Usaha)

## Validation

- Product: user melihat satu nama untuk keadaan yang sama
- Interface: `/transactions` desktop dan HP (filter dibuka), `/export`
- System: tidak ada kunci baru
- Repository: `npm run lint` dan `node frontend/scripts/check-locales.mjs` → PASS

## Stop conditions

- Stop bila "Semua" untuk preset ini dipakai sebagai teks pencarian di tes atau kode lain.

## Design documentation

- After acceptance and validation: none
