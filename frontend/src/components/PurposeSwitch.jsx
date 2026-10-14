import { useT } from '../i18n/LocaleProvider'
import { useWallets } from '../hooks/useWallets'
import { WALLET_PURPOSES } from '../constants/enums'

const OPTIONS = [['', 'Semua'], ...Object.entries(WALLET_PURPOSES)]

// Semua / Pribadi / Usaha. Tidak tampil untuk user yang belum punya dompet usaha.
export default function PurposeSwitch({ value, onChange, className = '' }) {
  const t = useT()
  const { hasBothPurposes } = useWallets()
  if (!hasBothPurposes && !value) return null
  return (
    <div className={`btn-group purpose-switch ${className}`} role="group" aria-label={t('Tampilkan dompet')}>
      {OPTIONS.map(([key, label]) => (
        <button
          key={key || 'all'}
          type="button"
          className={`btn btn-sm ${value === key ? 'btn-primary' : 'btn-outline-secondary'}`}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {t(label)}
        </button>
      ))}
    </div>
  )
}
