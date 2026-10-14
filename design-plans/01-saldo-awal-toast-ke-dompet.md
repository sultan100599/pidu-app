# Toast "Mulai dari Rp 0" mengarahkan ke halaman Dompet

Written against: 990be50

## Evidence chain

- Surface: `/` Ringkasan, prompt saldo awal (`OpeningBalancePrompt`), tombol "Mulai dari Rp 0"
- Problem: toast berbunyi "Bisa diubah kapan saja di menu Akun.", padahal halaman Akun tidak punya isian saldo dan menyatakan saldo awal diatur per dompet di halaman Dompet.
- Design evidence: `frontend/src/pages/AccountPage.jsx` (ProfileCard: "Saldo awal diatur per dompet di halaman Dompet"), `WalletFormModal.jsx` (isian Saldo awal), `WalletNote` di `DashboardPage.jsx` (link Ubah ke `/wallets`)
- Owner: `frontend/src/pages/dashboard/OpeningBalancePrompt.jsx`, kamus `frontend/src/i18n/phase15.js`
- Scope and affected surfaces: toast prompt saldo awal (id/en/su)
- Uncertainty: none

## Design decision

Teks toast menyebut halaman Dompet, satu-satunya tempat saldo awal bisa diubah sejak Phase 18.

## Reuse

- Kunci kamus baru menggantikan baris lama di `i18n/phase15.js`
- Exemplar: `AccountPage.jsx` ("di halaman Dompet")

## Changes

1. `frontend/src/pages/dashboard/OpeningBalancePrompt.jsx`
   - Change: teks toast menjadi "Saldo dimulai dari Rp 0. Bisa diubah kapan saja di halaman Dompet."
   - Preserve: toast "Saldo awal disimpan." untuk nominal > 0
   - Verify: tekan "Mulai dari Rp 0", toast menyebut halaman Dompet
2. `frontend/src/i18n/phase15.js`
   - Change: baris [id, en, su] mengikuti teks baru (en "…on the Wallets page.", su "…dina kaca Dompet.")

## Scope

- Inherit: prompt saldo awal di Ringkasan
- Verify: `check-locales` (kunci lama tidak tersisa)
- Exclude: teks lain

## Validation

- Product: user baru menekan "Mulai dari Rp 0" lalu tahu harus ke Dompet
- Interface: toast di tiga bahasa
- System: tidak ada kunci ganda
- Repository: `node frontend/scripts/check-locales.mjs` → PASS

## Stop conditions

- Stop bila saldo awal ternyata bisa diatur di tempat lain selain Dompet.

## Design documentation

- After acceptance and validation: none
