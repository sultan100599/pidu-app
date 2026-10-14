import { useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import { toast } from '../../i18n/toast'
import * as walletsApi from '../../api/wallets'
import AmountInput from '../../components/ui/AmountInput'
import Modal from '../../components/ui/Modal'
import { WALLET_KINDS, WALLET_PURPOSES } from '../../constants/enums'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'

export default function WalletFormModal({ wallet, onClose, onSaved }) {
  const t = useT()
  const isEdit = Boolean(wallet)
  const [form, setForm] = useState(() => ({
    name: wallet?.name ?? '',
    kind: wallet?.kind ?? 'cash',
    purpose: wallet?.purpose ?? 'personal',
    opening_balance: wallet ? Number(wallet.opening_balance) : null,
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
    if (!form.name.trim()) {
      setErrors({ name: 'Nama dompet wajib diisi.' })
      return
    }
    const payload = { ...form, name: form.name.trim(), opening_balance: form.opening_balance ?? 0 }
    setSubmitting(true)
    setFormError('')
    try {
      const response = isEdit ? await walletsApi.update(wallet.id, payload) : await walletsApi.create(payload)
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
      <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={submitting}>
        {t('Batal')}
      </button>
      <button type="submit" form="wallet-form" className="btn btn-primary" disabled={submitting}>
        {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
        {t('Simpan')}
      </button>
    </>
  )

  return (
    <Modal show onClose={onClose} title={isEdit ? 'Ubah dompet' : 'Tambah dompet'} footer={footer} busy={submitting}>
      {formError && <div className="alert alert-danger py-2" role="alert">{t(formError)}</div>}
      <form id="wallet-form" onSubmit={submit} noValidate>
        <div className="mb-3">
          <label htmlFor="wallet-name" className="form-label">{t('Nama')}</label>
          <input
            id="wallet-name"
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            maxLength={50}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder={t('mis. BRI, DANA, Kas Warung')}
          />
          {errors.name && <div className="invalid-feedback">{t(errors.name)}</div>}
        </div>

        <fieldset className="mb-3">
          <legend className="form-label fs-6">{t('Jenis')}</legend>
          <div className="wallet-choice">
            {Object.entries(WALLET_KINDS).map(([value, kind]) => (
              <label key={value} className={`wallet-choice-item${form.kind === value ? ' active' : ''}`}>
                <input type="radio" name="wallet-kind" className="visually-hidden" value={value} checked={form.kind === value} onChange={() => setField('kind', value)} />
                <i className={`bi ${kind.icon}`} aria-hidden="true"></i>
                <span>{t(kind.label)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mb-3">
          <legend className="form-label fs-6">{t('Dipakai untuk')}</legend>
          <div className="wallet-choice">
            {Object.entries(WALLET_PURPOSES).map(([value, label]) => (
              <label key={value} className={`wallet-choice-item${form.purpose === value ? ' active' : ''}`}>
                <input type="radio" name="wallet-purpose" className="visually-hidden" value={value} checked={form.purpose === value} onChange={() => setField('purpose', value)} />
                <i className={`bi ${value === 'business' ? 'bi-shop' : 'bi-person'}`} aria-hidden="true"></i>
                <span>{t(label)}</span>
              </label>
            ))}
          </div>
          <div className="form-text">{t('Pisahkan uang usaha dari uang pribadi supaya untung usaha kelihatan jelas.')}</div>
        </fieldset>

        <div>
          <label htmlFor="wallet-opening" className="form-label">
            {t('Saldo awal')} <span className="text-body-secondary small">{t('(opsional)')}</span>
          </label>
          <AmountInput
            id="wallet-opening"
            value={form.opening_balance}
            onChange={(value) => setField('opening_balance', value)}
            invalid={Boolean(errors.opening_balance)}
          />
          {errors.opening_balance && <div className="invalid-feedback d-block">{t(errors.opening_balance)}</div>}
          <div className="form-text">{t('Isi uang di dompet ini sebelum mulai dicatat di Pidu.')}</div>
        </div>
      </form>
    </Modal>
  )
}
