// Enum bersama backend — jangan diubah sembarangan (harus sinkron dengan backend).
// Urutan = urutan tampil (Pengeluaran lebih sering dipakai).
export const TRANSACTION_TYPES = {
  expense: 'Pengeluaran',
  income: 'Pemasukan',
}

export const PAYMENT_METHODS = {
  cash: 'Cash',
  transfer: 'Transfer',
  debit: 'Debit',
  credit_card: 'Kartu Kredit',
  e_wallet: 'E-Wallet',
  qris: 'QRIS',
  other: 'Lainnya',
}
