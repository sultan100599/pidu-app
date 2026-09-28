import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as reportsApi from '../../api/reports'
import PageHeader from '../../components/PageHeader'
import SummaryCards from '../../components/SummaryCards'
import ErrorState from '../../components/ui/ErrorState'
import { useFetch } from '../../hooks/useFetch'
import { getErrorMessage } from '../../utils/errors'
import { formatCompact, formatDate, formatRupiah, MONTH_NAMES, parseYmd, toYmd } from '../../utils/format'
import DayDetailModal from './DayDetailModal'
import Stepper from '../../components/ui/Stepper'

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

// Senin = 0 … Minggu = 6 (getDay(): Minggu = 0).
const mondayIndex = (date) => (date.getDay() + 6) % 7

function DayCell({ day, isToday, onOpen }) {
  const date = parseYmd(day.date)
  const hasData = day.count > 0
  const parts = [formatDate(day.date, 'long')]
  if (day.income > 0) parts.push(`pemasukan ${formatRupiah(day.income)}`)
  if (day.expense > 0) parts.push(`pengeluaran ${formatRupiah(day.expense)}`)
  if (hasData) parts.push(`${day.count} transaksi`)
  else parts.push('tidak ada transaksi')

  return (
    <button
      type="button"
      className={`calendar-cell ${hasData ? '' : 'is-empty'} ${isToday ? 'is-today' : ''}`}
      onClick={() => onOpen(day.date)}
      aria-current={isToday ? 'date' : undefined}
    >
      {/* Nama aksesibel = teks lengkap (tersembunyi); isi visual yang ringkas disembunyikan dari pembaca layar. */}
      <span className="visually-hidden">{parts.join(', ')}</span>
      <span className="calendar-day" aria-hidden="true">
        {date.getDate()}
      </span>
      {/* ≥ sm: nominal ringkas; < sm: sel terlalu sempit → titik warna saja (detail via tap) */}
      {day.income > 0 && (
        <span className="text-success text-truncate d-none d-sm-block" aria-hidden="true">
          +{formatCompact(day.income)}
        </span>
      )}
      {day.expense > 0 && (
        <span className="text-danger text-truncate d-none d-sm-block" aria-hidden="true">
          −{formatCompact(day.expense)}
        </span>
      )}
      {hasData && (
        <span className="text-body-secondary d-none d-sm-block" aria-hidden="true">
          {day.count} trx
        </span>
      )}
      {hasData && (
        <span className="d-flex gap-1 d-sm-none mt-auto" aria-hidden="true">
          {day.income > 0 && <span className="calendar-dot bg-success"></span>}
          {day.expense > 0 && <span className="calendar-dot bg-danger"></span>}
        </span>
      )}
    </button>
  )
}

export default function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Tanggal "sekarang" dibekukan saat mount supaya render tetap murni.
  const [today] = useState(() => new Date())
  const year = Number(searchParams.get('year')) || today.getFullYear()
  const month = Number(searchParams.get('month')) || today.getMonth() + 1
  const [detailDate, setDetailDate] = useState(null)

  function goTo(y, m) {
    const d = new Date(y, m - 1, 1)
    const isCurrent = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
    setSearchParams(isCurrent ? {} : { year: String(d.getFullYear()), month: String(d.getMonth() + 1) })
  }

  const { data, error, loading, reload } = useFetch(`${year}-${month}`, (signal) =>
    reportsApi.calendar({ year, month }, { signal }),
  )
  const todayYmd = toYmd(today)

  let content
  if (!data && error) {
    content = <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  } else if (!data) {
    content = (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Memuat...</span>
        </div>
      </div>
    )
  } else {
    const leading = mondayIndex(parseYmd(data.days[0].date))
    content = (
      <div className={`opacity-transition ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
        <SummaryCards summary={data.totals} />
        <div className="card">
          <div className="card-body p-2 p-sm-3">
            <div className="calendar-grid" role="group" aria-label={`Kalender ${data.label}`}>
              {/* Nama hari hanya visual; tiap tombol tanggal sudah menyebut hari lengkap. */}
              {WEEKDAYS.map((w) => (
                <div key={w} className="calendar-weekday" aria-hidden="true">
                  {w}
                </div>
              ))}
              {Array.from({ length: leading }, (_, i) => (
                <div key={`filler-${i}`} className="calendar-filler" aria-hidden="true"></div>
              ))}
              {data.days.map((day) => (
                <DayCell key={day.date} day={day} isToday={day.date === todayYmd} onOpen={setDetailDate} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Kalender"
        subtitle="Klik tanggal untuk melihat transaksi hari itu."
        actions={
          <Stepper
            label={`${MONTH_NAMES[month - 1]} ${year}`}
            onPrev={() => goTo(year, month - 1)}
            onNext={() => goTo(year, month + 1)}
            onToday={() => goTo(today.getFullYear(), today.getMonth() + 1)}
            prevLabel="Bulan sebelumnya"
            nextLabel="Bulan berikutnya"
          />
        }
      />
      {content}
      <DayDetailModal date={detailDate} onClose={() => setDetailDate(null)} />
    </>
  )
}
