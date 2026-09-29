import { comparison } from '../utils/dashboard'
import { SkeletonBar } from './ui/PageSkeleton'

export default function PeriodComparison({ current, previous, kind, loading, error, label }) {
  if (loading) return <div className="comparison-loading" aria-busy="true"><SkeletonBar /><span className="visually-hidden">Memuat perbandingan…</span></div>
  if (error || previous == null) return <div className="period-comparison" data-tone="muted">Perbandingan belum tersedia</div>
  const result = comparison(Number(current), Number(previous), kind)
  return <div className="period-comparison" data-tone={result.tone}>
    {result.text} {Number(previous) === 0 ? label : `dari ${label}`}
  </div>
}
