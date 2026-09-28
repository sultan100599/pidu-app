import CategoryBadge from '../../components/CategoryBadge'
import { formatDate, formatRupiah } from '../../utils/format'

function SortableHeader({ label, column, sort, dir, onSort, className = '' }) {
  const active = sort === column
  const icon = active ? (dir === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-sort-down text-body-tertiary'
  return (
    <th className={className} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className="btn btn-link p-0 border-0 fw-bold text-body text-decoration-none align-baseline"
        onClick={() => onSort(column)}
      >
        {label} <i className={`bi ${icon}`} aria-hidden="true"></i>
      </button>
    </th>
  )
}

export default function TransactionTable({ transactions, sort, dir, onSort, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <SortableHeader label="Tanggal" column="transaction_date" sort={sort} dir={dir} onSort={onSort} />
              <th>Deskripsi</th>
              <th>Kategori</th>
              <th>Metode</th>
              <SortableHeader label="Nominal" column="amount" sort={sort} dir={dir} onSort={onSort} className="text-end" />
              <th>
                <span className="visually-hidden">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((trx) => (
              <tr key={trx.id}>
                <td className="text-nowrap">{formatDate(trx.transaction_date)}</td>
                <td>
                  {trx.description ? (
                    <span>{trx.description}</span>
                  ) : (
                    <span className="text-body-secondary">{trx.category?.name ?? '—'}</span>
                  )}
                  {trx.notes && (
                    <div className="small text-body-secondary text-truncate" style={{ maxWidth: 320 }}>
                      {trx.notes}
                    </div>
                  )}
                </td>
                <td>
                  <CategoryBadge category={trx.category} />
                </td>
                <td className="text-nowrap">{trx.payment_method_label}</td>
                <td
                  className={`text-end fw-semibold text-nowrap ${trx.type === 'income' ? 'text-success' : 'text-danger'}`}
                >
                  {trx.type === 'income' ? '+' : '−'}
                  {formatRupiah(trx.amount)}
                </td>
                <td className="text-end text-nowrap">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary me-1"
                    aria-label={`Edit transaksi ${trx.description || trx.category?.name || trx.id}`}
                    onClick={() => onEdit(trx)}
                  >
                    <i className="bi bi-pencil" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    aria-label={`Hapus transaksi ${trx.description || trx.category?.name || trx.id}`}
                    onClick={() => onDelete(trx)}
                  >
                    <i className="bi bi-trash" aria-hidden="true"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
