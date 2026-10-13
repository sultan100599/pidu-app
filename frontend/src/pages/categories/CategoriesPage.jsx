import { useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import { useSearchParams } from 'react-router-dom'
import { toast } from '../../i18n/toast'
import * as categoriesApi from '../../api/categories'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { TRANSACTION_TYPES } from '../../constants/enums'
import { useCategories } from '../../hooks/useCategories'
import { getErrorMessage } from '../../utils/errors'
import { formatNumber } from '../../utils/format'
import CategoryFormModal from './CategoryFormModal'
import CategoryIcon from '../../components/CategoryIcon'
import PageSkeleton from '../../components/ui/PageSkeleton'

function CategoryRow({ category, toggling, onEdit, onToggle, onDelete }) {
  const t = useT()
  const used = category.transactions_count > 0
  const switchId = `cat-active-${category.id}`

  return (
    <li className="category-row list-group-item d-flex align-items-center gap-3 py-2">
      <span className="category-icon rounded-circle d-inline-flex align-items-center justify-content-center">
        <CategoryIcon icon={category.icon} color={category.color} />
      </span>
      <div className="min-w-0 flex-grow-1">
        <div className={`fw-semibold text-truncate ${category.is_active ? '' : 'text-body-secondary'}`}>
          {category.name}
          {!category.is_active && <span className="badge text-bg-secondary ms-2 fw-normal">{t('Disembunyikan')}</span>}
        </div>
        <div className="small text-body-secondary">{t('{count} transaksi', { count: formatNumber(category.transactions_count) })}</div>
      </div>
      <div className="form-check form-switch mb-0" title={t(category.is_active ? 'Sembunyikan dari form' : 'Tampilkan di form')}>
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id={switchId}
          checked={category.is_active}
          disabled={toggling}
          onChange={() => onToggle(category)}
        />
        <label className="visually-hidden" htmlFor={switchId}>
          {t('Kategori {name} tampil di form', { name: category.name })}
        </label>
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        aria-label={t('Edit kategori {name}', { name: category.name })}
        onClick={() => onEdit(category)}
      >
        <i className="bi bi-pencil" aria-hidden="true"></i>
      </button>
      {/* Tetap bisa diklik walau kategori dipakai, supaya alasannya terlihat (title tidak muncul di HP). */}
      <button
        type="button"
        className={`btn btn-sm btn-outline-danger${used ? ' is-blocked' : ''}`}
        aria-label={t('Hapus kategori {name}', { name: category.name })}
        aria-disabled={used || undefined}
        onClick={() => used
          ? toast.info(t('Kategori masih dipakai {count} transaksi, jadi tidak bisa dihapus. Sembunyikan saja supaya tidak muncul di form.', { count: category.transactions_count }))
          : onDelete(category)}
      >
        <i className="bi bi-trash" aria-hidden="true"></i>
      </button>
    </li>
  )
}

export default function CategoriesPage() {
  const t = useT()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeType = searchParams.get('type') === 'income' ? 'income' : 'expense'
  const [showInactive, setShowInactive] = useState(false)
  const { categories, loading, error, loaded, refetch } = useCategories()
  const [togglingId, setTogglingId] = useState(null)
  const [form, setForm] = useState({ show: false, category: null, key: 0 })
  const [deleting, setDeleting] = useState({ category: null, loading: false })

  const counts = {
    expense: categories.filter((c) => c.type === 'expense').length,
    income: categories.filter((c) => c.type === 'income').length,
  }
  const visible = categories.filter((c) => c.type === activeType && (showInactive || c.is_active))

  function selectTab(type) {
    setSearchParams(type === 'expense' ? {} : { type }, { replace: true })
  }

  async function handleToggle(category) {
    setTogglingId(category.id)
    try {
      const response = await categoriesApi.toggle(category.id)
      toast.success(response.data.message)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  async function confirmDelete() {
    setDeleting((d) => ({ ...d, loading: true }))
    try {
      const response = await categoriesApi.remove(deleting.category.id)
      toast.success(response.data.message)
      setDeleting({ category: null, loading: false })
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleting((d) => ({ ...d, loading: false }))
    }
  }

  const openCreate = () => setForm((f) => ({ show: true, category: null, key: f.key + 1 }))
  const openEdit = (category) => setForm((f) => ({ show: true, category, key: f.key + 1 }))

  let content
  if (loading && !loaded) {
    content = <PageSkeleton variant="categories" />
  } else if (error && categories.length === 0) {
    content = <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
  } else if (visible.length === 0) {
    content = (
      <EmptyState
        icon="bi-tags"
        title={t('Belum ada kategori {type}', { type: t(TRANSACTION_TYPES[activeType]).toLowerCase() })}
        action={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
            {t('Tambah Kategori')}
          </button>
        }
      />
    )
  } else {
    content = (
      <div className="card">
        <ul className="list-group list-group-flush">
          {visible.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              toggling={togglingId === category.id}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={(c) => setDeleting({ category: c, loading: false })}
            />
          ))}
        </ul>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Kategori"
        subtitle="Kelompokkan transaksi supaya laporan lebih rapi."
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
            {t('Tambah Kategori')}
          </button>
        }
      />

      <div className="glass-strip d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <ul className="nav nav-pills" role="tablist">
          {Object.entries(TRANSACTION_TYPES).map(([type, label]) => (
            <li className="nav-item" role="presentation" key={type}>
              <button
                type="button"
                role="tab"
                aria-selected={activeType === type}
                className={`nav-link ${activeType === type ? 'active' : ''}`}
                onClick={() => selectTab(type)}
              >
                {t(label)}
                <span className={`badge ms-2 ${activeType === type ? 'text-bg-light' : 'text-bg-secondary'}`}>
                  {counts[type]}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="form-check form-switch mb-0">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="show-inactive"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="show-inactive">
            {t('Tampilkan yang disembunyikan')}
          </label>
        </div>
      </div>

      {error && categories.length > 0 && <div className="alert alert-danger" role="alert">{getErrorMessage(error)} <button type="button" className="btn btn-sm btn-outline-danger" onClick={refetch}>{t('Coba lagi')}</button></div>}
      <div className={`opacity-transition ${loading && loaded ? 'opacity-50' : ''}`} aria-busy={loading}>{content}</div>

      {form.show && (
        <CategoryFormModal
          key={form.key}
          show={form.show}
          category={form.category}
          defaultType={activeType}
          onClose={() => setForm((f) => ({ ...f, show: false }))}
          onSaved={(saved) => {
            refetch()
            if (saved.type !== activeType) selectTab(saved.type)
          }}
        />
      )}

      <ConfirmDialog
        show={Boolean(deleting.category)}
        title="Hapus kategori?"
        loading={deleting.loading}
        onClose={() => setDeleting({ category: null, loading: false })}
        onConfirm={confirmDelete}
      >
        {deleting.category && (
          <>
            <p className="mb-2">
              {t('Kategori akan dihapus permanen:')} <strong>{deleting.category.name}</strong>
            </p>
            <p className="mb-0 small text-body-secondary">{t('Budget untuk kategori ini juga akan terhapus.')}</p>
          </>
        )}
      </ConfirmDialog>
    </>
  )
}
