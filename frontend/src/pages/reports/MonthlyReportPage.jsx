import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as reportsApi from '../../api/reports'
import PageHeader from '../../components/PageHeader'
import { useFetch } from '../../hooks/useFetch'
import { toYmd } from '../../utils/format'
import ReportShell from './ReportShell'
import ReportTable from './ReportTable'
import Stepper from './Stepper'

export default function MonthlyReportPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // Tanggal "sekarang" dibekukan saat mount supaya render tetap murni.
  const [currentYear] = useState(() => new Date().getFullYear())
  const year = Number(searchParams.get('year')) || currentYear
  const setYear = (y) => setSearchParams(y === currentYear ? {} : { year: String(y) })

  const fetchState = useFetch(String(year), (signal) => reportsApi.monthly({ year }, { signal }))
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
        subtitle={`Januari – Desember ${year}`}
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
      <ReportShell
        fetchState={fetchState}
        totals={data?.totals}
        emptyTitle={`Belum ada transaksi di tahun ${year}`}
        chart={
          data && {
            labels: rows.map((r) => r.label.slice(0, 3)),
            income: rows.map((r) => r.income),
            expense: rows.map((r) => r.expense),
            tooltipTitles: rows.map((r) => `${r.label} ${year}`),
          }
        }
      >
        <p className="small text-body-secondary mb-2">Klik baris untuk melihat rekap harian bulan tersebut.</p>
        <ReportTable
          labelHeader="Bulan"
          rows={rows}
          rowKey={(r) => r.month}
          renderLabel={(r) => r.label}
          totals={data?.totals}
          onRowClick={openMonth}
          rowActionLabel={(r) => `Rekap harian ${r.label} ${year}`}
        />
      </ReportShell>
    </>
  )
}
