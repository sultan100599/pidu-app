import { useSearchParams } from 'react-router-dom'

const PURPOSES = ['personal', 'business']

// Saringan dompet Pribadi/Usaha di URL (?purpose=), dipakai dashboard dan laporan.
export function usePurpose() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('purpose')
  const purpose = PURPOSES.includes(raw) ? raw : ''

  function setPurpose(value) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set('purpose', value)
      else next.delete('purpose')
      return next
    })
  }

  return {
    purpose,
    setPurpose,
    // Tempel ke parameter API; tanpa saringan → parameter tidak berubah.
    withPurpose: (params) => (purpose ? { ...params, purpose } : params),
    search: purpose ? `?purpose=${purpose}` : '',
  }
}
