import { formatNumber, formatRupiah } from '../utils/format'

// Kartu ringkasan pemasukan/pengeluaran/saldo/jumlah transaksi.
// Nominal tidak dipotong (info utama); di layar sempit boleh turun baris.
// Dipakai ulang di Phase 5 (dashboard).
export default function SummaryCards({ summary }) {
  const cards = [
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
      key: 'balance',
      label: 'Saldo',
      icon: 'bi-wallet2',
      iconClass: summary && summary.balance < 0 ? 'text-danger' : 'text-success',
      value: summary ? formatRupiah(summary.balance) : null,
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
    <div className="row row-cols-2 row-cols-xl-4 g-2 g-md-3 mb-4">
      {cards.map((card) => (
        <div className="col" key={card.key}>
          <div className="card h-100">
            <div className="card-body d-flex align-items-center gap-3 py-3 px-2 px-sm-3">
              <i className={`bi ${card.icon} fs-4 ${card.iconClass} d-none d-sm-inline`} aria-hidden="true"></i>
              <div className="min-w-0">
                <div className="small text-body-secondary">{card.label}</div>
                {card.value == null ? (
                  <div className="placeholder-glow">
                    <span className="placeholder col-8"></span>
                  </div>
                ) : (
                  <div className={`fw-semibold text-break summary-value ${card.raw ? '' : card.iconClass}`}>{card.value}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
