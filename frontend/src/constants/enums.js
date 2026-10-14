// Nilai enum harus tetap sinkron dengan backend.
// Urutan = urutan tampil (Pengeluaran lebih sering dipakai).
export const TRANSACTION_TYPES = {
  expense: 'Pengeluaran',
  income: 'Pemasukan',
}

export const PAYMENT_METHODS = {
  cash: 'Tunai',
  transfer: 'Transfer',
  debit: 'Debit',
  credit_card: 'Kartu Kredit',
  e_wallet: 'E-Wallet',
  qris: 'QRIS',
  other: 'Lainnya',
}

export const WALLET_KINDS = {
  cash: { label: 'Tunai', icon: 'bi-cash-coin' },
  bank: { label: 'Rekening bank', icon: 'bi-bank' },
  e_wallet: { label: 'E-wallet', icon: 'bi-phone' },
}

export const WALLET_PURPOSES = {
  personal: 'Pribadi',
  business: 'Usaha',
}

export const FREQUENCIES = {
  monthly: 'Tiap bulan',
  weekly: 'Tiap minggu',
}
