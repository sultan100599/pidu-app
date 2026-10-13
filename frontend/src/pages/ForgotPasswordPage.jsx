import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n/LocaleProvider'
import * as authApi from '../api/auth'
import AuthFrame from '../components/AuthFrame'
import { getErrorMessage, getFieldErrors } from '../utils/errors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    const value = email.trim()
    if (!value) return setFieldError('Email wajib diisi.')
    if (!EMAIL_PATTERN.test(value)) return setFieldError('Format email tidak valid.')
    setSubmitting(true)
    setFormError('')
    try {
      const response = await authApi.forgotPassword(value)
      setSentMessage(response.data.message)
    } catch (err) {
      if (err.response?.status === 422) setFieldError(getFieldErrors(err).email ?? '')
      else setFormError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFrame pageTitle="Lupa password" title="Lupa password" subtitle="Kami kirim link untuk membuat password baru ke email kamu">
      {sentMessage ? (
        <div className="alert alert-success mt-3" role="status">{t(sentMessage)}</div>
      ) : (
        <>
          {formError && <div className="alert alert-danger py-2" role="alert">{formError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="forgot-email" className="form-label">{t('Email')}</label>
              <input
                id="forgot-email"
                type="email"
                className={`form-control${fieldError ? ' is-invalid' : ''}`}
                value={email}
                onChange={(event) => { setEmail(event.target.value); setFieldError('') }}
                autoComplete="email"
                autoFocus
              />
              {fieldError && <div className="invalid-feedback">{t(fieldError)}</div>}
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
              {t('Kirim link')}
            </button>
          </form>
        </>
      )}
      <p className="text-center mt-3 mb-0">
        <Link to="/login" className="text-decoration-none">{t('Kembali ke halaman Masuk')}</Link>
      </p>
    </AuthFrame>
  )
}
