import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../../i18n/LocaleProvider'
import { toast } from '../../i18n/toast'
import * as recurringApi from '../../api/recurring'
import AmountInput from '../../components/ui/AmountInput'
import Modal from '../../components/ui/Modal'
import { FREQUENCIES } from '../../constants/enums'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import { toYmd } from '../../utils/format'
import { scheduleText } from './schedule'

export default function RecurringFormModal({ rule, categories, wallets, onClose, onSaved }) {
  const t = useT()
  const isEdit = Boolean(rule)
  const activeWallets = wallets.filter((w) => w.is_active)
  const [form, setForm] = useState(() => ({
    type: rule?.type ?? 'expense',
    amount: rule ? Number(rule.amount) : null,
    category_id: String(rule?.category?.id ?? ''),
    wallet_id: String(rule?.wallet?.id ?? activeWallets[0]?.id ?? ''),
    description: rule?.description ?? '',
    frequency: rule?.frequency ?? 'monthly',
    start_date: rule?.start_date ?? toYmd(new Date()),
  }))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const categoryOptions = categories.filter((c) => c.type === form.type && (c.is_active || c.id === rule?.category?.id))
  const walletOptions = wallets.filter((w) => w.is_active || w.id === rule?.wallet?.id)

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function changeType(type) {
    setForm((prev) => {
      const current = categories.find((c) => String(c.id) === prev.category_id)
      return { ...prev, type, category_id: current && current.type === type ? prev.category_id : '' }
    })
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting) return
    const clientErrors = {}
    if (!(form.amount > 0)) clientErrors.amount = 'Nominal harus lebih dari 0.'
    if (!form.category_id) clientErrors.category_id = 'Kategori wajib dipilih.'
    if (!isEdit && !form.start_date) clientErrors.start_date = 'Tanggal wajib diisi.'
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }
    const payload = {
      type: form.type,
      amount: form.amount,
      category_id: Number(form.category_id),
      wallet_id: form.wallet_id ? Number(form.wallet_id) : null,
      description: form.description.trim() || null,
    }
    if (!isEdit) Object.assign(payload, { frequency: form.frequency, start_date: form.start_date })
    setSubmitting(true)
    setFormError('')
    try {
      const response = isEdit ? await recurringApi.update(rule.id, payload) : await recurringApi.create(payload)
      toast.success(response.data.message)
      onSaved(response.data.created > 0)
      onClose()
    } catch (err) {
      if (err.response?.status === 422) setErrors(getFieldErrors(err))
      else setFormError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const footer = (
    <>
      <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={submitting}>{t('Batal')}</button>
      <button type="submit" form="recurring-form" className="btn btn-primary" disabled={submitting}>
        {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
        {t('Simpan')}
      </button>
    </>
  )

  return (
    <Modal show onClose={onClose} title={isEdit ? 'Ubah transaksi rutin' : 'Tambah transaksi rutin'} footer={footer} busy={submitting} initialFocus="#recurring-amount">
      {formError && <div className="alert alert-danger py-2" role="alert">{t(formError)}</div>}
      <form id="recurring-form" onSubmit={submit} noValidate>
        <div className="mb-3">
          <span className="form-label d-block" id="recurring-type-label">{t('Jenis')}</span>
          <div className="btn-group w-100" role="group" aria-labelledby="recurring-type-label">
            <button type="button" className={`btn ${form.type === 'expense' ? 'btn-danger' : 'btn-outline-danger'}`} aria-pressed={form.type === 'expense'} onClick={() => changeType('expense')}>
              <i className="bi bi-arrow-up-circle me-1" aria-hidden="true"></i>{t('Pengeluaran')}
            </button>
            <button type="button" className={`btn ${form.type === 'income' ? 'btn-success' : 'btn-outline-success'}`} aria-pressed={form.type === 'income'} onClick={() => changeType('income')}>
              <i className="bi bi-arrow-down-circle me-1" aria-hidden="true"></i>{t('Pemasukan')}
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="recurring-amount" className="form-label">{t('Nominal')}</label>
          <AmountInput id="recurring-amount" className="amount-input-lg" value={form.amount} onChange={(v) => setField('amount', v)} invalid={Boolean(errors.amount)} allowDecimals={false} />
          {errors.amount && <div className="invalid-feedback d-block">{t(errors.amount)}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="recurring-category" className="form-label">{t('Kategori')}</label>
          <select id="recurring-category" className={`form-select ${errors.category_id ? 'is-invalid' : ''}`} value={form.category_id} onChange={(e) => setField('category_id', e.target.value)}>
            <option value="">{t('Pilih kategori')}</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.is_active ? '' : ' ' + t('(disembunyikan)')}</option>
            ))}
          </select>
          {errors.category_id && <div className="invalid-feedback">{t(errors.category_id)}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="recurring-description" className="form-label">
            {t('Deskripsi')} <span className="text-body-secondary small">{t('(opsional)')}</span>
          </label>
          <input id="recurring-description" className="form-control" maxLength={255} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder={t('mis. Listrik PLN')} />
        </div>

        {walletOptions.length > 1 && (
          <div className="mb-3">
            <label htmlFor="recurring-wallet" className="form-label">{t('Dompet')}</label>
            <select id="recurring-wallet" className={`form-select ${errors.wallet_id ? 'is-invalid' : ''}`} value={form.wallet_id} onChange={(e) => setField('wallet_id', e.target.value)}>
              {walletOptions.map((w) => (
                <option key={w.id} value={w.id}>{w.name}{w.is_active ? '' : ' ' + t('(diarsipkan)')}</option>
              ))}
            </select>
            {errors.wallet_id && <div className="invalid-feedback">{t(errors.wallet_id)}</div>}
          </div>
        )}

        {isEdit ? (
          <p className="small text-body-secondary mb-0">
            {t('Jadwal: {schedule}.', { schedule: scheduleText(t, rule) })} {t('Untuk mengganti jadwal, hapus lalu buat yang baru.')}
          </p>
        ) : (
          <div className="row g-3">
            <div className="col-sm-6">
              <label htmlFor="recurring-frequency" className="form-label">{t('Ulangi')}</label>
              <select id="recurring-frequency" className="form-select" value={form.frequency} onChange={(e) => setField('frequency', e.target.value)}>
                {Object.entries(FREQUENCIES).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
              </select>
            </div>
            <div className="col-sm-6">
              <label htmlFor="recurring-start" className="form-label">{t('Mulai tanggal')}</label>
              <input id="recurring-start" type="date" className={`form-control ${errors.start_date ? 'is-invalid' : ''}`} value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} aria-describedby="recurring-start-help" />
              {errors.start_date && <div className="invalid-feedback">{t(errors.start_date)}</div>}
            </div>
            <div id="recurring-start-help" className="col-12 form-text mt-1">
              {t('{schedule}. Kalau tanggal mulai sudah lewat, transaksi yang terlewat langsung dicatat.', { schedule: scheduleText(t, form) })}
            </div>
          </div>
        )}
        {!isEdit && categoryOptions.length === 0 && (
          <div className="form-text">{t('Belum ada kategori aktif untuk jenis ini.')} <Link to="/categories" onClick={onClose}>{t('Kelola kategori')}</Link></div>
        )}
      </form>
    </Modal>
  )
}
