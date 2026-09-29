import { formatNumber, formatRupiah } from '../utils/format'
import { useT } from '../i18n/LocaleProvider'
import { usePointerTilt } from '../hooks/usePointerTilt'
import AnimatedBalance from './AnimatedBalance'
import PeriodComparison from './PeriodComparison'
import { SkeletonBar } from './ui/PageSkeleton'

// Nominal boleh turun baris agar angka utuh tetap terbaca di HP.
export default function SummaryCards({ summary, prominent = false, comparison }) {
  const t = useT()
  const balanceRef = usePointerTilt()
  const cards = [
    {
      key: 'balance',
      label: 'Saldo',
      icon: 'bi-wallet2',
      iconClass: summary && summary.balance < 0 ? 'text-danger' : 'text-success',
      value: summary ? formatRupiah(summary.balance) : null,
    },
    {
      key: 'income',
      label: 'Pemasukan',
      icon: 'bi-arrow-down-circle',
      iconClass: 'text-success',
      value: summary ? formatRupiah(summary.income) : null,
    },
    {
      key: 'expense',
      label: 'Pengeluaran',
      icon: 'bi-arrow-up-circle',
      iconClass: 'text-danger',
      value: summary ? formatRupiah(summary.expense) : null,
    },
    {
      key: 'count',
      label: 'Jumlah transaksi',
      icon: 'bi-receipt',
      iconClass: 'text-primary',
      value: summary ? formatNumber(summary.count) : null,
      raw: true,
    },
  ]

  return (
    <div className={`summary-grid${prominent ? ' summary-grid-prominent' : ''}`} aria-busy={!summary}>
      {!summary && <span className="visually-hidden">{t('Memuat…')}</span>}
      {cards.map((card) => (
        <div className={`min-w-0 summary-slot${card.key === 'balance' ? ' balance-stack' : ''}`} key={card.key} ref={card.key === 'balance' ? balanceRef : undefined}>
          <div className="card h-100 summary-card" data-summary={card.key}>
            <div className="card-body">
              <i className={`bi ${card.icon} icon-tile summary-icon ${card.iconClass}`} aria-hidden="true"></i>
              <div className="min-w-0">
                <div className="small text-body-secondary">{t(card.label)}</div>
                {card.value == null ? (
                  <SkeletonBar className="skeleton-value" />
                ) : (
                  <div className={`fw-semibold text-break summary-value ${card.raw ? '' : card.iconClass}`}>
                    {prominent && card.key === 'balance' ? <AnimatedBalance value={Number(summary.balance)} /> : card.value}
                  </div>
                )}
                {comparison && !card.raw && <PeriodComparison {...comparison} kind={card.key} current={summary?.[card.key]} previous={comparison.summary?.[card.key]} />}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
