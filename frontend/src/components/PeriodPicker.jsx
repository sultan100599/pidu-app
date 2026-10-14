import { useSearchParams } from 'react-router-dom'
import { useT } from '../i18n/LocaleProvider'
import { getPeriodRange, isCustomRangeInvalid, PERIOD_PRESETS } from '../utils/period'

const PRESETS = PERIOD_PRESETS.filter((p) => p.value !== 'all')

// Baca periode dari URL (?period=&start_date=&end_date=). Tanpa `period` → defaultPreset.
// Mengembalikan range siap kirim ke API ({start_date,end_date}) atau null bila kustom belum lengkap/invalid.
export function usePeriodQuery(defaultPreset = 'this_month') {
  const [searchParams, setSearchParams] = useSearchParams()
  const period = searchParams.get('period') || defaultPreset
  const start = searchParams.get('start_date') ?? ''
  const end = searchParams.get('end_date') ?? ''
  const invalid = isCustomRangeInvalid(period, start, end)
  const range = invalid ? null : getPeriodRange(period, start, end)

  function update(changes) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(changes)) {
        if (value === '' || value == null) next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  return { period, start, end, invalid, range, update, defaultPreset }
}

// Pemilih periode (preset + kustom), state di URL lewat usePeriodQuery.
export default function PeriodPicker({ query, idPrefix = 'period' }) {
  const t = useT()
  const { period, start, end, invalid, update, defaultPreset } = query

  function changePreset(value) {
    if (value === 'custom') {
      const range = getPeriodRange(period, start, end) ?? getPeriodRange('this_month')
      update({ period: 'custom', ...range })
    } else {
      update({ period: value === defaultPreset ? '' : value, start_date: '', end_date: '' })
    }
  }

  return (
    <div className="period-picker d-flex flex-wrap align-items-center gap-2">
      <div className="period-preset">
        <label htmlFor={`${idPrefix}-preset`} className="visually-hidden">
          {t('Periode')}
        </label>
        <i className="bi bi-calendar3" aria-hidden="true"></i>
        <select
          id={`${idPrefix}-preset`}
          className="form-select form-select-sm"
          value={period}
          onChange={(e) => changePreset(e.target.value)}
        >
          {PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {t(p.label)}
            </option>
          ))}
        </select>
      </div>
      {period === 'custom' && (
        <>
          <div className="period-range d-flex align-items-center gap-2">
            <label htmlFor={`${idPrefix}-start`} className="visually-hidden">
              {t('Dari')}
            </label>
            <input
              type="date"
              id={`${idPrefix}-start`}
              className={`form-control form-control-sm ${invalid ? 'is-invalid' : ''}`}
              value={start}
              onChange={(e) => update({ start_date: e.target.value })}
            />
            <span className="text-body-secondary" aria-hidden="true">–</span>
            <label htmlFor={`${idPrefix}-end`} className="visually-hidden">
              {t('Sampai')}
            </label>
            <input
              type="date"
              id={`${idPrefix}-end`}
              className={`form-control form-control-sm ${invalid ? 'is-invalid' : ''}`}
              value={end}
              onChange={(e) => update({ end_date: e.target.value })}
            />
          </div>
          {invalid && (
            <p className="text-danger small mb-0 w-100" role="alert">
              {t('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
