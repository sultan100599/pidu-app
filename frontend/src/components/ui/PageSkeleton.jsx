import { useT } from '../../i18n/LocaleProvider'

export function SkeletonBar({ className = '' }) {
  return <span className={`skeleton-bar ${className}`} aria-hidden="true" />
}

export default function PageSkeleton({ variant = 'report', summary = true }) {
  const t = useT()
  const cards = variant === 'budgets'
  const calendar = variant === 'calendar'
  return <div className={`page-skeleton skeleton-${variant}`} aria-busy="true" role="status">
    <span className="visually-hidden">{t('Memuat…')}</span>
    {summary && cards && <div className="card budget-overview p-3 mb-3" aria-hidden="true"><SkeletonBar className="w-50" /><SkeletonBar /><SkeletonBar className="w-50" /></div>}
    {summary && !cards && variant !== 'categories' && <div className="summary-grid" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => <div className="card p-3" key={i}><SkeletonBar className="w-50" /><SkeletonBar className="skeleton-value" /></div>)}
    </div>}
    {(variant === 'dashboard' || variant === 'report') && <div className="card p-3 mb-3" aria-hidden="true"><SkeletonBar className="w-50" /><div className="skeleton-chart" /></div>}
    <div className={calendar ? 'calendar-grid' : cards ? 'row row-cols-1 row-cols-md-2 g-3' : 'card skeleton-list'} aria-hidden="true">
      {Array.from({ length: calendar ? 35 : 6 }, (_, i) => <div key={i} className={calendar ? 'calendar-cell' : cards ? 'col' : 'skeleton-row'}>
        <div className={cards ? 'card p-3' : 'w-100'}><SkeletonBar className="w-50" />{!calendar && <SkeletonBar />}</div>
        {!cards && !calendar && <><SkeletonBar className="skeleton-detail" /><SkeletonBar className="skeleton-detail" /></>}
      </div>)}
    </div>
  </div>
}
