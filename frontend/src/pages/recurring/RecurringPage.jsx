import { useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import { toast } from '../../i18n/toast'
import * as recurringApi from '../../api/recurring'
import CategoryIcon from '../../components/CategoryIcon'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import PageSkeleton from '../../components/ui/PageSkeleton'
import { useTransactions } from '../../context/TransactionContext'
import { useCategories } from '../../hooks/useCategories'
import { useFetch } from '../../hooks/useFetch'
import { useWallets } from '../../hooks/useWallets'
import { getErrorMessage } from '../../utils/errors'
import { formatDate, formatRupiah } from '../../utils/format'
import RecurringFormModal from './RecurringFormModal'
import { scheduleText } from './schedule'

function RuleRow({ rule, showWallet, busy, onEdit, onToggle, onDelete }) {
  const t = useT()
  const name = rule.description || rule.category?.name
  return (
    <li className={`list-group-item recurring-row d-flex flex-wrap align-items-center gap-3${rule.is_active ? '' : ' is-paused'}`}>
      <CategoryIcon icon={rule.category?.icon} color={rule.category?.color} />
      <div className="min-w-0 flex-grow-1">
        <div className="fw-semibold text-truncate">
          {name}
          {!rule.is_active && <span className="badge text-bg-secondary ms-2">{t('Dijeda')}</span>}
        </div>
        <div className="small text-body-secondary">
          {scheduleText(t, rule)}
          {rule.is_active && <> · {t('berikutnya {date}', { date: formatDate(rule.next_date) })}</>}
          {showWallet && rule.wallet && <> · {rule.wallet.name}</>}
        </div>
      </div>
      <span className={`fw-semibold text-nowrap ${rule.type === 'income' ? 'text-success' : 'text-danger'}`}>
        {rule.type === 'income' ? '+' : '−'}{formatRupiah(rule.amount)}
      </span>
      <div className="d-flex gap-1">
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onEdit(rule)} aria-label={t('Ubah {name}', { name })} title={t('Ubah')}>
          <i className="bi bi-pencil" aria-hidden="true"></i>
        </button>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onToggle(rule)} disabled={busy}
          aria-label={t(rule.is_active ? 'Jeda {name}' : 'Jalankan lagi {name}', { name })} title={t(rule.is_active ? 'Jeda' : 'Jalankan lagi')}>
          <i className={`bi ${rule.is_active ? 'bi-pause' : 'bi-play'}`} aria-hidden="true"></i>
        </button>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(rule)} aria-label={t('Hapus {name}', { name })} title={t('Hapus')}>
          <i className="bi bi-trash" aria-hidden="true"></i>
        </button>
      </div>
    </li>
  )
}

export default function RecurringPage() {
  const t = useT()
  const { refreshTransactions } = useTransactions()
  const { data, error, reload } = useFetch('recurring', (signal) => recurringApi.list({ signal }))
  const { categories } = useCategories()
  const { wallets } = useWallets()
  const rules = data?.data ?? []
  const [form, setForm] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [busyId, setBusyId] = useState(null)

  // Transaksi yang langsung dicatat ikut memperbarui dashboard/daftar (dan daftar ini lewat useFetch).
  const afterSave = (created) => (created ? refreshTransactions() : reload())

  async function toggle(rule) {
    setBusyId(rule.id)
    try {
      const response = await recurringApi.toggle(rule.id)
      toast.success(response.data.message)
      afterSave(response.data.created > 0)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true)
    try {
      const response = await recurringApi.remove(deleting.id)
      toast.success(response.data.message)
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleteBusy(false)
      setDeleting(null)
    }
  }

  let content
  if (!data && error) content = <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  else if (!data) content = <PageSkeleton variant="report" />
  else if (rules.length === 0) {
    content = (
      <EmptyState
        icon="bi-arrow-repeat"
        title="Belum ada transaksi rutin"
        description="Contoh: listrik tiap tanggal 5, gaji tiap tanggal 25, atau uang saku tiap Senin. Pidu mencatatnya sendiri pada tanggalnya."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setForm({ rule: null })}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
            {t('Tambah transaksi rutin')}
          </button>
        }
      />
    )
  } else {
    content = (
      <div className="card">
        <ul className="list-group list-group-flush">
          {rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              showWallet={wallets.length > 1}
              busy={busyId === rule.id}
              onEdit={(r) => setForm({ rule: r })}
              onToggle={toggle}
              onDelete={setDeleting}
            />
          ))}
        </ul>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Transaksi rutin"
        subtitle="Dicatat otomatis pada tanggalnya"
        actions={rules.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={() => setForm({ rule: null })}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
            {t('Tambah transaksi rutin')}
          </button>
        )}
      />
      {content}
      {form && <RecurringFormModal rule={form.rule} categories={categories} wallets={wallets} onClose={() => setForm(null)} onSaved={afterSave} />}
      <ConfirmDialog show={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={deleteBusy} title="Hapus transaksi rutin">
        {deleting && t('Hapus "{name}"? Transaksi yang sudah tercatat tetap ada.', { name: deleting.description || deleting.category?.name })}
      </ConfirmDialog>
    </>
  )
}
