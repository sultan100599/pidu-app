import { Link } from 'react-router-dom'
import { useT } from '../../i18n/LocaleProvider'
import * as reportsApi from '../../api/reports'
import CategoryDoughnut from '../../components/charts/CategoryDoughnut'
import IncomeExpenseChart from '../../components/charts/IncomeExpenseChart'
import BudgetProgress from '../../components/BudgetProgress'
import CategoryBadge from '../../components/CategoryBadge'
import PageHeader from '../../components/PageHeader'
import PeriodPicker, { usePeriodQuery } from '../../components/PeriodPicker'
import SummaryCards from '../../components/SummaryCards'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { useFetch } from '../../hooks/useFetch'
import { getErrorMessage } from '../../utils/errors'
import { formatDate, formatRupiah, formatYearMonth, MONTH_NAMES } from '../../utils/format'
import { useChartTheme } from '../../components/charts/useChartTheme'
import { accessibleColor } from '../../utils/accessibleColor'
import CategoryIcon from '../../components/CategoryIcon'
import PageSkeleton from '../../components/ui/PageSkeleton'
import TodaySummary from './TodaySummary'
import { previousPeriod } from '../../utils/dashboard'
import { useTransactions } from '../../context/TransactionContext'

// Link ke Transaksi dengan periode yang sama (+ filter tambahan).
function transactionsLink(period, extra = {}) {
  const params = new URLSearchParams({
    period: 'custom',
    start_date: period.start_date,
    end_date: period.end_date,
    ...extra,
  })
  return `/transactions?${params}`
}

function Section({ title, action, children, className = '' }) {
  const t = useT()
  return (
    <div className={`card h-100 ${className}`}>
      <div className="card-header bg-transparent d-flex justify-content-between align-items-center gap-2">
        <h2 className="h6 mb-0">{t(title)}</h2>
        {action}
      </div>
      <div className="card-body">{children}</div>
    </div>
  )
}

function StatTile({ label, value, hint }) {
  const t = useT()
  return (
    <div className="col">
      <div className="card h-100">
        <div className="card-body py-3 px-2 px-sm-3">
          <div className="small text-body-secondary">{t(label)}</div>
          <div className="fw-semibold summary-value">{t(value)}</div>
          {hint && <div className="small text-body-secondary">{t(hint)}</div>}
        </div>
      </div>
    </div>
  )
}

function CategoryBreakdown({ items, period }) {
  const t = useT()
  const theme = useChartTheme()
  if (items.length === 0) {
    return <p className="text-body-secondary text-center my-4">{t('Belum ada pengeluaran pada periode ini.')}</p>
  }
  return (
    <div className="row g-3 align-items-center">
      <div className="col-md-5">
        <CategoryDoughnut items={items} />
      </div>
      <div className="col-md-7">
        <ul className="list-unstyled mb-0 category-breakdown">
          {items.map((item) => (
            <li key={item.category_id} className="mb-2">
              <Link
                to={transactionsLink(period, { type: 'expense', category_id: item.category_id })}
                className="text-reset text-decoration-none d-block"
              >
                <div className="d-flex justify-content-between align-items-center gap-2 small">
                  <span className="d-inline-flex align-items-center gap-2 min-w-0">
                    <CategoryIcon icon={item.icon} color={item.color} />
                    <span className="text-truncate">{item.name}</span>
                  </span>
                  <span className="text-nowrap">
                    {formatRupiah(item.total)}{' '}
                    <span className="text-body-secondary">({item.percentage.toLocaleString('id-ID')}%)</span>
                  </span>
                </div>
                <div className="progress mt-1" style={{ height: 6 }} role="presentation">
                  <div
                    className="progress-bar"
                    style={{ width: `${item.percentage}%`, backgroundColor: accessibleColor(item.color, theme.softSurface, theme.ink) }}
                  ></div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function LargestTransactions({ transactions }) {
  const t = useT()
  if (transactions.length === 0) {
    return <p className="text-body-secondary text-center my-4">{t('Belum ada pengeluaran.')}</p>
  }
  return (
    <ul className="list-group list-group-flush largest-transactions">
      {transactions.map((trx) => (
        <li key={trx.id} className="list-group-item px-0 d-flex justify-content-between align-items-start gap-2">
          <div className="min-w-0">
            <div className="fw-semibold text-truncate">{trx.description || trx.category?.name}</div>
            <div className="small text-body-secondary d-flex flex-wrap align-items-center gap-2 mt-1">
              <span>{formatDate(trx.transaction_date)}</span>
              <CategoryBadge category={trx.category} />
            </div>
          </div>
          <span className="fw-semibold text-danger text-nowrap">{formatRupiah(trx.amount)}</span>
        </li>
      ))}
    </ul>
  )
}

function BudgetList({ budgets }) {
  const t = useT()
  if (budgets.length === 0) {
    return (
      <div className="text-center my-3">
        <p className="text-body-secondary mb-2">{t('Belum ada budget untuk bulan tersebut.')}</p>
        <Link to="/budgets" className="btn btn-sm btn-outline-primary">
          {t('Atur budget')}
        </Link>
      </div>
    )
  }
  return (
    <ul className="list-unstyled mb-0">
      {budgets.map((b) => (
        <li key={b.id} className="mb-3">
          <BudgetProgress budget={b} />
        </li>
      ))}
    </ul>
  )
}

export default function DashboardPage() {
  const t = useT()
  const { openCreate } = useTransactions()
  const periodQuery = usePeriodQuery('this_month')
  const { range } = periodQuery
  const key = range ? JSON.stringify(range) : null
  const { data, error, loading, reload } = useFetch(key, (signal) => reportsApi.dashboard(range, { signal }))
  const previousInfo = previousPeriod(range)
  const previous = previousInfo && { start_date: previousInfo.start_date, end_date: previousInfo.end_date }
  const comparisonFetch = useFetch(previous ? `comparison:${JSON.stringify(previous)}` : null,
    (signal) => reportsApi.dashboard(previous, { signal }))
  const comparison = {
    summary: comparisonFetch.data?.summary,
    loading: loading || comparisonFetch.loading,
    error: error || comparisonFetch.error || !previous,
    label: previousInfo?.label ?? '',
  }

  let content
  if (!data && error) {
    content = <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  } else if (!data) {
    content = <PageSkeleton variant="dashboard" />
  } else {
    const { period, summary, chart, category_breakdown: breakdown, largest_transactions: largest, budgets } = data
    const daily = chart.granularity === 'day'
    const chartLabels = chart.labels.map((l) => (daily ? String(Number(l.slice(8))) : formatYearMonth(l)))
    const tooltipTitles = chart.labels.map((l) => (daily ? formatDate(l, 'long') : formatYearMonth(l)))
    // Backend mengambil budget untuk bulan dari end_date periode.
    const [endYear, endMonth] = period.end_date.split('-').map(Number)

    content = (
      <>
        <SummaryCards prominent summary={{ ...summary, count: summary.transaction_count }} comparison={comparison} />
        {comparisonFetch.error && <div className="small text-body-secondary mb-3">{t('Perbandingan gagal dimuat.')} <button type="button" className="btn btn-sm btn-outline-secondary" onClick={comparisonFetch.reload}>{t('Coba lagi')}</button></div>}

        <div className="dashboard-stats row row-cols-2 g-2 g-md-3 mb-4">
          <StatTile
            label="Rata-rata pengeluaran / hari"
            value={formatRupiah(summary.avg_daily_expense)}
            hint={t('{count} hari', { count: period.days })}
          />
          <StatTile
            label="Rasio pengeluaran"
            value={summary.expense_ratio == null ? 'Belum tersedia' : `${summary.expense_ratio.toLocaleString('id-ID')}%`}
            hint={summary.expense_ratio == null ? 'Belum ada pemasukan' : 'dari pemasukan'}
          />
        </div>

        {summary.transaction_count === 0 ? (
          <EmptyState
            icon="bi-bar-chart"
            title="Belum ada transaksi pada periode ini"
            action={
              <button type="button" onClick={openCreate} className="btn btn-primary">
                {t('Catat transaksi')}
              </button>
            }
          />
        ) : (
          <div className="row g-3">
            <div className="col-12">
              <Section title={t(daily ? 'Pemasukan vs Pengeluaran (per hari)' : 'Pemasukan vs Pengeluaran (per bulan)')}>
                <IncomeExpenseChart
                  labels={chartLabels}
                  income={chart.income}
                  expense={chart.expense}
                  tooltipTitles={tooltipTitles}
                />
              </Section>
            </div>
            <div className="col-lg-7">
              <Section
                title="Pengeluaran per kategori"
                action={
                  <Link to={transactionsLink(period, { type: 'expense' })} className="small">
                    {t('Lihat transaksi')}
                  </Link>
                }
              >
                <CategoryBreakdown items={breakdown} period={period} />
              </Section>
            </div>
            <div className="col-lg-5">
              <Section
                title="Pengeluaran terbesar"
                action={
                  <Link to={`${transactionsLink(period, { type: 'expense' })}&sort=amount`} className="small">
                    {t('Semua')}
                  </Link>
                }
              >
                <LargestTransactions transactions={largest} />
              </Section>
            </div>
          </div>
        )}

        <div className="row g-3 mt-0">
          <div className="col-12">
            <Section
              title={t('Budget {period}', { period: `${MONTH_NAMES[endMonth - 1]} ${endYear}` })}
              action={
                <Link to="/budgets" className="small">
                  {t('Kelola')}
                </Link>
              }
            >
              <BudgetList budgets={budgets} />
            </Section>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={data ? `${formatDate(data.period.start_date)} – ${formatDate(data.period.end_date)}` : ' '}
        actions={<PeriodPicker query={periodQuery} idPrefix="dash-period" />}
      />
      <TodaySummary />
      <div className={`opacity-transition ${loading && data ? 'opacity-50' : ''}`} aria-busy={loading}>
        {error && data && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center gap-2" role="alert">
            <span>{getErrorMessage(error)}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={reload}>
              {t('Coba lagi')}
            </button>
          </div>
        )}
        {content}
      </div>
    </>
  )
}
