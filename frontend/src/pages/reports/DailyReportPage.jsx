import { useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import * as reportsApi from '../../api/reports'
import PageHeader from '../../components/PageHeader'
import PeriodPicker, { usePeriodQuery } from '../../components/PeriodPicker'
import { useFetch } from '../../hooks/useFetch'
import { formatDate, formatDayMonth } from '../../utils/format'
import DayDetailModal from './DayDetailModal'
import ReportShell from './ReportShell'
import ReportTable from './ReportTable'

export default function DailyReportPage() {
  const t = useT()
  const periodQuery = usePeriodQuery('this_month')
  const { range } = periodQuery
  const fetchState = useFetch(range ? JSON.stringify(range) : null, (signal) => reportsApi.daily(range, { signal }))
  const { data } = fetchState
  const [hideEmpty, setHideEmpty] = useState(true)
  const [detailDate, setDetailDate] = useState(null)

  const rows = data?.rows ?? []
  const visibleRows = hideEmpty ? rows.filter((r) => r.count > 0) : rows

  return (
    <>
      <PageHeader
        title="Rekap Harian"
        subtitle={data ? `${formatDate(data.period.start_date)} – ${formatDate(data.period.end_date)}` : ' '}
        actions={<PeriodPicker query={periodQuery} idPrefix="daily-period" />}
      />
      <ReportShell
        fetchState={fetchState}
        totals={data?.totals}
        chart={
          data && {
            labels: rows.map((r) => formatDayMonth(r.date)),
            income: rows.map((r) => r.income),
            expense: rows.map((r) => r.expense),
            tooltipTitles: rows.map((r) => formatDate(r.date, 'long')),
          }
        }
      >
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-2">
          <span className="small text-body-secondary">{t('Klik baris untuk melihat detail transaksi.')}</span>
          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="hide-empty-days"
              checked={hideEmpty}
              onChange={(e) => setHideEmpty(e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="hide-empty-days">
              {t('Sembunyikan hari kosong')}
            </label>
          </div>
        </div>
        <ReportTable
          labelHeader="Tanggal"
          rows={visibleRows}
          rowKey={(r) => r.date}
          renderLabel={(r) => formatDate(r.date, 'long')}
          totals={data?.totals}
          onRowClick={(r) => setDetailDate(r.date)}
          rowActionLabel={(r) => t('Detail {date}', { date: formatDate(r.date, 'long') })}
        />
      </ReportShell>
      <DayDetailModal date={detailDate} onClose={() => setDetailDate(null)} />
    </>
  )
}
