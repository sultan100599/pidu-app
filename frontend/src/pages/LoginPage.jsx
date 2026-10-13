import { useState } from 'react'
import { useT } from '../i18n/LocaleProvider'
import AuthFrame from '../components/AuthFrame'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage, getFieldErrors } from '../utils/errors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const t = useT()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
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
    if (!form.email.trim()) errors.email = 'Email wajib diisi.'
    else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Format email tidak valid.'
    if (!form.password) errors.password = 'Password wajib diisi.'
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
      await login(form.email.trim(), form.password)
      navigate(location.state?.from ?? '/', { replace: true })
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

  function fillDemoAccount() {
    setForm({ email: 'demo@pidu.test', password: 'password' })
    setFieldErrors({})
    setFormError('')
  }

  return (
    <AuthFrame pageTitle="Masuk" title="Pidu" subtitle="Catat pemasukan & pengeluaranmu">
      {formError && (
        <div className="alert alert-danger py-2" role="alert">
          {t(formError)}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
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
            autoFocus
          />
          {fieldErrors.email && <div className="invalid-feedback">{t(fieldErrors.email)}</div>}
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-baseline gap-2">
            <label htmlFor="password" className="form-label">
              {t('Password')}
            </label>
            <Link to="/forgot-password" className="small">{t('Lupa password?')}</Link>
          </div>
          <div className="input-group has-validation">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className={`form-control${fieldErrors.password ? ' is-invalid' : ''}`}
              value={form.password}
              onChange={updateField}
              autoComplete="current-password"
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
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
          {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
          {t('Masuk')}
        </button>
      </form>

      <p className="text-center mt-3 mb-0">
        {t('Belum punya akun?')}{' '}
        <Link to="/register" className="text-decoration-none">
          {t('Daftar')}
        </Link>
      </p>

      {import.meta.env.DEV && (
        <div className="small mt-3 p-2 rounded border bg-body d-flex align-items-center justify-content-between gap-2">
          <div>
            {t('Akun demo:')} <span className="font-monospace">demo@pidu.test</span> /{' '}
            <span className="font-monospace">password</span>
          </div>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={fillDemoAccount}>
            {t('Isi akun demo')}
          </button>
        </div>
      )}
    </AuthFrame>
  )
}
