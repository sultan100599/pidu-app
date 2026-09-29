import { comparison } from '../utils/dashboard'
import { useT } from '../i18n/LocaleProvider'
import { SkeletonBar } from './ui/PageSkeleton'

export default function PeriodComparison({ current, previous, kind, loading, error, label }) {
  const t = useT()
  if (loading) return <div className="comparison-loading" aria-busy="true"><SkeletonBar /><span className="visually-hidden">{t('Memuat perbandingan…')}</span></div>
  if (error || previous == null) return <div className="period-comparison" data-tone="muted">{t('Perbandingan belum tersedia')}</div>
  const result = comparison(Number(current), Number(previous), kind)
  return <div className="period-comparison" data-tone={result.tone}>
    {t(result.text)} {Number(previous) === 0 ? label : t('dari {label}', { label })}
  </div>
}
