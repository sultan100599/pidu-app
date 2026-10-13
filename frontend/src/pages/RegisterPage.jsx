import { useState } from 'react'
import { useT } from '../i18n/LocaleProvider'
import AuthFrame from '../components/AuthFrame'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage, getFieldErrors } from '../utils/errors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const t = useT()
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Nama wajib diisi.'
    if (!form.email.trim()) errors.email = 'Email wajib diisi.'
    else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Format email tidak valid.'
    if (!form.password) errors.password = 'Password wajib diisi.'
    else if (form.password.length < 8) errors.password = 'Password minimal 8 karakter.'
    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormError('')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() })
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(getFieldErrors(err))
      } else {
        setFormError(getErrorMessage(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFrame pageTitle="Daftar" title="Daftar ke Pidu" subtitle="Buat akun untuk mulai mencatat">
      {formError && (
        <div className="alert alert-danger py-2" role="alert">
          {t(formError)}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            {t('Nama')}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={`form-control${fieldErrors.name ? ' is-invalid' : ''}`}
            value={form.name}
            onChange={updateField}
            autoComplete="name"
            autoFocus
          />
          {fieldErrors.name && <div className="invalid-feedback">{t(fieldErrors.name)}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            {t('Email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={`form-control${fieldErrors.email ? ' is-invalid' : ''}`}
            value={form.email}
            onChange={updateField}
            autoComplete="email"
          />
          {fieldErrors.email && <div className="invalid-feedback">{t(fieldErrors.email)}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            {t('Password')}
          </label>
          <div className="input-group has-validation">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className={`form-control${fieldErrors.password ? ' is-invalid' : ''}`}
              value={form.password}
              onChange={updateField}
              autoComplete="new-password"
              aria-describedby="register-password-hint"
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={t(showPassword ? 'Sembunyikan password' : 'Tampilkan password')}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true"></i>
            </button>
            {fieldErrors.password && (
              <div className="invalid-feedback">{t(fieldErrors.password)}</div>
            )}
          </div>
          {!fieldErrors.password && <div id="register-password-hint" className="form-text">{t('Minimal 8 karakter.')}</div>}
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
          {submitting && (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          )}
          {t('Daftar')}
        </button>
      </form>

      <p className="text-center mt-3 mb-0">
        {t('Sudah punya akun?')}{' '}
        <Link to="/login" className="text-decoration-none">
          {t('Masuk')}
        </Link>
      </p>
    </AuthFrame>
  )
}
