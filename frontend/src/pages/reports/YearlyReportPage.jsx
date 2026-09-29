import { useNavigate } from 'react-router-dom'
import { useT } from '../../i18n/LocaleProvider'
import * as reportsApi from '../../api/reports'
import PageHeader from '../../components/PageHeader'
import { useFetch } from '../../hooks/useFetch'
import ReportShell from './ReportShell'
import ReportTable from './ReportTable'

export default function YearlyReportPage() {
  const t = useT()
  const navigate = useNavigate()
  const fetchState = useFetch('yearly', (signal) => reportsApi.yearly({}, { signal }))
  const { data } = fetchState
  const rows = data?.rows ?? []

  return (
    <>
      <PageHeader
        title="Rekap Tahunan"
        subtitle={rows.length > 0 ? `${rows[0].year} – ${rows[rows.length - 1].year}` : ' '}
      />
      <ReportShell
        fetchState={fetchState}
        totals={data?.totals}
        chart={
          data && {
            labels: rows.map((r) => String(r.year)),
            income: rows.map((r) => r.income),
            expense: rows.map((r) => r.expense),
          }
        }
      >
        <p className="small text-body-secondary mb-2">{t('Klik baris untuk melihat rekap bulanan tahun tersebut.')}</p>
        <ReportTable
          labelHeader="Tahun"
          rows={rows}
          rowKey={(r) => r.year}
          renderLabel={(r) => r.year}
          totals={data?.totals}
          onRowClick={(r) => navigate(`/reports/monthly?year=${r.year}`)}
          rowActionLabel={(r) => t('Rekap bulanan {year}', { year: r.year })}
        />
      </ReportShell>
    </>
  )
}
