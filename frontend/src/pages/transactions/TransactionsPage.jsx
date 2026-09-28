import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import * as transactionsApi from '../../api/transactions'
import PageHeader from '../../components/PageHeader'
import SummaryCards from '../../components/SummaryCards'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ExportMenu from '../../components/ExportMenu'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { useCategories } from '../../hooks/useCategories'
import { getErrorMessage } from '../../utils/errors'
import { formatDate, formatRupiah } from '../../utils/format'
import { getPeriodRange, isCustomRangeInvalid } from '../../utils/period'
import TransactionFilters from './TransactionFilters'
import TransactionFormModal from './TransactionFormModal'
import TransactionList from './TransactionList'
import TransactionTable from './TransactionTable'

const PER_PAGE_OPTIONS = [15, 25, 50, 100]
const SEARCH_DELAY = 400
// Kunci filter di URL (selain page/per_page/sort/dir). Dipakai juga oleh export (Phase 8).
const FILTER_KEYS = ['search', 'type', 'category_id', 'payment_method', 'period', 'start_date', 'end_date']

// Baca state halaman dari query string. Semua nilai default = string kosong.
function readQuery(searchParams) {
  const get = (key) => searchParams.get(key) ?? ''
  const perPage = Number(get('per_page'))
  return {
    search: get('search'),
    type: get('type'),
    category_id: get('category_id'),
    payment_method: get('payment_method'),
    period: get('period') || 'all',
    start_date: get('start_date'),
    end_date: get('end_date'),
    sort: get('sort') === 'amount' ? 'amount' : 'transaction_date',
    dir: get('dir') === 'asc' ? 'asc' : 'desc',
    page: Math.max(1, Number(get('page')) || 1),
    per_page: PER_PAGE_OPTIONS.includes(perPage) ? perPage : 15,
  }
}

// Parameter API: hanya yang terisi; preset periode diubah jadi start_date/end_date.
function toApiParams(query) {
  const params = {
    page: query.page,
    per_page: query.per_page,
    sort: query.sort,
    dir: query.dir,
  }
  for (const key of ['search', 'type', 'category_id', 'payment_method']) {
    if (query[key]) params[key] = query[key]
  }
  const range = getPeriodRange(query.period, query.start_date, query.end_date)
  if (range) Object.assign(params, range)
  return params
}

function countActiveFilters(query) {
  return (
    ['search', 'type', 'category_id', 'payment_method'].filter((key) => query[key]).length +
    (query.period !== 'all' ? 1 : 0)
  )
}

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = readQuery(searchParams)
  const { categories, refetch: refetchCategories } = useCategories()

  // --- sinkron URL -------------------------------------------------------
  // `changes`: {key: value}; nilai kosong dihapus dari URL. Ganti filter → page 1.
  // `replace`: dipakai untuk ketikan pencarian supaya history tidak penuh.
  function updateQuery(changes, { resetPage = true, replace = false } = {}) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          // page=1 & nilai kosong = default → tidak ditulis ke URL.
          if (value === '' || value == null || (key === 'page' && Number(value) === 1)) next.delete(key)
          else next.set(key, String(value))
        }
        if (resetPage) next.delete('page')
        return next
      },
      { replace },
    )
  }

  // Input pencarian: state lokal (responsif) → URL setelah jeda.
  const [searchText, setSearchText] = useState(query.search)
  const [syncedSearch, setSyncedSearch] = useState(query.search)
  if (query.search !== syncedSearch) {
    // URL berubah dari luar (back/forward/reset) → ikuti.
    setSyncedSearch(query.search)
    setSearchText(query.search)
  }
  const searchTimer = useRef(null)
  useEffect(() => () => clearTimeout(searchTimer.current), [])

  function handleSearchChange(value) {
    setSearchText(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => updateQuery({ search: value.trim() }, { replace: true }), SEARCH_DELAY)
  }

  function handleTypeChange(type) {
    const current = categories.find((c) => String(c.id) === query.category_id)
    const keepCategory = !type || !current || current.type === type
    updateQuery({ type, category_id: keepCategory ? query.category_id : '' })
  }

  function handlePeriodChange(period) {
    if (period === 'custom') {
      // Mulai dari rentang preset sebelumnya supaya input tanggal tidak kosong.
      const range = getPeriodRange(query.period, query.start_date, query.end_date) ??
        getPeriodRange('this_month')
      updateQuery({ period, ...range })
    } else {
      updateQuery({ period: period === 'all' ? '' : period, start_date: '', end_date: '' })
    }
  }

  function handleReset() {
    clearTimeout(searchTimer.current)
    updateQuery(Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])))
  }

  function handleSort(column) {
    const dir = query.sort === column && query.dir === 'desc' ? 'asc' : 'desc'
    updateQuery({ sort: column === 'transaction_date' ? '' : column, dir: dir === 'desc' ? '' : dir }, { resetPage: false })
  }

  // --- fetch ---------------------------------------------------------------
  const customInvalid = isCustomRangeInvalid(query.period, query.start_date, query.end_date)
  const apiParams = toApiParams(query)
  const apiParamsKey = JSON.stringify(apiParams)
  const { page: _page, per_page: _perPage, ...exportParams } = apiParams
  const [reloadToken, setReloadToken] = useState(0)
  const requestKey = `${apiParamsKey}#${reloadToken}`
  // Hasil disimpan bersama key request-nya; loading = key belum cocok.
  // Data lama tetap ditampilkan selama refetch.
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    if (customInvalid) return undefined
    const controller = new AbortController()
    transactionsApi
      .list(JSON.parse(apiParamsKey), { signal: controller.signal })
      .then((response) => setResult({ key: requestKey, data: response.data, error: null }))
      .catch((err) => {
        if (axios.isCancel(err)) return
        setResult((prev) => ({ key: requestKey, data: prev.data, error: err }))
      })
    return () => controller.abort()
  }, [requestKey, apiParamsKey, customInvalid])

  const reload = () => setReloadToken((t) => t + 1)
  const loading = !customInvalid && result.key !== requestKey
  const data = result.data
  const error = result.key === requestKey ? result.error : null
  const transactions = data?.data ?? []
  const activeCount = countActiveFilters(query)

  // --- form & hapus -------------------------------------------------------
  const [form, setForm] = useState({ show: false, transaction: null, key: 0 })
  const openCreate = () => setForm((f) => ({ show: true, transaction: null, key: f.key + 1 }))
  const openEdit = (transaction) => setForm((f) => ({ show: true, transaction, key: f.key + 1 }))
  const closeForm = () => setForm((f) => ({ ...f, show: false }))

  const [deleting, setDeleting] = useState({ transaction: null, loading: false })

  async function confirmDelete() {
    const target = deleting.transaction
    setDeleting((d) => ({ ...d, loading: true }))
    try {
      const response = await transactionsApi.remove(target.id)
      toast.success(response.data.message)
      setDeleting({ transaction: null, loading: false })
      if (transactions.length === 1 && query.page > 1) {
        updateQuery({ page: query.page - 1 }, { resetPage: false })
      } else {
        reload()
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleting((d) => ({ ...d, loading: false }))
    }
  }

  // --- render -------------------------------------------------------------
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
  } else if (transactions.length === 0) {
    content =
      activeCount > 0 ? (
        <EmptyState
          icon="bi-search"
          title="Tidak ada transaksi yang cocok dengan filter"
          action={
            <button type="button" className="btn btn-outline-secondary" onClick={handleReset}>
              Reset filter
            </button>
          }
        />
      ) : (
        <EmptyState
          title="Belum ada transaksi"
          description="Catat pemasukan atau pengeluaran pertamamu."
          action={
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
              Tambah Transaksi
            </button>
          }
        />
      )
  } else {
    content = (
      <>
        <div className="d-none d-md-block">
          <TransactionTable
            transactions={transactions}
            sort={query.sort}
            dir={query.dir}
            onSort={handleSort}
            onEdit={openEdit}
            onDelete={(trx) => setDeleting({ transaction: trx, loading: false })}
          />
        </div>
        <div className="d-md-none">
          <div className="d-flex justify-content-end mb-2">
            <select
              className="form-select form-select-sm w-auto"
              aria-label="Urutkan"
              value={`${query.sort}:${query.dir}`}
              onChange={(e) => {
                const [sort, dir] = e.target.value.split(':')
                updateQuery(
                  { sort: sort === 'transaction_date' ? '' : sort, dir: dir === 'desc' ? '' : dir },
                  { resetPage: false },
                )
              }}
            >
              <option value="transaction_date:desc">Terbaru</option>
              <option value="transaction_date:asc">Terlama</option>
              <option value="amount:desc">Nominal terbesar</option>
              <option value="amount:asc">Nominal terkecil</option>
            </select>
          </div>
          <TransactionList
            transactions={transactions}
            onEdit={openEdit}
            onDelete={(trx) => setDeleting({ transaction: trx, loading: false })}
          />
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <Pagination meta={data.meta} onPageChange={(page) => updateQuery({ page }, { resetPage: false })} />
          <div className="d-flex align-items-center gap-2 mt-3 ms-auto">
            <label htmlFor="per-page" className="small text-body-secondary text-nowrap">
              Per halaman
            </label>
            <select
              id="per-page"
              className="form-select form-select-sm w-auto"
              value={query.per_page}
              onChange={(e) => updateQuery({ per_page: Number(e.target.value) === 15 ? '' : e.target.value })}
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Transaksi"
        subtitle={
          data?.period
            ? `${formatDate(data.period.start_date)} – ${formatDate(data.period.end_date)}`
            : 'Semua tanggal'
        }
        actions={
          <>
            {/* Export memakai filter & urutan yang sama dengan daftar (tanpa pagination). */}
            <ExportMenu params={exportParams} disabled={customInvalid || !data || data.meta.total === 0} />
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
              Tambah Transaksi
            </button>
          </>
        }
      />

      <TransactionFilters
        search={searchText}
        onSearchChange={handleSearchChange}
        type={query.type}
        onTypeChange={handleTypeChange}
        categories={categories}
        categoryId={query.category_id}
        onCategoryChange={(category_id) => updateQuery({ category_id })}
        paymentMethod={query.payment_method}
        onPaymentMethodChange={(payment_method) => updateQuery({ payment_method })}
        period={query.period}
        onPeriodChange={handlePeriodChange}
        customStart={query.start_date}
        onCustomStartChange={(start_date) => updateQuery({ start_date })}
        customEnd={query.end_date}
        onCustomEndChange={(end_date) => updateQuery({ end_date })}
        customError={customInvalid}
        activeCount={activeCount}
        onReset={handleReset}
      />

      <SummaryCards summary={data?.summary} />

      {error && data && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between gap-2" role="alert">
          <span>{getErrorMessage(error)}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={reload}>
            Coba lagi
          </button>
        </div>
      )}

      <div className={`position-relative opacity-transition ${loading && data ? 'opacity-50' : ''}`} aria-busy={loading}>
        {loading && data && (
          <div className="position-absolute top-0 start-50 translate-middle-x mt-4" style={{ zIndex: 2 }}>
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Memuat...</span>
            </div>
          </div>
        )}
        {content}
      </div>

      {form.show && (
        <TransactionFormModal
          key={form.key}
          show={form.show}
          transaction={form.transaction}
          categories={categories}
          onClose={closeForm}
          onSaved={() => {
            reload()
            // Jumlah transaksi per kategori berubah.
            refetchCategories()
          }}
        />
      )}

      <ConfirmDialog
        show={Boolean(deleting.transaction)}
        title="Hapus transaksi?"
        loading={deleting.loading}
        onClose={() => setDeleting({ transaction: null, loading: false })}
        onConfirm={confirmDelete}
      >
        {deleting.transaction && (
          <>
            <p className="mb-2">Transaksi berikut akan dihapus permanen:</p>
            <ul className="list-unstyled mb-0 small">
              <li>
                <strong>Tanggal:</strong> {formatDate(deleting.transaction.transaction_date)}
              </li>
              <li>
                <strong>Deskripsi:</strong>{' '}
                {deleting.transaction.description || deleting.transaction.category?.name || '—'}
              </li>
              <li>
                <strong>Nominal:</strong>{' '}
                <span className={deleting.transaction.type === 'income' ? 'text-success' : 'text-danger'}>
                  {formatRupiah(deleting.transaction.amount)}
                </span>
              </li>
            </ul>
          </>
        )}
      </ConfirmDialog>
    </>
  )
}
