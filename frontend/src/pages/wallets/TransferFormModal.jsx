import { useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import { toast } from '../../i18n/toast'
import * as walletsApi from '../../api/wallets'
import AmountInput from '../../components/ui/AmountInput'
import Modal from '../../components/ui/Modal'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import { formatRupiah, toYmd } from '../../utils/format'

function WalletSelect({ id, label, value, onChange, wallets, error }) {
  const t = useT()
  return (
    <div className="col-12 col-sm-6">
      <label htmlFor={id} className="form-label">{t(label)}</label>
      <select id={id} className={`form-select ${error ? 'is-invalid' : ''}`} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('Pilih dompet')}</option>
        {wallets.map((w) => (
          <option key={w.id} value={w.id}>{w.name} ({formatRupiah(w.balance)})</option>
        ))}
      </select>
      {error && <div className="invalid-feedback">{t(error)}</div>}
    </div>
  )
}

// Pindah uang antar-dompet (tarik tunai, setor ke rekening, ambil uang usaha untuk pribadi).
export default function TransferFormModal({ wallets, from, onClose, onSaved }) {
  const t = useT()
  const [form, setForm] = useState(() => ({
    from_wallet_id: from ? String(from) : '',
    to_wallet_id: '',
    amount: null,
    transfer_date: toYmd(new Date()),
    description: '',
  }))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting) return
    const clientErrors = {}
    if (!form.from_wallet_id) clientErrors.from_wallet_id = 'Pilih dompet asal.'
    if (!form.to_wallet_id) clientErrors.to_wallet_id = 'Pilih dompet tujuan.'
    else if (form.to_wallet_id === form.from_wallet_id) clientErrors.to_wallet_id = 'Dompet asal dan tujuan harus berbeda.'
    if (!(form.amount > 0)) clientErrors.amount = 'Nominal harus lebih dari 0.'
    if (!form.transfer_date) clientErrors.transfer_date = 'Tanggal wajib diisi.'
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const response = await walletsApi.createTransfer({
        ...form,
        from_wallet_id: Number(form.from_wallet_id),
        to_wallet_id: Number(form.to_wallet_id),
        description: form.description.trim() || null,
      })
      toast.success(response.data.message)
      onSaved()
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
      <button type="submit" form="transfer-form" className="btn btn-primary" disabled={submitting}>
        {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
        {t('Pindahkan')}
      </button>
    </>
  )

  return (
    <Modal show onClose={onClose} title="Pindah uang" footer={footer} busy={submitting} initialFocus={from ? '#transfer-to' : undefined}>
      {formError && <div className="alert alert-danger py-2" role="alert">{t(formError)}</div>}
      <p className="small text-body-secondary">{t('Misalnya tarik tunai dari ATM, isi saldo e-wallet, atau ambil uang usaha untuk keperluan rumah. Tidak dihitung sebagai pemasukan atau pengeluaran.')}</p>
      <form id="transfer-form" onSubmit={submit} noValidate>
        <div className="row g-3 mb-3">
          <WalletSelect id="transfer-from" label="Dari" value={form.from_wallet_id} onChange={(v) => setField('from_wallet_id', v)} wallets={wallets} error={errors.from_wallet_id} />
          <WalletSelect id="transfer-to" label="Ke" value={form.to_wallet_id} onChange={(v) => setField('to_wallet_id', v)} wallets={wallets.filter((w) => String(w.id) !== form.from_wallet_id)} error={errors.to_wallet_id} />
        </div>
        <div className="mb-3">
          <label htmlFor="transfer-amount" className="form-label">{t('Nominal')}</label>
          <AmountInput id="transfer-amount" className="amount-input-lg" value={form.amount} onChange={(v) => setField('amount', v)} invalid={Boolean(errors.amount)} allowDecimals={false} />
          {errors.amount && <div className="invalid-feedback d-block">{t(errors.amount)}</div>}
        </div>
        <div className="row g-3">
          <div className="col-12 col-sm-5">
            <label htmlFor="transfer-date" className="form-label">{t('Tanggal')}</label>
            <input id="transfer-date" type="date" className={`form-control ${errors.transfer_date ? 'is-invalid' : ''}`} value={form.transfer_date} onChange={(e) => setField('transfer_date', e.target.value)} />
            {errors.transfer_date && <div className="invalid-feedback">{t(errors.transfer_date)}</div>}
          </div>
          <div className="col-12 col-sm-7">
            <label htmlFor="transfer-description" className="form-label">
              {t('Catatan')} <span className="text-body-secondary small">{t('(opsional)')}</span>
            </label>
            <input id="transfer-description" className="form-control" maxLength={255} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder={t('mis. Tarik tunai')} />
          </div>
        </div>
      </form>
    </Modal>
  )
}
