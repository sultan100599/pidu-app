import { formatDate, formatRupiah } from '../../utils/format'
import { useT } from '../../i18n/LocaleProvider'

// Kartu per transaksi untuk layar kecil (< md).
export default function TransactionList({ transactions, onEdit, onDelete, showWallet = false }) {
  const t = useT()
  return (
    <div>
      {transactions.map((trx) => {
        const title = trx.description || trx.category?.name || t('Transaksi')
        return (
          <div className="card transaction-card mb-2" key={trx.id}>
            <div className="card-body py-2 px-3">
              <div className="transaction-main d-flex justify-content-between align-items-start gap-2">
                <div className="min-w-0">
                  <div className="fw-semibold text-truncate">
                    {title}
                    {trx.recurring_transaction_id && <i className="bi bi-arrow-repeat text-body-secondary ms-1" role="img" aria-label={t('Transaksi rutin')}></i>}
                  </div>
                  <div className="small text-body-secondary text-truncate">
                    {formatDate(trx.transaction_date)} · {trx.category?.name ?? t('Tanpa kategori')} · {showWallet && trx.wallet ? trx.wallet.name : t(trx.payment_method_label)}
                  </div>
                </div>
                <div
                  className={`transaction-amount fw-semibold text-nowrap ${trx.type === 'income' ? 'text-success' : 'text-danger'}`}
                >
                  {trx.type === 'income' ? '+' : '−'}
                  {formatRupiah(trx.amount)}
                </div>
              </div>
              {trx.notes && <div className="small text-body-secondary text-truncate mt-1">{trx.notes}</div>}
              <div className="d-flex justify-content-end gap-1 mt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  aria-label={t('Edit transaksi {name}', { name: title })}
                  onClick={() => onEdit(trx)}
                >
                  <i className="bi bi-pencil" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  aria-label={t('Hapus transaksi {name}', { name: title })}
                  onClick={() => onDelete(trx)}
                >
                  <i className="bi bi-trash" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
