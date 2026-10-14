import { useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import { MONTH_NAMES } from '../../utils/format'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as reportsApi from '../../api/reports'
import PageHeader from '../../components/PageHeader'
import { useFetch } from '../../hooks/useFetch'
import { usePurpose } from '../../hooks/usePurpose'
import { toYmd } from '../../utils/format'
import ReportShell from './ReportShell'
import ReportTabs from './ReportTabs'
import ReportTable from './ReportTable'
import Stepper from '../../components/ui/Stepper'

export default function MonthlyReportPage() {
  const t = useT()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // Tanggal "sekarang" dibekukan saat mount supaya render tetap murni.
  const [currentYear] = useState(() => new Date().getFullYear())
  const year = Number(searchParams.get('year')) || currentYear
  const setYear = (y) => setSearchParams(y === currentYear ? {} : { year: String(y) })

  const { withPurpose } = usePurpose()
  const params = withPurpose({ year })
  const fetchState = useFetch(JSON.stringify(params), (signal) => reportsApi.monthly(params, { signal }))
  const { data } = fetchState
  const rows = data?.rows ?? []

  function openMonth(row) {
    const start = toYmd(new Date(year, row.month - 1, 1))
    const end = toYmd(new Date(year, row.month, 0))
    navigate(`/reports/daily?period=custom&start_date=${start}&end_date=${end}`)
  }

  return (
    <>
      <PageHeader
        title="Rekap Bulanan"
        subtitle={`${MONTH_NAMES[0]} – ${MONTH_NAMES[11]} ${year}`}
        actions={
          <Stepper
            label={year}
            onPrev={() => setYear(year - 1)}
            onNext={() => setYear(year + 1)}
            prevLabel="Tahun sebelumnya"
            nextLabel="Tahun berikutnya"
            disableNext={year >= currentYear}
          />
        }
      />
      <ReportTabs />
      <ReportShell
        fetchState={fetchState}
        totals={data?.totals}
        emptyTitle={t('Belum ada transaksi di tahun {year}', { year })}
        chart={
          data && {
            labels: rows.map((r) => MONTH_NAMES[r.month - 1].slice(0, 3)),
            income: rows.map((r) => r.income),
            expense: rows.map((r) => r.expense),
            tooltipTitles: rows.map((r) => `${MONTH_NAMES[r.month - 1]} ${year}`),
          }
        }
      >
        <p className="glass-strip small text-body-secondary mb-2">{t('Klik baris untuk melihat rekap harian bulan tersebut.')}</p>
        <ReportTable
          labelHeader="Bulan"
          rows={rows}
          rowKey={(r) => r.month}
          renderLabel={(r) => MONTH_NAMES[r.month - 1]}
          totals={data?.totals}
          onRowClick={openMonth}
          rowActionLabel={(r) => t('Rekap harian {period}', { period: `${MONTH_NAMES[r.month - 1]} ${year}` })}
        />
      </ReportShell>
    </>
  )
}
