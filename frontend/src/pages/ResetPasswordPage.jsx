import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useT } from '../i18n/LocaleProvider'
import { toast } from '../i18n/toast'
import * as authApi from '../api/auth'
import AuthFrame from '../components/AuthFrame'
import { getErrorMessage, getFieldErrors } from '../utils/errors'

export default function ResetPasswordPage() {
  const t = useT()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const linkBroken = !token || !email

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    if (!password) return setFieldError('Password wajib diisi.')
    if (password.length < 8) return setFieldError('Password minimal 8 karakter.')
    setSubmitting(true)
    setFormError('')
    try {
      const response = await authApi.resetPassword({ token, email, password })
      toast.success(response.data.message)
      navigate('/login', { replace: true })
    } catch (err) {
      const errors = err.response?.status === 422 ? getFieldErrors(err) : {}
      if (errors.password) setFieldError(errors.password)
      else setFormError(errors.email ?? errors.token ?? getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFrame pageTitle="Buat password baru" title="Buat password baru" subtitle={email || 'Pidu'}>
      {linkBroken ? (
        <div className="alert alert-warning mt-3" role="alert">{t('Link ini tidak lengkap. Minta link baru dari halaman Lupa password.')}</div>
      ) : (
        <>
          {formError && <div className="alert alert-danger py-2" role="alert">{t(formError)}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="reset-password" className="form-label">{t('Password baru')}</label>
              <div className="input-group has-validation">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control${fieldError ? ' is-invalid' : ''}`}
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setFieldError('') }}
                  autoComplete="new-password"
                  aria-describedby="reset-password-hint"
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={t(showPassword ? 'Sembunyikan password' : 'Tampilkan password')}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true"></i>
                </button>
                {fieldError && <div className="invalid-feedback">{t(fieldError)}</div>}
              </div>
              {!fieldError && <div id="reset-password-hint" className="form-text">{t('Minimal 8 karakter.')}</div>}
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
              {t('Simpan password baru')}
            </button>
          </form>
        </>
      )}
      <p className="text-center mt-3 mb-0">
        <Link to={linkBroken ? '/forgot-password' : '/login'} className="text-decoration-none">
          {t(linkBroken ? 'Minta link baru' : 'Kembali ke halaman Masuk')}
        </Link>
      </p>
    </AuthFrame>
  )
}
