import { useState } from 'react'
import { toast } from 'react-toastify'
import * as categoriesApi from '../../api/categories'
import CategoryBadge from '../../components/CategoryBadge'
import Modal from '../../components/ui/Modal'
import { TRANSACTION_TYPES } from '../../constants/enums'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import ColorPicker, { CATEGORY_COLORS } from './ColorPicker'
import IconPicker from './IconPicker'

// Form tambah/edit kategori. Dipasang ulang (key) setiap kali dibuka.
export default function CategoryFormModal({ show, category, defaultType, onClose, onSaved }) {
  const isEdit = Boolean(category)
  const typeLocked = isEdit && category.transactions_count > 0
  const [form, setForm] = useState(() => ({
    name: category?.name ?? '',
    type: category?.type ?? defaultType,
    icon: category?.icon ?? 'bi-tag',
    color: category?.color ?? CATEGORY_COLORS[6],
  }))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    const name = form.name.trim()
    if (!name) {
      setErrors({ name: 'Nama wajib diisi.' })
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      const payload = { ...form, name }
      const response = isEdit
        ? await categoriesApi.update(category.id, payload)
        : await categoriesApi.create(payload)
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
        Batal
      </button>
      <button type="submit" form="category-form" className="btn btn-primary" disabled={submitting}>
        {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
        Simpan
      </button>
    </>
  )

  return (
    <Modal show={show} onClose={close} title={isEdit ? 'Edit Kategori' : 'Tambah Kategori'} footer={footer} busy={submitting}>
      {formError && (
        <div className="alert alert-danger py-2" role="alert">
          {formError}
        </div>
      )}
      <form id="category-form" noValidate onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="cat-name" className="form-label">
            Nama
          </label>
          <input
            id="cat-name"
            type="text"
            maxLength={100}
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <fieldset className="mb-3" disabled={typeLocked}>
          <legend className="form-label fs-6 mb-2">Jenis</legend>
          <div className="d-flex gap-3">
            {Object.entries(TRANSACTION_TYPES).map(([value, label]) => (
              <div className="form-check" key={value}>
                <input
                  className={`form-check-input ${errors.type ? 'is-invalid' : ''}`}
                  type="radio"
                  name="cat-type"
                  id={`cat-type-${value}`}
                  value={value}
                  checked={form.type === value}
                  onChange={() => setField('type', value)}
                />
                <label className="form-check-label" htmlFor={`cat-type-${value}`}>
                  {label}
                </label>
              </div>
            ))}
          </div>
          {typeLocked && (
            <div className="form-text">
              Jenis tidak bisa diubah karena kategori sudah dipakai {category.transactions_count} transaksi.
            </div>
          )}
          {errors.type && <div className="text-danger small mt-1">{errors.type}</div>}
        </fieldset>

        <div className="mb-3">
          <span className="form-label d-block">Ikon</span>
          <IconPicker value={form.icon} color={form.color} onChange={(icon) => setField('icon', icon)} />
          {errors.icon && <div className="text-danger small mt-1">{errors.icon}</div>}
        </div>

        <div className="mb-3">
          <span className="form-label d-block">Warna</span>
          <ColorPicker value={form.color} onChange={(color) => setField('color', color)} />
          {errors.color && <div className="text-danger small mt-1">{errors.color}</div>}
        </div>

        <div>
          <span className="form-label d-block small text-body-secondary">Pratinjau</span>
          <CategoryBadge category={{ name: form.name.trim() || 'Nama kategori', icon: form.icon, color: form.color }} />
        </div>
      </form>
    </Modal>
  )
}
