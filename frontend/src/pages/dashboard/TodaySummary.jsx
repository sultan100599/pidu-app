import { useEffect, useState } from 'react'
import * as reportsApi from '../../api/reports'
import { useAuth } from '../../context/AuthContext'
import { useFetch } from '../../hooks/useFetch'
import { formatRupiah, toYmd } from '../../utils/format'
import { greeting } from '../../utils/dashboard'
import { SkeletonBar } from '../../components/ui/PageSkeleton'

export default function TodaySummary() {
  const { user } = useAuth()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])
  const today = toYmd(now)
  const month = {
    start_date: toYmd(new Date(now.getFullYear(), now.getMonth(), 1)),
    end_date: toYmd(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
  const day = useFetch(`today:${today}`, (signal) => reportsApi.day(today, { signal }))
  const budget = useFetch(`today-budget:${month.start_date}`, (signal) => reportsApi.dashboard(month, { signal }))
  const budgets = budget.data?.budgets ?? []
  const remaining = budgets.reduce((sum, b) => sum + Number(b.amount) - Number(b.used), 0)
  return <section className="today-summary mb-3" aria-label="Ringkasan hari ini">
    <h2 className="h5 mb-1">{greeting(now.getHours())}{user?.name ? `, ${user.name}` : ''}</h2>
    <div className="text-body-secondary" aria-busy={day.loading || budget.loading}>
      {day.loading ? <><SkeletonBar className="today-skeleton" /><span className="visually-hidden">Memuat pengeluaran hari ini…</span></> : day.error ? <span>Pengeluaran hari ini belum tersedia. <button className="btn btn-sm btn-outline-secondary" onClick={day.reload}>Coba lagi</button></span> :
        <span>{Number(day.data?.totals.expense) === 0 ? 'Belum ada pengeluaran hari ini' : `Pengeluaran hari ini ${formatRupiah(day.data?.totals.expense)}`}</span>}
      {budget.loading ? <span className="visually-hidden">Memuat budget bulan ini…</span> : budget.error ? <span> · Budget bulan ini belum tersedia. <button className="btn btn-sm btn-outline-secondary" onClick={budget.reload}>Coba lagi</button></span> : budgets.length > 0 && <span> · Sisa budget bulan ini {formatRupiah(remaining)}</span>}
    </div>
  </section>
}
