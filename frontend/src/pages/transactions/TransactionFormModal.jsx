import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import * as transactionsApi from '../../api/transactions'
import AmountInput from '../../components/ui/AmountInput'
import Modal from '../../components/ui/Modal'
import { PAYMENT_METHODS } from '../../constants/enums'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import { toYmd } from '../../utils/format'

function initialForm(transaction) {
  if (transaction) {
    return {
      type: transaction.type,
      transaction_date: transaction.transaction_date,
      category_id: String(transaction.category?.id ?? ''),
      amount: transaction.amount,
      payment_method: transaction.payment_method,
      description: transaction.description ?? '',
      notes: transaction.notes ?? '',
    }
  }
  return {
    type: 'expense',
    transaction_date: toYmd(new Date()),
    category_id: '',
    amount: null,
    payment_method: 'cash',
    description: '',
    notes: '',
  }
}

function validate(form) {
  const errors = {}
  if (!form.transaction_date) errors.transaction_date = 'Tanggal wajib diisi.'
  if (!form.category_id) errors.category_id = 'Kategori wajib dipilih.'
  if (form.amount == null || !(form.amount > 0)) errors.amount = 'Nominal harus lebih dari 0.'
  return errors
}

// Form tambah/edit transaksi. Dipasang ulang (key) setiap kali dibuka,
// jadi state awal cukup dihitung sekali dari `transaction`.
export default function TransactionFormModal({ show, transaction, categories, onClose, onSaved }) {
  const isEdit = Boolean(transaction)
  const [form, setForm] = useState(() => initialForm(transaction))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const originalCategoryId = transaction?.category?.id
  // Kategori aktif sesuai jenis; kategori lama yang sudah nonaktif tetap boleh saat edit.
  const options = categories.filter(
    (c) => c.type === form.type && (c.is_active || c.id === originalCategoryId),
  )

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function changeType(type) {
    setForm((prev) => {
      const current = categories.find((c) => String(c.id) === prev.category_id)
      return { ...prev, type, category_id: current && current.type === type ? prev.category_id : '' }
    })
    setErrors((prev) => ({ ...prev, type: '', category_id: '' }))
  }

  function close() {
    if (!submitting) onClose()
  }

  async function submit(addAnother) {
    if (submitting) return
    const clientErrors = validate(form)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    const payload = {
      transaction_date: form.transaction_date,
      type: form.type,
      category_id: Number(form.category_id),
      amount: form.amount,
      payment_method: form.payment_method,
      description: form.description.trim() || null,
      notes: form.notes.trim() || null,
    }

    setSubmitting(true)
    setFormError('')
    try {
      const response = isEdit
        ? await transactionsApi.update(transaction.id, payload)
        : await transactionsApi.create(payload)
      toast.success(response.data.message)
      onSaved()
      if (addAnother) {
        setForm((prev) => ({
          ...initialForm(null),
          type: prev.type,
          transaction_date: prev.transaction_date,
          payment_method: prev.payment_method,
        }))
        setErrors({})
      } else {
        onClose()
      }
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
        Batal
      </button>
      {!isEdit && (
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => submit(true)}
          disabled={submitting}
        >
          Simpan & tambah lagi
        </button>
      )}
      <button type="submit" form="transaction-form" className="btn btn-primary" disabled={submitting}>
        {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
        Simpan
      </button>
    </>
  )

  return (
    <Modal
      show={show}
      onClose={close}
      title={isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
      footer={footer}
      busy={submitting}
    >
      {formError && (
        <div className="alert alert-danger py-2" role="alert">
          {formError}
        </div>
      )}

      <form
        id="transaction-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit(false)
        }}
      >
        <div className="mb-3">
          <span className="form-label d-block" id="trx-type-label">
            Jenis
          </span>
          <div className="btn-group w-100" role="group" aria-labelledby="trx-type-label">
            <button
              type="button"
              className={`btn ${form.type === 'expense' ? 'btn-danger' : 'btn-outline-danger'}`}
              aria-pressed={form.type === 'expense'}
              onClick={() => changeType('expense')}
            >
              <i className="bi bi-arrow-up-circle me-1" aria-hidden="true"></i>
              Pengeluaran
            </button>
            <button
              type="button"
              className={`btn ${form.type === 'income' ? 'btn-success' : 'btn-outline-success'}`}
              aria-pressed={form.type === 'income'}
              onClick={() => changeType('income')}
            >
              <i className="bi bi-arrow-down-circle me-1" aria-hidden="true"></i>
              Pemasukan
            </button>
          </div>
          {errors.type && <div className="text-danger small mt-1">{errors.type}</div>}
        </div>

        <div className="row g-3 mb-3">
          <div className="col-sm-6">
            <label htmlFor="trx-date" className="form-label">
              Tanggal
            </label>
            <input
              type="date"
              id="trx-date"
              className={`form-control ${errors.transaction_date ? 'is-invalid' : ''}`}
              value={form.transaction_date}
              onChange={(e) => setField('transaction_date', e.target.value)}
            />
            {errors.transaction_date && <div className="invalid-feedback">{errors.transaction_date}</div>}
          </div>
          <div className="col-sm-6">
            <label htmlFor="trx-amount" className="form-label">
              Nominal
            </label>
            <AmountInput
              id="trx-amount"
              value={form.amount}
              onChange={(value) => setField('amount', value)}
              invalid={Boolean(errors.amount)}
            />
            {errors.amount && <div className="invalid-feedback d-block">{errors.amount}</div>}
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="trx-category" className="form-label">
            Kategori
          </label>
          <select
            id="trx-category"
            className={`form-select ${errors.category_id ? 'is-invalid' : ''}`}
            value={form.category_id}
            onChange={(e) => setField('category_id', e.target.value)}
          >
            <option value="">Pilih kategori</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.is_active ? '' : ' (nonaktif)'}
              </option>
            ))}
          </select>
          {errors.category_id && <div className="invalid-feedback">{errors.category_id}</div>}
          {options.length === 0 && (
            <div className="form-text">
              Belum ada kategori aktif untuk jenis ini. <Link to="/categories">Kelola kategori</Link>
            </div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="trx-payment" className="form-label">
            Metode pembayaran
          </label>
          <select
            id="trx-payment"
            className={`form-select ${errors.payment_method ? 'is-invalid' : ''}`}
            value={form.payment_method}
            onChange={(e) => setField('payment_method', e.target.value)}
          >
            {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.payment_method && <div className="invalid-feedback">{errors.payment_method}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="trx-description" className="form-label">
            Deskripsi <span className="text-body-secondary small">(opsional)</span>
          </label>
          <input
            type="text"
            id="trx-description"
            maxLength={255}
            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="mis. Makan siang"
          />
          {errors.description && <div className="invalid-feedback">{errors.description}</div>}
        </div>

        <div>
          <label htmlFor="trx-notes" className="form-label">
            Catatan <span className="text-body-secondary small">(opsional)</span>
          </label>
          <textarea
            id="trx-notes"
            rows={2}
            maxLength={5000}
            className={`form-control ${errors.notes ? 'is-invalid' : ''}`}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
          ></textarea>
          {errors.notes && <div className="invalid-feedback">{errors.notes}</div>}
        </div>
      </form>
    </Modal>
  )
}
