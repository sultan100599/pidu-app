import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import * as exportApi from '../../api/export'
import PageHeader from '../../components/PageHeader'
import BackupCard from './BackupCard'
import Stepper from '../../components/ui/Stepper'
import { TRANSACTION_TYPES } from '../../constants/enums'
import { getErrorMessage } from '../../utils/errors'
import { getPeriodRange, isCustomRangeInvalid, PERIOD_PRESETS } from '../../utils/period'

const ALL_SHEETS = ['Transaksi', 'Harian', 'Mingguan', 'Bulanan', 'Tahunan', 'Kategori', 'Budget']

function useDownload() {
  const [busy, setBusy] = useState(null)

  async function run(key, fn) {
    setBusy(key)
    try {
      const filename = await fn()
      toast.success(`${filename} diunduh.`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return { busy, run }
}

function DownloadButton({ label, icon, variant, busy, disabled, onClick }) {
  return (
    <button type="button" className={`btn ${variant}`} onClick={onClick} disabled={disabled || busy}>
      {busy ? (
        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
      ) : (
        <i className={`bi ${icon} me-2`} aria-hidden="true"></i>
      )}
      {label}
    </button>
  )
}

function TransactionsExportCard() {
  const [period, setPeriod] = useState('this_month')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [type, setType] = useState('')
  const { busy, run } = useDownload()

  const invalid = isCustomRangeInvalid(period, start, end)
  const incomplete = period === 'custom' && (!start || !end)
  const params = { ...(getPeriodRange(period, start, end) ?? {}), ...(type ? { type } : {}) }

  function changePeriod(value) {
    if (value === 'custom' && !start) {
      const range = getPeriodRange('this_month')
      setStart(range.start_date)
      setEnd(range.end_date)
    }
    setPeriod(value)
  }

  return (
    <div className="card h-100">
      <div className="card-body d-flex flex-column">
        <h2 className="h5">
          <i className="bi bi-list-ul me-2 text-primary" aria-hidden="true"></i>
          Export transaksi
        </h2>
        <p className="text-body-secondary small">
          Daftar transaksi beserta total pemasukan, pengeluaran, dan saldo. Butuh filter kategori, metode, atau
          pencarian? Pakai tombol <strong>Export</strong> di halaman <Link to="/transactions">Transaksi</Link>.
        </p>

        <div className="row g-2 mb-3">
          <div className="col-sm-6">
            <label htmlFor="exp-period" className="form-label small mb-1">
              Periode
            </label>
            <select id="exp-period" className="form-select" value={period} onChange={(e) => changePeriod(e.target.value)}>
              {PERIOD_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.value === 'all' ? 'Semua tanggal' : p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm-6">
            <label htmlFor="exp-type" className="form-label small mb-1">
              Jenis
            </label>
            <select id="exp-type" className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Semua</option>
              {Object.entries(TRANSACTION_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {period === 'custom' && (
            <>
              <div className="col-6">
                <label htmlFor="exp-start" className="form-label small mb-1">
                  Dari
                </label>
                <input
                  id="exp-start"
                  type="date"
                  className={`form-control ${invalid ? 'is-invalid' : ''}`}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="col-6">
                <label htmlFor="exp-end" className="form-label small mb-1">
                  Sampai
                </label>
                <input
                  id="exp-end"
                  type="date"
                  className={`form-control ${invalid ? 'is-invalid' : ''}`}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
              {invalid && (
                <div className="col-12">
                  <p className="text-danger small mb-0" role="alert">
                    Tanggal akhir tidak boleh lebih awal dari tanggal mulai.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="d-flex flex-wrap gap-2 mt-auto">
          <DownloadButton
            label="Excel"
            icon="bi-file-earmark-spreadsheet"
            variant="btn-success"
            busy={busy === 'excel'}
            disabled={invalid || incomplete || busy != null}
            onClick={() => run('excel', () => exportApi.transactionsExcel(params))}
          />
          <DownloadButton
            label="PDF"
            icon="bi-file-earmark-pdf"
            variant="btn-danger"
            busy={busy === 'pdf'}
            disabled={invalid || incomplete || busy != null}
            onClick={() => run('pdf', () => exportApi.transactionsPdf(params))}
          />
        </div>
        <p className="small text-body-secondary mt-2 mb-0">PDF maksimal 2.000 transaksi; untuk data lebih banyak gunakan Excel.</p>
      </div>
    </div>
  )
}

function AllDataCard() {
  const [currentYear] = useState(() => new Date().getFullYear())
  const [year, setYear] = useState(currentYear)
  const { busy, run } = useDownload()

  return (
    <div className="card h-100">
      <div className="card-body d-flex flex-column">
        <h2 className="h5">
          <i className="bi bi-collection me-2 text-success" aria-hidden="true"></i>
          Export semua ke Excel
        </h2>
        <p className="text-body-secondary small">
          Satu file Excel berisi seluruh data satu tahun, dengan angka yang sama seperti halaman laporan.
        </p>
        <div className="mb-3">
          <span className="form-label small d-block mb-1">Tahun</span>
          <Stepper
            label={year}
            onPrev={() => setYear((y) => y - 1)}
            onNext={() => setYear((y) => y + 1)}
            prevLabel="Tahun sebelumnya"
            nextLabel="Tahun berikutnya"
            disableNext={year >= currentYear}
          />
        </div>
        <div className="mb-3">
          <span className="form-label small d-block mb-1">Sheet</span>
          <div className="d-flex flex-wrap gap-1">
            {ALL_SHEETS.map((s) => (
              <span key={s} className="badge bg-body-tertiary text-body border fw-normal">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-auto">
          <DownloadButton
            label={`Export semua ${year}`}
            icon="bi-file-earmark-spreadsheet"
            variant="btn-success"
            busy={busy === 'all'}
            onClick={() => run('all', () => exportApi.allData(year))}
          />
        </div>
      </div>
    </div>
  )
}

export default function ExportPage() {
  return (
    <>
      <PageHeader title="Export & Backup" subtitle="Unduh data keuangan ke Excel atau PDF, dan kelola backup." />
      <div className="row g-3">
        <div className="col-lg-6">
          <TransactionsExportCard />
        </div>
        <div className="col-lg-6">
          <AllDataCard />
        </div>
        <div className="col-12">
          <BackupCard />
        </div>
      </div>
    </>
  )
}
