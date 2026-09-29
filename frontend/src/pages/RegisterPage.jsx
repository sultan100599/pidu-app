import { useState } from 'react'
import { useEffect } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import LanguagePicker from '../components/LanguagePicker'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getErrorMessage, getFieldErrors } from '../utils/errors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const { t, locale } = useLocale()
  useEffect(() => { document.title = `${t('Daftar')} · Pidu-App` }, [locale, t])
  const { register } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
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
    if (form.password_confirmation !== form.password) {
      errors.password_confirmation = 'Konfirmasi password tidak sama.'
    }
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
    <main className="auth-page d-flex align-items-center justify-content-center p-3">
      <div className="auth-tools position-absolute top-0 end-0 p-3">
        <LanguagePicker />
        <button
          type="button"
          className="btn btn-link text-body"
          onClick={toggleTheme}
          aria-label={t(theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap')}
        >
          <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'} fs-5`} aria-hidden="true"></i>
        </button>
      </div>

      <div className="card auth-card w-100 shadow-sm">
        <div className="card-body p-4">
          <div className="auth-heading text-center">
            <i className="bi bi-wallet2 display-5 text-primary" aria-hidden="true"></i>
            <h1 className="h4 mt-2 mb-1">{t('Daftar ke Pidu')}</h1>
            <p className="text-body-secondary mb-0">{t('Buat akun untuk mulai mencatat')}</p>
          </div>

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
              <div className="form-text">{t('Minimal 8 karakter.')}</div>
            </div>

            <div className="mb-3">
              <label htmlFor="password_confirmation" className="form-label">
                {t('Konfirmasi Password')}
              </label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type={showPassword ? 'text' : 'password'}
                className={`form-control${fieldErrors.password_confirmation ? ' is-invalid' : ''}`}
                value={form.password_confirmation}
                onChange={updateField}
                autoComplete="new-password"
              />
              {fieldErrors.password_confirmation && (
                <div className="invalid-feedback">{t(fieldErrors.password_confirmation)}</div>
              )}
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
        </div>
      </div>
    </main>
  )
}
