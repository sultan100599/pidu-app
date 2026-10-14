import { formatRupiah } from '../utils/format'
import CategoryIcon from './CategoryIcon'
import { useT } from '../i18n/LocaleProvider'

// Status dari backend: exceeded ≥ 100%, warning ≥ 80%, selain itu ok.
export const BUDGET_STATUS = {
  ok: { bar: 'bg-success', text: 'text-success', badge: 'text-bg-success', label: 'Aman' },
  warning: { bar: 'bg-warning', text: 'text-warning-emphasis', badge: 'text-bg-warning', label: 'Hampir habis' },
  exceeded: { bar: 'bg-danger', text: 'text-danger', badge: 'text-bg-danger', label: 'Terlampaui' },
}

export function budgetStatus(status) {
  return BUDGET_STATUS[status] ?? BUDGET_STATUS.ok
}

// Progress satu budget: nama kategori + persen, bar berwarna status, lalu pemakaian.
// `aside` (opsional) menggantikan persen di kanan atas (mis. badge status).
export default function BudgetProgress({ budget, title, aside, height = 8 }) {
  const t = useT()
  const status = budgetStatus(budget.status)
  const { category } = budget

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center gap-2 small">
        {title ?? (
          <span className="d-inline-flex align-items-center gap-2 min-w-0">
            <CategoryIcon icon={category.icon} color={category.color} />
            <span className="text-truncate">{category.name}</span>
          </span>
        )}
        {aside ?? (
          <span className={`fw-semibold text-nowrap ${status.text}`}>{budget.percentage.toLocaleString('id-ID')}%</span>
        )}
      </div>
      <div
        className="progress budget-progress mt-1"
        style={{ height }}
        role="progressbar"
        aria-label={t('Pemakaian anggaran {name}: {percent}%, {status}', { name: category.name, percent: budget.percentage.toLocaleString('id-ID'), status: t(status.label) })}
        aria-valuenow={Math.round(budget.percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`progress-bar ${status.bar}`} style={{ width: `${Math.min(100, budget.percentage)}%` }}></div>
      </div>
      <div className="small text-body-secondary mt-1">
        {t('{used} dari {amount}', { used: formatRupiah(budget.used), amount: formatRupiah(budget.amount) })} ·{' '}
        {budget.remaining >= 0 ? (
          t('sisa {amount}', { amount: formatRupiah(budget.remaining) })
        ) : (
          <span className="text-danger">{t('lebih {amount}', { amount: formatRupiah(-budget.remaining) })}</span>
        )}
      </div>
    </div>
  )
}
