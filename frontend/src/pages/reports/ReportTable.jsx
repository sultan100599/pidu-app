import { formatNumber, formatRupiah } from '../../utils/format'

function BalanceCell({ value }) {
  return (
    <td className={`text-end text-nowrap ${value < 0 ? 'text-danger' : value > 0 ? 'text-success' : 'text-body-secondary'}`}>
      {formatRupiah(value)}
    </td>
  )
}

// Tabel rekap generik: kolom pertama dari renderLabel(row), lalu Pemasukan | Pengeluaran | Saldo | Transaksi.
// Baris bisa diklik (onRowClick) → dapat difokus & diaktifkan dengan Enter/Spasi.
export default function ReportTable({ labelHeader, rows, rowKey, renderLabel, totals, onRowClick, rowActionLabel }) {
  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 report-table">
          <thead>
            <tr>
              <th scope="col">{labelHeader}</th>
              <th scope="col" className="text-end">Pemasukan</th>
              <th scope="col" className="text-end">Pengeluaran</th>
              <th scope="col" className="text-end">Saldo</th>
              <th scope="col" className="text-end">Transaksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const empty = row.count === 0
              const clickable = Boolean(onRowClick)
              return (
                <tr
                  key={rowKey(row)}
                  className={`${empty ? 'text-body-secondary' : ''} ${clickable ? 'clickable-row' : ''}`}
                  onClick={clickable ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    clickable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onRowClick(row)
                          }
                        }
                      : undefined
                  }
                  tabIndex={clickable ? 0 : undefined}
                  aria-label={clickable && rowActionLabel ? rowActionLabel(row) : undefined}
                >
                  <td className="text-nowrap">{renderLabel(row)}</td>
                  <td className={`text-end text-nowrap ${row.income > 0 ? 'text-success' : ''}`}>{formatRupiah(row.income)}</td>
                  <td className={`text-end text-nowrap ${row.expense > 0 ? 'text-danger' : ''}`}>{formatRupiah(row.expense)}</td>
                  <BalanceCell value={row.balance} />
                  <td className="text-end">{formatNumber(row.count)}</td>
                </tr>
              )
            })}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="fw-semibold">
                <td>Total</td>
                <td className="text-end text-nowrap text-success">{formatRupiah(totals.income)}</td>
                <td className="text-end text-nowrap text-danger">{formatRupiah(totals.expense)}</td>
                <BalanceCell value={totals.balance} />
                <td className="text-end">{formatNumber(totals.count)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
