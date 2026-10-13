import { useState } from 'react'
import { useT } from '../i18n/LocaleProvider'
import { toast } from '../i18n/toast'
import * as authApi from '../api/auth'
import PageHeader from '../components/PageHeader'
import AmountInput from '../components/ui/AmountInput'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage, getFieldErrors } from '../utils/errors'

function ProfileCard() {
  const t = useT()
  const { user, setUser } = useAuth()
  const [form, setForm] = useState(() => ({ name: user?.name ?? '', opening_balance: user?.opening_balance ?? 0 }))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    if (!form.name.trim()) return setErrors({ name: 'Nama wajib diisi.' })
    setSaving(true)
    try {
      const response = await authApi.updateAccount({ name: form.name.trim(), opening_balance: form.opening_balance ?? 0 })
      setUser(response.data.data)
      toast.success(response.data.message)
    } catch (err) {
      if (err.response?.status === 422) setErrors(getFieldErrors(err))
      else toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card mb-3" aria-labelledby="account-profile-title">
      <div className="card-body">
        <h2 id="account-profile-title" className="h5 mb-3">{t('Data akun')}</h2>
        <form onSubmit={submit} noValidate>
          <div className="mb-3">
            <label htmlFor="account-name" className="form-label">{t('Nama')}</label>
            <input
              id="account-name"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              value={form.name}
              maxLength={100}
              autoComplete="name"
              onChange={(event) => { setForm((prev) => ({ ...prev, name: event.target.value })); setErrors({}) }}
            />
            {errors.name && <div className="invalid-feedback">{t(errors.name)}</div>}
          </div>
          <div className="mb-1">
            <label htmlFor="account-opening" className="form-label">{t('Saldo awal')}</label>
            <AmountInput
              id="account-opening"
              value={form.opening_balance}
              invalid={Boolean(errors.opening_balance)}
              allowDecimals={Boolean(Number(user?.opening_balance) % 1)}
              aria-describedby="account-opening-hint"
              onChange={(value) => { setForm((prev) => ({ ...prev, opening_balance: value })); setErrors({}) }}
            />
            {errors.opening_balance && <div className="invalid-feedback d-block">{t(errors.opening_balance)}</div>}
          </div>
          <p id="account-opening-hint" className="form-text mb-3">
            {t('Uang yang kamu pegang sebelum mulai mencatat di Pidu. Saldo di dashboard dihitung dari angka ini.')}
          </p>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {t('Simpan')}
          </button>
        </form>
      </div>
    </section>
  )
}

function PasswordCard() {
  const t = useT()
  const [form, setForm] = useState({ current_password: '', password: '' })
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function update(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    const clientErrors = {}
    if (!form.current_password) clientErrors.current_password = 'Password lama wajib diisi.'
    if (!form.password) clientErrors.password = 'Password wajib diisi.'
    else if (form.password.length < 8) clientErrors.password = 'Password minimal 8 karakter.'
    if (Object.keys(clientErrors).length > 0) return setErrors(clientErrors)
    setSaving(true)
    try {
      const response = await authApi.changePassword(form)
      toast.success(response.data.message)
      setForm({ current_password: '', password: '' })
    } catch (err) {
      if (err.response?.status === 422) setErrors(getFieldErrors(err))
      else toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const field = (name, label, autoComplete) => (
    <div className="mb-3">
      <label htmlFor={`account-${name}`} className="form-label">{t(label)}</label>
      <input
        id={`account-${name}`}
        name={name}
        type={show ? 'text' : 'password'}
        className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
        value={form[name]}
        onChange={update}
        autoComplete={autoComplete}
      />
      {errors[name] && <div className="invalid-feedback">{t(errors[name])}</div>}
    </div>
  )

  return (
    <section className="card" aria-labelledby="account-password-title">
      <div className="card-body">
        <h2 id="account-password-title" className="h5 mb-1">{t('Ganti password')}</h2>
        <p className="text-body-secondary small mb-3">{t('Perangkat lain yang sedang masuk akan diminta masuk lagi.')}</p>
        <form onSubmit={submit} noValidate>
          {field('current_password', 'Password lama', 'current-password')}
          {field('password', 'Password baru', 'new-password')}
          <div className="form-check mb-3">
            <input id="account-show-password" type="checkbox" className="form-check-input" checked={show} onChange={(event) => setShow(event.target.checked)} />
            <label htmlFor="account-show-password" className="form-check-label">{t('Tampilkan password')}</label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {t('Ganti password')}
          </button>
        </form>
      </div>
    </section>
  )
}

export default function AccountPage() {
  return (
    <div className="account-page">
      <PageHeader title="Akun" subtitle="Nama, saldo awal, dan password" />
      <ProfileCard />
      <PasswordCard />
    </div>
  )
}
