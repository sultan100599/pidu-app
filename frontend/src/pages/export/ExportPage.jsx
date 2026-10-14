import { useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import { Link } from 'react-router-dom'
import { toast } from '../../i18n/toast'
import * as exportApi from '../../api/export'
import PageHeader from '../../components/PageHeader'
import BackupCard from './BackupCard'
import Stepper from '../../components/ui/Stepper'
import { TRANSACTION_TYPES } from '../../constants/enums'
import { getErrorMessage } from '../../utils/errors'
import { getPeriodRange, isCustomRangeInvalid, PERIOD_PRESETS } from '../../utils/period'

const ALL_SHEETS = ['Transaksi', 'Harian', 'Mingguan', 'Bulanan', 'Tahunan', 'Kategori', 'Anggaran']

function useDownload() {
  const t = useT()
  const [busy, setBusy] = useState(null)

  async function run(key, fn) {
    setBusy(key)
    try {
      const filename = await fn()
      toast.success(t('{filename} diunduh.', { filename }))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return { busy, run }
}

function DownloadButton({ label, icon, variant, busy, disabled, onClick }) {
  const t = useT()
  return (
    <button type="button" className={`btn ${variant}`} onClick={onClick} disabled={disabled || busy}>
      {busy ? (
        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
      ) : (
        <i className={`bi ${icon} me-2`} aria-hidden="true"></i>
      )}
      {t(label)}
    </button>
  )
}


// Satu kartu untuk mengunduh data: daftar transaksi per periode (Excel/PDF)
// atau laporan lengkap satu tahun (Excel berisi semua rekap).
function DownloadCard() {
  const t = useT()
  const [kind, setKind] = useState('transactions')
  const [period, setPeriod] = useState('this_month')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [type, setType] = useState('')
  const [currentYear] = useState(() => new Date().getFullYear())
  const [year, setYear] = useState(currentYear)
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

  const choice = (value, label, hint) => (
    <div className="form-check export-choice">
      <input className="form-check-input" type="radio" name="export-kind" id={`export-${value}`} value={value}
        checked={kind === value} onChange={() => setKind(value)} />
      <label className="form-check-label" htmlFor={`export-${value}`}>
        <span className="fw-semibold d-block">{t(label)}</span>
        <span className="small text-body-secondary">{t(hint)}</span>
      </label>
    </div>
  )

  return (
    <section className="card h-100" aria-labelledby="export-title">
      <div className="card-body d-flex flex-column">
        <h2 id="export-title" className="h5">
          <i className="bi bi-download me-2 text-primary" aria-hidden="true"></i>
          {t('Unduh data')}
        </h2>
        <fieldset className="mb-3">
          <legend className="visually-hidden">{t('Pilih isi file')}</legend>
          {choice('transactions', 'Daftar transaksi', 'Satu periode, beserta total pemasukan, pengeluaran, dan selisih.')}
          {choice('year', 'Laporan lengkap satu tahun', 'Excel berisi transaksi, rekap harian sampai tahunan, kategori, dan anggaran.')}
        </fieldset>

        {kind === 'transactions' ? (
          <>
            <div className="row g-2 mb-3">
              <div className="col-sm-6">
                <label htmlFor="exp-period" className="form-label small mb-1">{t('Periode')}</label>
                <select id="exp-period" className="form-select" value={period} onChange={(e) => changePeriod(e.target.value)}>
                  {PERIOD_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>{t(p.label)}</option>
                  ))}
                </select>
              </div>
              <div className="col-sm-6">
                <label htmlFor="exp-type" className="form-label small mb-1">{t('Jenis')}</label>
                <select id="exp-type" className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">{t('Semua')}</option>
                  {Object.entries(TRANSACTION_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>{t(label)}</option>
                  ))}
                </select>
              </div>
              {period === 'custom' && (
                <>
                  <div className="col-6">
                    <label htmlFor="exp-start" className="form-label small mb-1">{t('Dari')}</label>
                    <input id="exp-start" type="date" className={`form-control ${invalid ? 'is-invalid' : ''}`} value={start} onChange={(e) => setStart(e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label htmlFor="exp-end" className="form-label small mb-1">{t('Sampai')}</label>
                    <input id="exp-end" type="date" className={`form-control ${invalid ? 'is-invalid' : ''}`} value={end} onChange={(e) => setEnd(e.target.value)} />
                  </div>
                  {invalid && (
                    <div className="col-12">
                      <p className="text-danger small mb-0" role="alert">{t('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.')}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="d-flex flex-wrap gap-2 mt-auto">
              <DownloadButton label="Unduh Excel" icon="bi-file-earmark-spreadsheet" variant="btn-primary"
                busy={busy === 'excel'} disabled={invalid || incomplete || busy != null}
                onClick={() => run('excel', () => exportApi.transactionsExcel(params))} />
              <DownloadButton label="Unduh PDF" icon="bi-file-earmark-pdf" variant="btn-outline-secondary"
                busy={busy === 'pdf'} disabled={invalid || incomplete || busy != null}
                onClick={() => run('pdf', () => exportApi.transactionsPdf(params))} />
            </div>
            <p className="small text-body-secondary mt-2 mb-0">
              {t('Perlu filter kategori atau metode? Pakai tombol Unduh di halaman Transaksi.')} <Link to="/transactions">{t('Buka Transaksi')}</Link>
            </p>
          </>
        ) : (
          <>
            <div className="mb-3">
              <span className="form-label small d-block mb-1">{t('Tahun')}</span>
              <Stepper label={year} onPrev={() => setYear((y) => y - 1)} onNext={() => setYear((y) => y + 1)}
                prevLabel="Tahun sebelumnya" nextLabel="Tahun berikutnya" disableNext={year >= currentYear} />
            </div>
            <p className="small text-body-secondary">
              {t('Isi file: {sheets}.', { sheets: ALL_SHEETS.map((sheet) => t(sheet)).join(', ') })}
            </p>
            <div className="mt-auto">
              <DownloadButton label={t('Unduh laporan {year}', { year })} icon="bi-file-earmark-spreadsheet" variant="btn-primary"
                busy={busy === 'all'} onClick={() => run('all', () => exportApi.allData(year))} />
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default function ExportPage() {
  return (
    <>
      <PageHeader title="Unduh & Cadangan" subtitle="Unduh data ke Excel atau PDF, dan simpan cadangan." />
      <div className="row g-3">
        <div className="col-lg-6">
          <DownloadCard />
        </div>
        <div className="col-lg-6">
          <BackupCard />
        </div>
      </div>
    </>
  )
}
