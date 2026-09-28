import { formatDate, formatRupiah } from '../../utils/format'

// Kartu per transaksi untuk layar kecil (< md).
export default function TransactionList({ transactions, onEdit, onDelete }) {
  return (
    <div>
      {transactions.map((trx) => {
        const title = trx.description || trx.category?.name || 'Transaksi'
        return (
          <div className="card mb-2" key={trx.id}>
            <div className="card-body py-2 px-3">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div className="min-w-0">
                  <div className="fw-semibold text-truncate">{title}</div>
                  <div className="small text-body-secondary text-truncate">
                    {formatDate(trx.transaction_date)} · {trx.category?.name ?? '—'} · {trx.payment_method_label}
                  </div>
                </div>
                <div
                  className={`fw-semibold text-nowrap ${trx.type === 'income' ? 'text-success' : 'text-danger'}`}
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
                  aria-label={`Edit transaksi ${title}`}
                  onClick={() => onEdit(trx)}
                >
                  <i className="bi bi-pencil" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  aria-label={`Hapus transaksi ${title}`}
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
