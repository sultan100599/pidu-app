import { formatNumber, formatRupiah } from '../../utils/format'
import { useT } from '../../i18n/LocaleProvider'

function BalanceCell({ value, label }) {
  return (
    <td data-label={label} className={`text-end text-nowrap ${value < 0 ? 'text-danger' : value > 0 ? 'text-success' : 'text-body-secondary'}`}>
      {formatRupiah(value)}
    </td>
  )
}

// Tabel rekap generik: kolom pertama dari renderLabel(row), lalu Pemasukan | Pengeluaran | Selisih | Transaksi.
// Baris bisa diklik (onRowClick) → dapat difokus & diaktifkan dengan Enter/Spasi.
export default function ReportTable({ labelHeader, rows, rowKey, renderLabel, totals, onRowClick, rowActionLabel }) {
  const t = useT()
  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 report-table">
          <thead>
            <tr>
              <th scope="col">{t(labelHeader)}</th>
              <th scope="col" className="text-end">{t('Pemasukan')}</th>
              <th scope="col" className="text-end">{t('Pengeluaran')}</th>
              <th scope="col" className="text-end">{t('Selisih')}</th>
              <th scope="col" className="text-end">{t('Transaksi')}</th>
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
                  <td data-label={t('Pemasukan')} className={`text-end text-nowrap ${row.income > 0 ? 'text-success' : ''}`}>{formatRupiah(row.income)}</td>
                  <td data-label={t('Pengeluaran')} className={`text-end text-nowrap ${row.expense > 0 ? 'text-danger' : ''}`}>{formatRupiah(row.expense)}</td>
                  <BalanceCell value={row.balance} label={t('Selisih')} />
                  <td data-label={t('Transaksi')} className="text-end">{formatNumber(row.count)}</td>
                </tr>
              )
            })}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="fw-semibold">
                <td>{t('Total')}</td>
                <td data-label={t('Pemasukan')} className="text-end text-nowrap text-success">{formatRupiah(totals.income)}</td>
                <td data-label={t('Pengeluaran')} className="text-end text-nowrap text-danger">{formatRupiah(totals.expense)}</td>
                <BalanceCell value={totals.balance} label={t('Selisih')} />
                <td data-label={t('Transaksi')} className="text-end">{formatNumber(totals.count)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
