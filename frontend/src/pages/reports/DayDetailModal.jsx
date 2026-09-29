import { Link } from 'react-router-dom'
import * as reportsApi from '../../api/reports'
import CategoryBadge from '../../components/CategoryBadge'
import Modal from '../../components/ui/Modal'
import { useFetch } from '../../hooks/useFetch'
import { getErrorMessage } from '../../utils/errors'
import { formatDate, formatRupiah } from '../../utils/format'

// Detail transaksi pada satu tanggal (dipakai Rekap Harian & Kalender). date = null → tertutup.
export default function DayDetailModal({ date, onClose }) {
  const { data, error, loading, reload } = useFetch(date, (signal) => reportsApi.day(date, { signal }))
  const ready = data && data.date === date

  const footer = (
    <>
      {date && (
        <Link
          to={`/transactions?period=custom&start_date=${date}&end_date=${date}`}
          className="btn btn-outline-primary me-auto"
        >
          Lihat di Transaksi
        </Link>
      )}
      <button type="button" className="btn btn-secondary" onClick={onClose}>
        Tutup
      </button>
    </>
  )

  let body
  if (error) {
    body = (
      <div className="text-center py-3">
        <p className="text-danger">{getErrorMessage(error)}</p>
        <button type="button" className="btn btn-sm btn-primary" onClick={reload}>
          Coba lagi
        </button>
      </div>
    )
  } else if (!ready || loading) {
    body = (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Memuat...</span>
        </div>
      </div>
    )
  } else {
    const { totals, transactions } = data
    body = (
      <>
        <div className="day-totals row g-2 mb-3 text-center small">
          <div className="col-4">
            <div className="text-body-secondary">Pemasukan</div>
            <div className="fw-semibold text-success">{formatRupiah(totals.income)}</div>
          </div>
          <div className="col-4">
            <div className="text-body-secondary">Pengeluaran</div>
            <div className="fw-semibold text-danger">{formatRupiah(totals.expense)}</div>
          </div>
          <div className="col-4">
            <div className="text-body-secondary">Saldo</div>
            <div className={`fw-semibold ${totals.balance < 0 ? 'text-danger' : 'text-success'}`}>
              {formatRupiah(totals.balance)}
            </div>
          </div>
        </div>
        {transactions.length === 0 ? (
          <p className="text-center text-body-secondary py-3 mb-0">Tidak ada transaksi pada tanggal ini.</p>
        ) : (
          <ul className="day-transactions list-group list-group-flush">
            {transactions.map((trx) => (
              <li key={trx.id} className="list-group-item px-0 d-flex justify-content-between align-items-start gap-2">
                <div className="min-w-0">
                  <div className="fw-semibold text-truncate">{trx.description || trx.category?.name}</div>
                  <div className="small mt-1 d-flex flex-wrap align-items-center gap-2">
                    <CategoryBadge category={trx.category} />
                    <span className="text-body-secondary">{trx.payment_method_label}</span>
                  </div>
                </div>
                <div className={`fw-semibold text-nowrap ${trx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                  {trx.type === 'income' ? '+' : '−'}
                  {formatRupiah(trx.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </>
    )
  }

  return (
    <Modal show={Boolean(date)} onClose={onClose} title={date ? formatDate(date, 'long') : ''} footer={footer}>
      {body}
    </Modal>
  )
}
