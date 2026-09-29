import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import * as importApi from '../../api/import'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { PAYMENT_METHODS, TRANSACTION_TYPES } from '../../constants/enums'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import { formatDate, formatNumber, formatRupiah } from '../../utils/format'

const ACCEPT = '.xlsx,.xls,.csv'

function Stat({ label, value, tone = '' }) {
  return (
    <div className="col">
      <div className="border rounded p-2 h-100">
        <div className="small text-body-secondary">{label}</div>
        <div className={`fw-semibold ${tone}`}>{value}</div>
      </div>
    </div>
  )
}

function ErrorList({ errors, truncated }) {
  return (
    <div className="card border-danger mb-3">
      <div className="card-header bg-transparent text-danger fw-semibold">
        <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
        Baris bermasalah
      </div>
      <div className="table-responsive">
        <table className="table table-sm mb-0 align-top">
          <thead>
            <tr>
              <th scope="col" style={{ width: 80 }}>
                Baris
              </th>
              <th scope="col">Masalah</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((e) => (
              <tr key={e.row}>
                <td>{e.row}</td>
                <td>
                  <ul className="mb-0 ps-3">
                    {e.messages.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {truncated && (
        <div className="card-footer small text-body-secondary">Hanya 100 baris bermasalah pertama yang ditampilkan.</div>
      )}
    </div>
  )
}

function Preview({ rows, skipDuplicates }) {
  return (
    <div className="card mb-3">
      <div className="card-header bg-transparent fw-semibold">Pratinjau (10 baris pertama)</div>
      <div className="table-responsive">
        <table className="table table-sm mb-0 align-middle">
          <thead>
            <tr>
              <th scope="col">Baris</th>
              <th scope="col">Tanggal</th>
              <th scope="col">Jenis</th>
              <th scope="col">Kategori</th>
              <th scope="col">Deskripsi</th>
              <th scope="col">Metode</th>
              <th scope="col" className="text-end">
                Nominal
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.row} className={r.duplicate && skipDuplicates ? 'text-body-secondary' : ''}>
                <td>{r.row}</td>
                <td className="text-nowrap">{formatDate(r.transaction_date)}</td>
                <td>{TRANSACTION_TYPES[r.type]}</td>
                <td>{r.category}</td>
                <td>
                  {r.description ?? 'Tanpa deskripsi'}
                  {r.duplicate && (
                    <span className="badge text-bg-secondary ms-2 fw-normal">{skipDuplicates ? 'duplikat, dilewati' : 'duplikat'}</span>
                  )}
                </td>
                <td>{PAYMENT_METHODS[r.payment_method]}</td>
                <td
                  className={`text-end text-nowrap ${
                    r.duplicate && skipDuplicates ? '' : r.type === 'income' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {formatRupiah(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ImportPage() {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [fileError, setFileError] = useState('')
  const [busy, setBusy] = useState(null) // 'template' | 'analyze' | 'commit'
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(null)

  function reset() {
    setFile(null)
    setAnalysis(null)
    setFileError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function downloadTemplate() {
    setBusy('template')
    try {
      await importApi.template()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function analyze(selected) {
    setFile(selected)
    setAnalysis(null)
    setFileError('')
    setDone(null)
    if (!selected) return
    setBusy('analyze')
    try {
      const response = await importApi.transactions(selected, { dryRun: true })
      setAnalysis(response.data.data)
    } catch (err) {
      setFileError(getFieldErrors(err).file ?? getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function commit() {
    setBusy('commit')
    try {
      const response = await importApi.transactions(file, { dryRun: false, skipDuplicates })
      toast.success(response.data.message)
      setDone(response.data.message)
      setConfirming(false)
      reset()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setConfirming(false)
      // Data mungkin berubah sejak pratinjau (mis. baris kini duplikat) → analisis ulang.
      if (err.response?.status === 422 && err.response.data?.data) setAnalysis(err.response.data.data)
    } finally {
      setBusy(null)
    }
  }

  const importCount = analysis ? (skipDuplicates ? analysis.to_import : analysis.valid) : 0
  const canImport = analysis && analysis.invalid === 0 && importCount > 0

  return (
    <>
      <PageHeader
        title="Impor"
        subtitle="Tambahkan banyak transaksi sekaligus dari file Excel atau CSV."
        actions={
          <button type="button" className="btn btn-outline-primary" onClick={downloadTemplate} disabled={busy === 'template'}>
            {busy === 'template' ? (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-file-earmark-arrow-down me-2" aria-hidden="true"></i>
            )}
            Unduh template
          </button>
        }
      />

      {done && (
        <div className="alert alert-success d-flex flex-wrap justify-content-between align-items-center gap-2" role="status">
          <span>
            <i className="bi bi-check-circle me-2" aria-hidden="true"></i>
            {done}
          </span>
          <Link to="/transactions" className="btn btn-sm btn-success">
            Lihat transaksi
          </Link>
        </div>
      )}

      <div className="card import-upload mb-3">
        <div className="card-body">
          <label htmlFor="import-file" className="form-label fw-semibold">
            Pilih file (.xlsx, .xls, .csv, maks. 5 MB, 5.000 baris)
          </label>
          <input
            ref={inputRef}
            id="import-file"
            type="file"
            accept={ACCEPT}
            className={`form-control ${fileError ? 'is-invalid' : ''}`}
            onChange={(e) => analyze(e.target.files?.[0] ?? null)}
            disabled={busy === 'analyze' || busy === 'commit'}
            aria-describedby="import-help"
          />
          {fileError && <div className="invalid-feedback">{fileError}</div>}
          <div id="import-help" className="form-text">
            Kolom: <strong>Tanggal</strong>, Jenis, <strong>Kategori</strong>, Deskripsi, Catatan, Metode, <strong>Nominal</strong>{' '}
            (tebal = wajib). File hasil Export atau Backup Pidu-App bisa langsung diimpor. File hanya diperiksa dulu; tidak
            ada yang disimpan sebelum Anda menekan <em>Impor</em>.
          </div>
          {busy === 'analyze' && (
            <div className="d-flex align-items-center gap-2 mt-3 text-body-secondary" role="status">
              <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
              Memeriksa file…
            </div>
          )}
        </div>
      </div>

      {analysis && (
        <>
          <div className="card mb-3">
            <div className="card-body">
              <h2 className="h6 mb-3">
                Hasil pemeriksaan <span className="text-body-secondary fw-normal">: {file?.name}</span>
              </h2>
              <div className="row row-cols-2 row-cols-md-3 row-cols-xl-6 g-2 mb-3">
                <Stat label="Baris data" value={formatNumber(analysis.total_rows)} />
                <Stat label="Valid" value={formatNumber(analysis.valid)} tone="text-success" />
                <Stat label="Bermasalah" value={formatNumber(analysis.invalid)} tone={analysis.invalid ? 'text-danger' : ''} />
                <Stat label="Duplikat" value={formatNumber(analysis.duplicates)} tone={analysis.duplicates ? 'text-warning-emphasis' : ''} />
                <Stat label="Total pemasukan" value={formatRupiah(analysis.income)} tone="text-success" />
                <Stat label="Total pengeluaran" value={formatRupiah(analysis.expense)} tone="text-danger" />
              </div>

              {analysis.new_categories.length > 0 && (
                <p className="small mb-2">
                  <i className="bi bi-tags me-1" aria-hidden="true"></i>
                  Kategori baru yang akan dibuat:{' '}
                  {analysis.new_categories.map((c) => `${c.name} (${TRANSACTION_TYPES[c.type]})`).join(', ')}
                </p>
              )}

              {analysis.duplicates > 0 && (
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="skip-duplicates"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="skip-duplicates">
                    Lewati {formatNumber(analysis.duplicates)} baris yang sudah ada (tanggal, jenis, kategori, nominal, dan
                    deskripsi sama)
                  </label>
                </div>
              )}

              {analysis.invalid > 0 ? (
                <div className="alert alert-danger mb-0" role="alert">
                  Ada {formatNumber(analysis.invalid)} baris bermasalah. Perbaiki di file, lalu pilih file lagi.
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!canImport || busy != null}
                    onClick={() => setConfirming(true)}
                  >
                    <i className="bi bi-upload me-2" aria-hidden="true"></i>
                    {importCount > 0 ? `Impor ${formatNumber(importCount)} transaksi` : 'Tidak ada yang perlu diimpor'}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={reset} disabled={busy != null}>
                    Batal
                  </button>
                </div>
              )}
            </div>
          </div>

          {analysis.errors.length > 0 && <ErrorList errors={analysis.errors} truncated={analysis.errors_truncated} />}
          {analysis.preview.length > 0 && <Preview rows={analysis.preview} skipDuplicates={skipDuplicates} />}
        </>
      )}

      <ConfirmDialog
        show={confirming}
        title="Impor transaksi?"
        confirmLabel="Impor"
        confirmVariant="primary"
        loading={busy === 'commit'}
        onClose={() => setConfirming(false)}
        onConfirm={commit}
      >
        <p className="mb-2">
          <strong>{formatNumber(importCount)}</strong> transaksi dari <strong>{file?.name}</strong> akan ditambahkan.
        </p>
        {analysis?.new_categories.length > 0 && (
          <p className="mb-2 small">{analysis.new_categories.length} kategori baru akan dibuat.</p>
        )}
        <p className="mb-0 small text-body-secondary">
          Semua baris disimpan sekaligus (jika gagal, tidak ada yang tersimpan). Transaksi yang sudah diimpor bisa dihapus
          dari halaman Transaksi.
        </p>
      </ConfirmDialog>
    </>
  )
}
