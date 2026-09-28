import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getErrorMessage, getFieldErrors } from '../utils/errors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
    <div className="auth-page d-flex align-items-center justify-content-center p-3">
      <div className="position-absolute top-0 end-0 p-3">
        <button
          type="button"
          className="btn btn-link text-body"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
        >
          <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'} fs-5`} aria-hidden="true"></i>
        </button>
      </div>

      <div className="card auth-card w-100 shadow-sm">
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <i className="bi bi-wallet2 display-5 text-primary" aria-hidden="true"></i>
            <h1 className="h4 mt-2 mb-1">Pidu</h1>
            <p className="text-body-secondary mb-0">Catat pemasukan & pengeluaranmu</p>
          </div>

          {formError && (
            <div className="alert alert-danger py-2" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
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
              {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
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
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true"></i>
                </button>
                {fieldErrors.password && (
                  <div className="invalid-feedback">{fieldErrors.password}</div>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
              Masuk
            </button>
          </form>

          <p className="text-center mt-3 mb-0">
            Belum punya akun?{' '}
            <Link to="/register" className="text-decoration-none">
              Daftar
            </Link>
          </p>

          {import.meta.env.DEV && (
            <div className="alert alert-secondary small mt-3 mb-0 d-flex align-items-center justify-content-between gap-2">
              <div>
                Akun demo: <code>demo@pidu.test</code> / <code>password</code>
              </div>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={fillDemoAccount}>
                Isi akun demo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
