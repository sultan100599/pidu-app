import * as walletsApi from '../api/wallets'
import { useFetch } from './useFetch'

// Daftar dompet + saldo hari ini. Ikut dimuat ulang setiap ada transaksi tersimpan (useFetch).
export function useWallets() {
  const { data, loading, error, reload } = useFetch('wallets', (signal) => walletsApi.list({ signal }))
  const wallets = data?.data ?? []
  const active = wallets.filter((w) => w.is_active)
  return {
    wallets,
    active,
    // Saringan Pribadi/Usaha hanya berguna kalau dua-duanya dipakai.
    hasBothPurposes: active.some((w) => w.purpose === 'business') && active.some((w) => w.purpose === 'personal'),
    loading,
    error,
    loaded: data != null,
    refetch: reload,
  }
}
