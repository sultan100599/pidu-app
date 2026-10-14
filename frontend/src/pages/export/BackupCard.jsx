import { useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import { Link } from 'react-router-dom'
import { toast } from '../../i18n/toast'
import * as backupsApi from '../../api/backups'
import { useFetch } from '../../hooks/useFetch'
import { getErrorMessage } from '../../utils/errors'
import { formatBytes, formatDateTime } from '../../utils/format'

// Backup milik user: xlsx semua transaksi, dibuat otomatis tiap hari atau manual.
export default function BackupCard() {
  const t = useT()
  const { data, error, loading, reload } = useFetch('backups', (signal) => backupsApi.list({ signal }))
  const [busy, setBusy] = useState(null) // 'create' | nama file yang sedang diunduh

  async function create() {
    setBusy('create')
    try {
      const response = await backupsApi.create()
      toast.success(response.data.message)
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function download(name) {
    setBusy(name)
    try {
      await backupsApi.download(name)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const backups = data?.data ?? []

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <h2 className="h5 mb-0">
            <i className="bi bi-shield-check me-2 text-info" aria-hidden="true"></i>
            {t('Cadangan')}
          </h2>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={create} disabled={busy != null}>
            {busy === 'create' ? (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
            )}
            {t('Cadangkan sekarang')}
          </button>
        </div>
        <p className="text-body-secondary small">
          {t('Cadangan berisi semua transaksi kamu dalam satu file Excel.')}
          {data && ' ' + t('Dibuat otomatis setiap hari pukul {time} selama aplikasi berjalan; {count} cadangan terbaru disimpan.', { time: data.schedule, count: data.keep })}
          {' '}{t('Untuk memulihkan data, unduh cadangan lalu unggah di halaman Unggah. Transaksi yang sudah ada otomatis dilewati.')}
          {' '}<Link to="/import">{t('Buka halaman Unggah')}</Link>
        </p>

        {error && !data ? (
          <div className="alert alert-danger d-flex justify-content-between align-items-center gap-2 mb-0" role="alert">
            <span>{getErrorMessage(error)}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={reload}>
              {t('Coba lagi')}
            </button>
          </div>
        ) : !data ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">{t('Memuat...')}</span>
            </div>
          </div>
        ) : backups.length === 0 ? (
          <p className="text-center text-body-secondary border rounded py-3 mb-0">{t('Belum ada cadangan.')}</p>
        ) : (
          <ul className={`list-group opacity-transition ${loading ? 'opacity-50' : ''}`}>
            {backups.map((b, i) => (
              <li key={b.name} className="list-group-item d-flex justify-content-between align-items-center gap-2">
                <div className="min-w-0">
                  <div className="fw-semibold">
                    {formatDateTime(b.created_at)}
                    {i === 0 && <span className="badge text-bg-success ms-2 fw-normal">{t('terbaru')}</span>}
                  </div>
                  <div className="small text-body-secondary text-truncate">
                    {b.name} · {formatBytes(b.size)}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary text-nowrap"
                  onClick={() => download(b.name)}
                  disabled={busy != null}
                  aria-label={t('Unduh cadangan {date}', { date: formatDateTime(b.created_at) })}
                >
                  {busy === b.name ? (
                    <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                  ) : (
                    <i className="bi bi-download" aria-hidden="true"></i>
                  )}
                  <span className="d-none d-sm-inline ms-1">{t('Unduh')}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
