import axios from 'axios'
import { useEffect, useState } from 'react'

// Fetch berbasis key (pola dari halaman Transaksi):
// - hasil disimpan bersama key request-nya → loading = key belum cocok (tanpa setState sinkron di effect)
// - request lama dibatalkan (AbortController), jadi respons yang datang terlambat diabaikan
// - data lama tetap tersedia selama refetch (UI tidak berkedip kosong)
// `key` harus berubah setiap kali parameter berubah; `fetcher(signal)` → Promise<response>.
// key = null → tidak fetch.
export function useFetch(key, fetcher) {
  const [reloadToken, setReloadToken] = useState(0)
  const requestKey = key == null ? null : `${key}#${reloadToken}`
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    if (requestKey == null) return undefined
    const controller = new AbortController()
    fetcher(controller.signal)
      .then((response) => setResult({ key: requestKey, data: response.data, error: null }))
      .catch((err) => {
        if (axios.isCancel(err)) return
        setResult((prev) => ({ key: requestKey, data: prev.data, error: err }))
      })
    return () => controller.abort()
    // fetcher sengaja tidak jadi dependency: parameternya sudah tercakup di `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  return {
    data: result.data,
    error: result.key === requestKey ? result.error : null,
    loading: requestKey != null && result.key !== requestKey,
    reload: () => setReloadToken((t) => t + 1),
  }
}
