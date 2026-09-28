import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import * as budgetsApi from '../../api/budgets'
import BudgetProgress, { BUDGET_STATUS, budgetStatus } from '../../components/BudgetProgress'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Stepper from '../../components/ui/Stepper'
import { useCategories } from '../../hooks/useCategories'
import { useFetch } from '../../hooks/useFetch'
import { getErrorMessage } from '../../utils/errors'
import { formatRupiah, MONTH_NAMES, toYmd } from '../../utils/format'
import BudgetFormModal from './BudgetFormModal'

function monthLabel(month, year) {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

function previousMonth(month, year) {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year }
}

function transactionsLink(budget) {
  const params = new URLSearchParams({
    type: 'expense',
    category_id: budget.category.id,
    period: 'custom',
    start_date: toYmd(new Date(budget.year, budget.month - 1, 1)),
    end_date: toYmd(new Date(budget.year, budget.month, 0)),
  })
  return `/transactions?${params}`
}

function Overview({ totals, budgets }) {
  const percentage = totals.amount > 0 ? Math.round((totals.used / totals.amount) * 10000) / 100 : 0
  const overall = {
    category: { name: 'keseluruhan' },
    ...totals,
    percentage,
    status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok',
  }
  const counts = Object.fromEntries(Object.keys(BUDGET_STATUS).map((k) => [k, budgets.filter((b) => b.status === k).length]))

  return (
    <div className="card mb-3">
      <div className="card-body">
        <BudgetProgress
          budget={overall}
          height={12}
          title={<span className="fw-semibold">Total budget</span>}
          aside={
            <span className={`fw-semibold ${budgetStatus(overall.status).text}`}>
              {percentage.toLocaleString('id-ID')}%
            </span>
          }
        />
        <div className="d-flex flex-wrap gap-2 mt-3">
          {Object.entries(BUDGET_STATUS).map(([key, s]) => (
            <span key={key} className={`badge ${s.badge}`}>
              {counts[key]} {s.label.toLowerCase()}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function BudgetCard({ budget, onEdit, onDelete }) {
  const status = budgetStatus(budget.status)
  const { category } = budget

  return (
    <div className="col">
      <div className="card h-100">
        <div className="card-body">
          <BudgetProgress
            budget={budget}
            title={
              <span className="d-inline-flex align-items-center gap-2 min-w-0 fw-semibold fs-6">
                <i className={`bi ${category.icon || 'bi-tag'}`} style={{ color: category.color }} aria-hidden="true"></i>
                <span className="text-truncate">{category.name}</span>
              </span>
            }
            aside={<span className={`badge ${status.badge}`}>{status.label}</span>}
          />
          <div className="d-flex align-items-center gap-2 mt-3">
            <span className={`fw-semibold ${status.text}`}>{budget.percentage.toLocaleString('id-ID')}%</span>
            <Link to={transactionsLink(budget)} className="small ms-2">
              Lihat transaksi
            </Link>
            <div className="ms-auto d-flex gap-1">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                aria-label={`Edit budget ${category.name}`}
                onClick={() => onEdit(budget)}
              >
                <i className="bi bi-pencil" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                aria-label={`Hapus budget ${category.name}`}
                onClick={() => onDelete(budget)}
              >
                <i className="bi bi-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BudgetsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // "Sekarang" dibekukan saat mount supaya render tetap murni.
  const [today] = useState(() => new Date())
  const year = Number(searchParams.get('year')) || today.getFullYear()
  const month = Number(searchParams.get('month')) || today.getMonth() + 1
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1

  function goTo(y, m) {
    const d = new Date(y, m - 1, 1)
    const current = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
    setSearchParams(current ? {} : { year: String(d.getFullYear()), month: String(d.getMonth() + 1) })
  }

  const { data, error, loading, reload } = useFetch(`${year}-${month}`, (signal) =>
    budgetsApi.list({ month, year }, { signal }),
  )
  const { categories } = useCategories()
  const budgets = [...(data?.data ?? [])].sort((a, b) => b.percentage - a.percentage)

  const [form, setForm] = useState({ show: false, budget: null, key: 0 })
  const openCreate = () => setForm((f) => ({ show: true, budget: null, key: f.key + 1 }))
  const openEdit = (budget) => setForm((f) => ({ show: true, budget, key: f.key + 1 }))

  const [deleting, setDeleting] = useState({ budget: null, loading: false })
  const [copying, setCopying] = useState({ show: false, loading: false })
  const prev = previousMonth(month, year)

  async function confirmDelete() {
    setDeleting((d) => ({ ...d, loading: true }))
    try {
      const response = await budgetsApi.remove(deleting.budget.id)
      toast.success(response.data.message)
      setDeleting({ budget: null, loading: false })
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleting((d) => ({ ...d, loading: false }))
    }
  }

  // Salin budget bulan lalu → bulan ini; kategori yang sudah punya budget dilewati.
  async function confirmCopy() {
    setCopying({ show: true, loading: true })
    try {
      const source = (await budgetsApi.list(prev)).data.data
      const existing = new Set(budgets.map((b) => b.category.id))
      let copied = 0
      let skipped = 0
      for (const b of source) {
        if (existing.has(b.category.id)) {
          skipped += 1
          continue
        }
        try {
          await budgetsApi.create({ category_id: b.category.id, month, year, amount: b.amount })
          copied += 1
        } catch {
          skipped += 1
        }
      }
      if (source.length === 0) {
        toast.info(`Tidak ada budget di ${monthLabel(prev.month, prev.year)}.`)
      } else {
        toast.success(`${copied} budget disalin${skipped ? `, ${skipped} dilewati` : ''}.`)
      }
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCopying({ show: false, loading: false })
    }
  }

  const copyButton = (small) => (
    <button
      type="button"
      className={`btn btn-outline-primary ${small ? 'btn-sm' : ''}`}
      onClick={() => setCopying({ show: true, loading: false })}>
      <i className="bi bi-copy me-1" aria-hidden="true"></i>
      Salin bulan lalu
    </button>
  )

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
  } else if (budgets.length === 0) {
    content = (
      <EmptyState
        icon="bi-piggy-bank"
        title={`Belum ada budget untuk ${monthLabel(month, year)}`}
        description="Tetapkan batas pengeluaran per kategori supaya pengeluaran lebih terkendali."
        action={
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
              Tambah Budget
            </button>
            {copyButton(false)}
          </div>
        }
      />
    )
  } else {
    content = (
      <>
        <Overview totals={data.totals} budgets={budgets} />
        <div className="row row-cols-1 row-cols-md-2 g-3">
          {budgets.map((b) => (
            <BudgetCard key={b.id} budget={b} onEdit={openEdit} onDelete={(budget) => setDeleting({ budget, loading: false })} />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Budget"
        subtitle={`Batas pengeluaran per kategori · ${monthLabel(month, year)}`}
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
            Tambah Budget
          </button>
        }
      />

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <Stepper
          label={monthLabel(month, year)}
          onPrev={() => goTo(year, month - 1)}
          onNext={() => goTo(year, month + 1)}
          onToday={isCurrentMonth ? undefined : () => goTo(today.getFullYear(), today.getMonth() + 1)}
          prevLabel="Bulan sebelumnya"
          nextLabel="Bulan berikutnya"
        />
        {budgets.length > 0 && copyButton(true)}
      </div>

      <div className={`opacity-transition ${loading && data ? 'opacity-50' : ''}`} aria-busy={loading}>
        {error && data && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center gap-2" role="alert">
            <span>{getErrorMessage(error)}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={reload}>
              Coba lagi
            </button>
          </div>
        )}
        {content}
      </div>

      {form.show && (
        <BudgetFormModal
          key={form.key}
          show={form.show}
          budget={form.budget}
          defaultMonth={month}
          defaultYear={year}
          categories={categories}
          existing={budgets}
          onClose={() => setForm((f) => ({ ...f, show: false }))}
          onSaved={(saved) => {
            // Budget dibuat/dipindah ke bulan lain → ikut pindah tampilan ke bulan itu.
            if (saved.month !== month || saved.year !== year) goTo(saved.year, saved.month)
            else reload()
          }}
        />
      )}

      <ConfirmDialog
        show={Boolean(deleting.budget)}
        title="Hapus budget?"
        loading={deleting.loading}
        onClose={() => setDeleting({ budget: null, loading: false })}
        onConfirm={confirmDelete}
      >
        {deleting.budget && (
          <p className="mb-0">
            Budget <strong>{deleting.budget.category.name}</strong> untuk {monthLabel(month, year)} (
            {formatRupiah(deleting.budget.amount)}) akan dihapus. Transaksi tidak ikut terhapus.
          </p>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        show={copying.show}
        title="Salin budget bulan lalu?"
        confirmLabel="Salin"
        confirmVariant="primary"
        loading={copying.loading}
        onClose={() => setCopying({ show: false, loading: false })}
        onConfirm={confirmCopy}
      >
        <p className="mb-0">
          Semua budget {monthLabel(prev.month, prev.year)} akan disalin ke {monthLabel(month, year)}. Kategori yang sudah
          punya budget di {monthLabel(month, year)} dilewati.
        </p>
      </ConfirmDialog>
    </>
  )
}
