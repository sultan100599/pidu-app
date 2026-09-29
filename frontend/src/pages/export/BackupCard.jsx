import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import * as backupsApi from '../../api/backups'
import { useFetch } from '../../hooks/useFetch'
import { getErrorMessage } from '../../utils/errors'
import { formatBytes } from '../../utils/format'

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

// Backup milik user: xlsx semua transaksi, dibuat otomatis tiap hari atau manual.
export default function BackupCard() {
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
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <h2 className="h5 mb-0">
            <i className="bi bi-shield-check me-2 text-info" aria-hidden="true"></i>
            Backup
          </h2>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={create} disabled={busy != null}>
            {busy === 'create' ? (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
            )}
            Backup sekarang
          </button>
        </div>
        <p className="text-body-secondary small">
          Backup berisi <strong>semua transaksi</strong> Anda dalam satu file Excel. Dibuat otomatis setiap hari
          {data ? ` pukul ${data.schedule}` : ''} selama aplikasi berjalan; {data ? `${data.keep} backup terbaru` : 'backup terbaru'}{' '}
          disimpan. Untuk memulihkan data, unduh backup lalu unggah di halaman <Link to="/import">Impor</Link> (transaksi yang
          sudah ada otomatis dilewati).
        </p>

        {error && !data ? (
          <div className="alert alert-danger d-flex justify-content-between align-items-center gap-2 mb-0" role="alert">
            <span>{getErrorMessage(error)}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={reload}>
              Coba lagi
            </button>
          </div>
        ) : !data ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Memuat...</span>
            </div>
          </div>
        ) : backups.length === 0 ? (
          <p className="text-center text-body-secondary border rounded py-3 mb-0">Belum ada backup.</p>
        ) : (
          <ul className={`list-group opacity-transition ${loading ? 'opacity-50' : ''}`}>
            {backups.map((b, i) => (
              <li key={b.name} className="list-group-item d-flex justify-content-between align-items-center gap-2">
                <div className="min-w-0">
                  <div className="fw-semibold">
                    {dateTimeFormatter.format(new Date(b.created_at))}
                    {i === 0 && <span className="badge text-bg-success ms-2 fw-normal">terbaru</span>}
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
                  aria-label={`Unduh backup ${dateTimeFormatter.format(new Date(b.created_at))}`}
                >
                  {busy === b.name ? (
                    <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                  ) : (
                    <i className="bi bi-download" aria-hidden="true"></i>
                  )}
                  <span className="d-none d-sm-inline ms-1">Unduh</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
