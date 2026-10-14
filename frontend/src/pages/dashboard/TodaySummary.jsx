import { useEffect, useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import * as reportsApi from '../../api/reports'
import { useAuth } from '../../context/AuthContext'
import { useFetch } from '../../hooks/useFetch'
import { formatRupiah, toYmd } from '../../utils/format'
import { greeting } from '../../utils/dashboard'
import { SkeletonBar } from '../../components/ui/PageSkeleton'
import { useTransactions } from '../../context/TransactionContext'

// Pengingat muncul mulai sore, saat hari ini belum ada catatan sama sekali.
const reminderKey = (userId) => `pidu:reminder-dismissed:${userId}`

function readDismissed(userId) {
  try {
    return localStorage.getItem(reminderKey(userId))
  } catch {
    return null
  }
}

function Reminder({ today, userId }) {
  const t = useT()
  const { openCreate } = useTransactions()
  const [dismissed, setDismissed] = useState(() => readDismissed(userId))
  if (dismissed === today) return null
  function dismiss() {
    setDismissed(today)
    try {
      localStorage.setItem(reminderKey(userId), today)
    } catch { /* tanpa storage, pengingat hanya tertutup sampai halaman dimuat ulang */ }
  }
  return (
    <div className="today-reminder d-flex flex-wrap align-items-center gap-2 mt-2" role="status">
      <i className="bi bi-bell" aria-hidden="true"></i>
      <span className="me-auto">{t('Belum ada catatan hari ini. Ada belanja atau pemasukan yang belum dicatat?')}</span>
      <button type="button" className="btn btn-sm btn-primary" onClick={openCreate}>{t('Catat')}</button>
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={dismiss}>{t('Nanti saja')}</button>
    </div>
  )
}

export default function TodaySummary() {
  const t = useT()
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
  return <section className="today-summary mb-3" aria-label={t('Ringkasan hari ini')}>
    <h2 className="h5 mb-1">{greeting(now.getHours())}{user?.name ? `, ${user.name}` : ''}</h2>
    <div className="text-body-secondary" aria-busy={day.loading || budget.loading}>
      {day.loading ? <><SkeletonBar className="today-skeleton" /><span className="visually-hidden">{t('Memuat pengeluaran hari ini…')}</span></> : day.error ? <span>{t('Pengeluaran hari ini belum tersedia.')} <button className="btn btn-sm btn-outline-secondary" onClick={day.reload}>{t('Coba lagi')}</button></span> :
        <span>{Number(day.data?.totals.expense) === 0 ? t('Belum ada pengeluaran hari ini') : t('Pengeluaran hari ini {amount}', { amount: formatRupiah(day.data?.totals.expense) })}</span>}
      {budget.loading ? <span className="visually-hidden">{t('Memuat anggaran bulan ini…')}</span> : budget.error ? <span> · {t('Anggaran bulan ini belum tersedia.')} <button className="btn btn-sm btn-outline-secondary" onClick={budget.reload}>{t('Coba lagi')}</button></span> : budgets.length > 0 && <span> · {remaining < 0
        ? t('Anggaran bulan ini lebih {amount}', { amount: formatRupiah(-remaining) })
        : t('Sisa anggaran bulan ini {amount}', { amount: formatRupiah(remaining) })}</span>}
    </div>
    {day.data && day.data.totals.count === 0 && user?.reminder_hour != null && now.getHours() >= user.reminder_hour && <Reminder today={today} userId={user.id} />}
  </section>
}
