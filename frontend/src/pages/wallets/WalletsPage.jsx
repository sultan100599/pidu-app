import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../../i18n/LocaleProvider'
import { toast } from '../../i18n/toast'
import * as walletsApi from '../../api/wallets'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import PageSkeleton from '../../components/ui/PageSkeleton'
import { useFetch } from '../../hooks/useFetch'
import { useWallets } from '../../hooks/useWallets'
import { WALLET_KINDS, WALLET_PURPOSES } from '../../constants/enums'
import { getErrorMessage } from '../../utils/errors'
import { formatDate, formatRupiah } from '../../utils/format'
import WalletFormModal from './WalletFormModal'
import TransferFormModal from './TransferFormModal'

const tone = (value) => (value < 0 ? 'text-danger' : '')

function WalletCard({ wallet, canTransfer, onEdit, onTransfer, onArchive, onDelete, busy }) {
  const t = useT()
  const kind = WALLET_KINDS[wallet.kind] ?? WALLET_KINDS.cash
  return (
    <div className="col">
      <article className="card wallet-card h-100" aria-label={wallet.name}>
        <div className="card-body d-flex flex-column">
          <div className="d-flex align-items-start gap-3">
            <i className={`bi ${kind.icon} icon-tile wallet-icon`} aria-hidden="true"></i>
            <div className="min-w-0 flex-grow-1">
              <h2 className="h6 mb-1 text-truncate">{wallet.name}</h2>
              <div className="small text-body-secondary">
                {t(kind.label)} · <span className={wallet.purpose === 'business' ? 'wallet-purpose-business' : ''}>{t(WALLET_PURPOSES[wallet.purpose])}</span>
              </div>
            </div>
          </div>
          <div className={`wallet-balance fw-semibold mt-3 ${tone(wallet.balance)}`}>{formatRupiah(wallet.balance)}</div>
          {Number(wallet.opening_balance) > 0 && (
            <div className="small text-body-secondary">{t('Saldo awal {amount}', { amount: formatRupiah(wallet.opening_balance) })}</div>
          )}
          <div className="d-flex flex-wrap align-items-center gap-2 mt-auto pt-3">
            <Link to={`/transactions?wallet_id=${wallet.id}`} className="small">{t('Lihat transaksi')}</Link>
            <div className="ms-auto d-flex gap-1">
              {canTransfer && (
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onTransfer(wallet)} aria-label={t('Pindah uang dari {name}', { name: wallet.name })} title={t('Pindah uang')}>
                  <i className="bi bi-arrow-left-right" aria-hidden="true"></i>
                </button>
              )}
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onEdit(wallet)} aria-label={t('Ubah dompet {name}', { name: wallet.name })} title={t('Ubah')}>
                <i className="bi bi-pencil" aria-hidden="true"></i>
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onArchive(wallet)} disabled={busy} aria-label={t('Arsipkan dompet {name}', { name: wallet.name })} title={t('Arsipkan')}>
                <i className="bi bi-archive" aria-hidden="true"></i>
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(wallet)} aria-label={t('Hapus dompet {name}', { name: wallet.name })} title={t('Hapus')}>
                <i className="bi bi-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}

function TransferHistory({ onDelete }) {
  const t = useT()
  const [page, setPage] = useState(1)
  const { data, error, reload } = useFetch(`transfers:${page}`, (signal) => walletsApi.transfers({ page }, { signal }))
  const transfers = data?.data ?? []

  return (
    <section className="card mt-4" aria-labelledby="transfer-history-title">
      <div className="card-header bg-transparent">
        <h2 id="transfer-history-title" className="h6 mb-0">{t('Riwayat pindah uang')}</h2>
      </div>
      <div className="card-body">
        {error && !data ? (
          <ErrorState message={getErrorMessage(error)} onRetry={reload} />
        ) : !data ? (
          <p className="text-body-secondary mb-0" role="status">{t('Memuat…')}</p>
        ) : transfers.length === 0 ? (
          <p className="text-body-secondary mb-0">{t('Belum pernah memindahkan uang antar-dompet.')}</p>
        ) : (
          <>
            <ul className="list-group list-group-flush">
              {transfers.map((tr) => (
                <li key={tr.id} className="list-group-item px-0 d-flex align-items-center gap-3">
                  <div className="min-w-0 flex-grow-1">
                    <div className="fw-semibold text-truncate">
                      {tr.from_wallet?.name} <i className="bi bi-arrow-right mx-1" aria-label={t('ke')}></i> {tr.to_wallet?.name}
                    </div>
                    <div className="small text-body-secondary">
                      {formatDate(tr.transfer_date)}{tr.description ? ` · ${tr.description}` : ''}
                    </div>
                  </div>
                  <span className="fw-semibold text-nowrap">{formatRupiah(tr.amount)}</span>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(tr, reload)} aria-label={t('Hapus pindahan {from} ke {to}', { from: tr.from_wallet?.name, to: tr.to_wallet?.name })}>
                    <i className="bi bi-trash" aria-hidden="true"></i>
                  </button>
                </li>
              ))}
            </ul>
            {data.meta.last_page > 1 && <Pagination meta={data.meta} onPageChange={setPage} />}
          </>
        )}
      </div>
    </section>
  )
}

export default function WalletsPage() {
  const t = useT()
  const { wallets, active, hasBothPurposes, loaded, error, refetch } = useWallets()
  const archived = wallets.filter((w) => !w.is_active)
  const [form, setForm] = useState(null)
  const [transfer, setTransfer] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [transferDelete, setTransferDelete] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [historyVersion, setHistoryVersion] = useState(0)

  const total = wallets.reduce((sum, w) => sum + Number(w.balance), 0)
  const totalFor = (purpose) => wallets.filter((w) => w.purpose === purpose).reduce((sum, w) => sum + Number(w.balance), 0)

  async function toggle(wallet) {
    setBusyId(wallet.id)
    try {
      const response = await walletsApi.toggle(wallet.id)
      toast.success(response.data.message)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true)
    try {
      const response = await walletsApi.remove(deleting.id)
      toast.success(response.data.message)
      refetch()
    } catch (err) {
      toast.error(err.response?.data?.errors?.wallet?.[0] ?? getErrorMessage(err))
    } finally {
      setDeleteBusy(false)
      setDeleting(null)
    }
  }

  async function confirmTransferDelete() {
    setDeleteBusy(true)
    try {
      const response = await walletsApi.removeTransfer(transferDelete.transfer.id)
      toast.success(response.data.message)
      transferDelete.reload()
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleteBusy(false)
      setTransferDelete(null)
    }
  }

  let content
  if (!loaded && error) content = <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
  else if (!loaded) content = <PageSkeleton variant="report" />
  else if (wallets.length === 0) content = <EmptyState icon="bi-wallet2" title="Belum ada dompet" />
  else {
    content = (
      <>
        <div className="glass-strip wallet-totals d-flex flex-wrap align-items-baseline gap-3 mb-3">
          <span>{t('Total semua dompet')} <strong className={tone(total)}>{formatRupiah(total)}</strong></span>
          {hasBothPurposes && (
            <span className="small text-body-secondary">
              {t('Pribadi {amount}', { amount: formatRupiah(totalFor('personal')) })} · {t('Usaha {amount}', { amount: formatRupiah(totalFor('business')) })}
            </span>
          )}
        </div>
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
          {active.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              canTransfer={active.length > 1}
              busy={busyId === wallet.id}
              onEdit={(w) => setForm({ wallet: w })}
              onTransfer={(w) => setTransfer({ from: w.id })}
              onArchive={toggle}
              onDelete={setDeleting}
            />
          ))}
        </div>
        {archived.length > 0 && (
          <details className="card mt-4 wallet-archived">
            <summary className="card-body py-2">{t('Diarsipkan ({count})', { count: archived.length })}</summary>
            <ul className="list-group list-group-flush">
              {archived.map((w) => (
                <li key={w.id} className="list-group-item d-flex align-items-center gap-3">
                  <span className="flex-grow-1 min-w-0 text-truncate">{w.name}</span>
                  <span className={`text-nowrap ${tone(w.balance)}`}>{formatRupiah(w.balance)}</span>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => toggle(w)} disabled={busyId === w.id}>
                    {t('Pakai lagi')}
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleting(w)} aria-label={t('Hapus dompet {name}', { name: w.name })}>
                    <i className="bi bi-trash" aria-hidden="true"></i>
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
        <TransferHistory key={historyVersion} onDelete={(transfer, reload) => setTransferDelete({ transfer, reload })} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Dompet"
        subtitle="Tunai, rekening, dan e-wallet"
        actions={
          <>
            {active.length > 1 && (
              <button type="button" className="btn btn-outline-secondary" onClick={() => setTransfer({ from: null })}>
                <i className="bi bi-arrow-left-right me-1" aria-hidden="true"></i>
                {t('Pindah uang')}
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => setForm({ wallet: null })}>
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
              {t('Tambah dompet')}
            </button>
          </>
        }
      />
      {content}
      {form && <WalletFormModal wallet={form.wallet} onClose={() => setForm(null)} onSaved={refetch} />}
      {transfer && (
        <TransferFormModal
          wallets={active}
          from={transfer.from}
          onClose={() => setTransfer(null)}
          onSaved={() => {
            refetch()
            setHistoryVersion((v) => v + 1)
          }}
        />
      )}
      <ConfirmDialog show={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={deleteBusy} title="Hapus dompet">
        {deleting && t('Hapus dompet "{name}"? Dompet yang sudah punya catatan tidak bisa dihapus, hanya bisa diarsipkan.', { name: deleting.name })}
      </ConfirmDialog>
      <ConfirmDialog show={Boolean(transferDelete)} onClose={() => setTransferDelete(null)} onConfirm={confirmTransferDelete} loading={deleteBusy} title="Hapus pindahan">
        {transferDelete && t('Hapus catatan pindah {amount} dari {from} ke {to}? Saldo kedua dompet ikut kembali.', {
          amount: formatRupiah(transferDelete.transfer.amount),
          from: transferDelete.transfer.from_wallet?.name,
          to: transferDelete.transfer.to_wallet?.name,
        })}
      </ConfirmDialog>
    </>
  )
}
