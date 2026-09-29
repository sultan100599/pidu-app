import { useNavigate } from 'react-router-dom'
import { useT } from '../../i18n/LocaleProvider'
import * as reportsApi from '../../api/reports'
import PageHeader from '../../components/PageHeader'
import PeriodPicker, { usePeriodQuery } from '../../components/PeriodPicker'
import { useFetch } from '../../hooks/useFetch'
import { formatDate, formatDayMonth } from '../../utils/format'
import ReportShell from './ReportShell'
import ReportTable from './ReportTable'

function weekRange(row) {
  return row.start_date === row.end_date
    ? formatDayMonth(row.start_date)
    : `${formatDayMonth(row.start_date)} – ${formatDayMonth(row.end_date)}`
}

export default function WeeklyReportPage() {
  const t = useT()
  const navigate = useNavigate()
  const periodQuery = usePeriodQuery('this_month')
  const { range } = periodQuery
  const fetchState = useFetch(range ? JSON.stringify(range) : null, (signal) => reportsApi.weekly(range, { signal }))
  const { data } = fetchState
  const rows = data?.rows ?? []

  return (
    <>
      <PageHeader
        title="Rekap Mingguan"
        subtitle={data ? `${formatDate(data.period.start_date)} – ${formatDate(data.period.end_date)} · ${t('minggu Senin–Minggu')}` : ' '}
        actions={<PeriodPicker query={periodQuery} idPrefix="weekly-period" />}
      />
      <ReportShell
        fetchState={fetchState}
        totals={data?.totals}
        chart={
          data && {
            labels: rows.map((r) => t(r.label)),
            income: rows.map((r) => r.income),
            expense: rows.map((r) => r.expense),
            tooltipTitles: rows.map((r) => `${t(r.label)} (${weekRange(r)})`),
          }
        }
      >
        <p className="small text-body-secondary mb-2">{t('Klik baris untuk melihat rekap harian minggu tersebut.')}</p>
        <ReportTable
          labelHeader="Minggu"
          rows={rows}
          rowKey={(r) => r.start_date}
          renderLabel={(r) => (
            <>
              <div>{t(r.label)}</div>
              <div className="small text-body-secondary">{weekRange(r)}</div>
            </>
          )}
          totals={data?.totals}
          onRowClick={(r) =>
            navigate(`/reports/daily?period=custom&start_date=${r.start_date}&end_date=${r.end_date}`)
          }
          rowActionLabel={(r) => t('Rekap harian {period}', { period: t(r.label) })}
        />
      </ReportShell>
    </>
  )
}
