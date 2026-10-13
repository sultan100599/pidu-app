import { formatNumber, formatRupiah } from '../utils/format'
import { useT } from '../i18n/LocaleProvider'
import { usePointerTilt } from '../hooks/usePointerTilt'
import AnimatedBalance from './AnimatedBalance'
import PeriodComparison from './PeriodComparison'
import { SkeletonBar } from './ui/PageSkeleton'

const tone = (value) => (value < 0 ? 'text-danger' : 'text-success')

// Ringkasan periode: Selisih (pemasukan − pengeluaran), Pemasukan, Pengeluaran, Jumlah transaksi.
// Dengan `wallet` (dashboard), kartu utama menjadi uang yang benar-benar dimiliki user
// dan kartu jumlah transaksi diganti Selisih periode.
// Nominal boleh turun baris agar angka utuh tetap terbaca di HP.
export default function SummaryCards({ summary, prominent = false, comparison, wallet, walletNote, className = '', children }) {
  const t = useT()
  const balanceRef = usePointerTilt()
  const net = {
    key: 'balance',
    label: 'Selisih',
    icon: 'bi-plus-slash-minus',
    iconClass: summary ? tone(summary.balance) : '',
    value: summary ? formatRupiah(summary.balance) : null,
  }
  const cards = [
    wallet
      ? {
        key: 'wallet',
        label: 'Uang kamu sekarang',
        icon: 'bi-wallet2',
        iconClass: tone(wallet.current_balance),
        value: formatRupiah(wallet.current_balance),
        animated: Number(wallet.current_balance),
        note: walletNote,
      }
      : { ...net, icon: 'bi-wallet2', animated: summary ? Number(summary.balance) : null },
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
    wallet
      ? net
      : {
        key: 'count',
        label: 'Jumlah transaksi',
        icon: 'bi-receipt',
        iconClass: 'text-primary',
        value: summary ? formatNumber(summary.count) : null,
        raw: true,
      },
  ]

  return (
    <div className={`summary-grid${prominent ? ' summary-grid-prominent' : ''} ${className}`} aria-busy={!summary}>
      {!summary && <span className="visually-hidden">{t('Memuat…')}</span>}
      {cards.map((card, index) => (
        <div className={`min-w-0 summary-slot${index === 0 ? ' balance-stack' : ''}`} key={card.key} ref={index === 0 ? balanceRef : undefined}>
          {/* Gaya kartu utama di CSS memakai data-summary="balance"; Selisih di posisi lain memakai "net". */}
          <div className="card h-100 summary-card" data-summary={index === 0 ? 'balance' : card.key === 'balance' ? 'net' : card.key}>
            <div className="card-body">
              <i className={`bi ${card.icon} icon-tile summary-icon ${card.iconClass}`} aria-hidden="true"></i>
              <div className="min-w-0">
                <div className="small text-body-secondary">{t(card.label)}</div>
                {card.value == null ? (
                  <SkeletonBar className="skeleton-value" />
                ) : (
                  <div className={`fw-semibold text-break summary-value ${card.raw ? '' : card.iconClass}`}>
                    {prominent && index === 0 ? <AnimatedBalance value={card.animated} /> : card.value}
                  </div>
                )}
                {card.note}
                {comparison && !card.raw && card.key !== 'wallet' && (
                  <PeriodComparison {...comparison} kind={card.key} current={summary?.[card.key]} previous={comparison.summary?.[card.key]} />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {children}
    </div>
  )
}
