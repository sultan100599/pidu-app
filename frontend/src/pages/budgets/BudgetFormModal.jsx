import { useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import { Link } from 'react-router-dom'
import { toast } from '../../i18n/toast'
import * as budgetsApi from '../../api/budgets'
import CategoryBadge from '../../components/CategoryBadge'
import AmountInput from '../../components/ui/AmountInput'
import Modal from '../../components/ui/Modal'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import { MONTH_NAMES } from '../../utils/format'

// Tambah / edit budget. Dipasang ulang (key) setiap dibuka.
// - tambah: pilih kategori pengeluaran aktif; kategori yang sudah punya budget di bulan terpilih → disabled
// - edit: kategori tidak bisa diganti (API hanya menerima amount/month/year)
export default function BudgetFormModal({ show, budget, defaultMonth, defaultYear, categories, existing, onClose, onSaved }) {
  const t = useT()
  const isEdit = Boolean(budget)
  const [form, setForm] = useState(() => ({
    category_id: budget ? String(budget.category.id) : '',
    month: budget?.month ?? defaultMonth,
    year: budget?.year ?? defaultYear,
    amount: budget?.amount ?? null,
  }))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const expenseCategories = categories.filter((c) => c.type === 'expense' && c.is_active)
  // `existing` = budget bulan yang sedang dilihat; hanya relevan bila bulan form = bulan itu.
  const sameMonth = form.month === defaultMonth && form.year === defaultYear
  const taken = new Set(sameMonth ? existing.map((b) => b.category.id) : [])

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function close() {
    if (!submitting) onClose()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    const clientErrors = {}
    if (!isEdit && !form.category_id) clientErrors.category_id = 'Kategori wajib dipilih.'
    if (!(form.amount > 0)) clientErrors.amount = 'Nominal harus lebih dari 0.'
    if (!(form.year >= 2000 && form.year <= 2100)) clientErrors.year = 'Tahun harus antara 2000 dan 2100.'
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      const payload = { amount: form.amount, month: Number(form.month), year: Number(form.year) }
      const response = isEdit
        ? await budgetsApi.update(budget.id, payload)
        : await budgetsApi.create({ ...payload, category_id: Number(form.category_id) })
      toast.success(response.data.message)
      onSaved(response.data.data)
      onClose()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(getFieldErrors(err))
      } else {
        setFormError(getErrorMessage(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const footer = (
    <>
      <button type="button" className="btn btn-outline-secondary" onClick={close} disabled={submitting}>
        {t('Batal')}
      </button>
      <button type="submit" form="budget-form" className="btn btn-primary" disabled={submitting}>
        {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
        {t('Simpan')}
      </button>
    </>
  )

  return (
    <Modal show={show} onClose={close} title={isEdit ? 'Edit Budget' : 'Tambah Budget'} footer={footer} busy={submitting}>
      {formError && (
        <div className="alert alert-danger py-2" role="alert">
          {t(formError)}
        </div>
      )}
      <form id="budget-form" noValidate onSubmit={handleSubmit}>
        <div className="mb-3">
          {isEdit ? (
            <>
              <span className="form-label d-block">{t('Kategori')}</span>
              <CategoryBadge category={budget.category} />
            </>
          ) : (
            <>
              <label htmlFor="budget-category" className="form-label">
                {t('Kategori pengeluaran')}
              </label>
              <select
                id="budget-category"
                className={`form-select ${errors.category_id ? 'is-invalid' : ''}`}
                value={form.category_id}
                onChange={(e) => setField('category_id', e.target.value)}
              >
                <option value="">{t('Pilih kategori')}</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id} disabled={taken.has(c.id)}>
                    {c.name}
                    {taken.has(c.id) ? ' ' + t('(sudah ada)') : ''}
                  </option>
                ))}
              </select>
              {errors.category_id && <div className="invalid-feedback">{t(errors.category_id)}</div>}
              {expenseCategories.length === 0 && (
                <div className="form-text">
                  {t('Belum ada kategori pengeluaran aktif.')} <Link to="/categories">{t('Kelola kategori')}</Link>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="budget-amount" className="form-label">
            {t('Batas pengeluaran')}
          </label>
          <AmountInput
            id="budget-amount"
            value={form.amount}
            onChange={(value) => setField('amount', value)}
            invalid={Boolean(errors.amount)}
          />
          {errors.amount && <div className="invalid-feedback d-block">{t(errors.amount)}</div>}
        </div>

        <p className="form-text mb-0">
          {t('Berlaku untuk {period}. Ganti bulan lewat tombol panah di halaman Budget.', { period: `${MONTH_NAMES[form.month - 1]} ${form.year}` })}
        </p>
      </form>
    </Modal>
  )
}
