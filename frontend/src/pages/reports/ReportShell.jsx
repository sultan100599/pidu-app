import IncomeExpenseChart from '../../components/charts/IncomeExpenseChart'
import SummaryCards from '../../components/SummaryCards'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { getErrorMessage } from '../../utils/errors'
import PageSkeleton from '../../components/ui/PageSkeleton'

// Kerangka halaman rekap: state loading/error, ringkasan total, grafik, lalu isi (tabel).
// chart: { labels, income, expense, tooltipTitles } | null
export default function ReportShell({ fetchState, totals, chart, emptyTitle, children }) {
  const { data, error, loading, reload } = fetchState

  if (!data && error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!data) {
    return <PageSkeleton variant="report" />
  }

  return (
    <div className={`opacity-transition ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center gap-2" role="alert">
          <span>{getErrorMessage(error)}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={reload}>
            Coba lagi
          </button>
        </div>
      )}
      <SummaryCards summary={totals} />
      {totals.count === 0 ? (
        <EmptyState icon="bi-bar-chart" title={emptyTitle ?? 'Belum ada transaksi pada periode ini'} />
      ) : (
        <>
          {chart && (
            <div className="card mb-3">
              <div className="card-body">
                <IncomeExpenseChart {...chart} />
              </div>
            </div>
          )}
          {children}
        </>
      )}
    </div>
  )
}
