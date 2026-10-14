import { useState } from 'react'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useT } from '../i18n/LocaleProvider'
import { toast } from '../i18n/toast'
import * as authApi from '../api/auth'
import PageHeader from '../components/PageHeader'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage, getFieldErrors } from '../utils/errors'

function ProfileCard() {
  const t = useT()
  const { user, setUser } = useAuth()
  const [form, setForm] = useState(() => ({ name: user?.name ?? '' }))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    if (!form.name.trim()) return setErrors({ name: 'Nama wajib diisi.' })
    setSaving(true)
    try {
      const response = await authApi.updateAccount({ name: form.name.trim() })
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
          <p className="form-text mb-3">
            {t('Saldo awal diatur per dompet di halaman')} <Link to="/wallets">{t('Dompet')}</Link>.
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
    <section className="card mb-3" aria-labelledby="account-password-title">
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

const REMINDER_HOURS = [7, 9, 12, 15, 17, 19, 21]

function ReminderCard() {
  const t = useT()
  const { user, setUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const value = user?.reminder_hour == null ? '' : String(user.reminder_hour)
  const hours = REMINDER_HOURS.includes(user?.reminder_hour) || value === '' ? REMINDER_HOURS : [...REMINDER_HOURS, user.reminder_hour].sort((a, b) => a - b)

  async function change(event) {
    const next = event.target.value === '' ? null : Number(event.target.value)
    setSaving(true)
    try {
      const response = await authApi.updateAccount({ reminder_hour: next })
      setUser(response.data.data)
      toast.success(next === null ? 'Pengingat dimatikan.' : t('Pengingat muncul mulai pukul {time}.', { time: `${String(next).padStart(2, '0')}.00` }))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card mb-3" aria-labelledby="account-reminder-title">
      <div className="card-body">
        <h2 id="account-reminder-title" className="h5 mb-1">{t('Pengingat catat')}</h2>
        <p className="text-body-secondary small mb-3">{t('Kalau hari itu belum ada catatan, Ringkasan menampilkan pengingat mulai jam ini.')}</p>
        <label htmlFor="account-reminder" className="form-label">{t('Mulai jam')}</label>
        <select id="account-reminder" className="form-select account-reminder-select" value={value} onChange={change} disabled={saving} aria-busy={saving}>
          {hours.map((hour) => (
            <option key={hour} value={hour}>{`${String(hour).padStart(2, '0')}.00`}</option>
          ))}
          <option value="">{t('Mati')}</option>
        </select>
      </div>
    </section>
  )
}

function SessionCard() {
  const t = useT()
  const { endSession } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function logoutAll() {
    setBusy(true)
    try {
      const response = await authApi.logoutAll()
      endSession(response.data.message)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <section className="card mb-3" aria-labelledby="account-session-title">
      <div className="card-body">
        <h2 id="account-session-title" className="h5 mb-1">{t('Perangkat yang masuk')}</h2>
        <p className="text-body-secondary small mb-3">{t('Lupa keluar di HP atau komputer lain? Keluarkan semuanya sekaligus, termasuk perangkat ini.')}</p>
        <button type="button" className="btn btn-outline-secondary" onClick={() => setConfirming(true)}>
          <i className="bi bi-box-arrow-right me-2" aria-hidden="true"></i>
          {t('Keluar dari semua perangkat')}
        </button>
      </div>
      <ConfirmDialog
        show={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={logoutAll}
        title={t('Keluar dari semua perangkat?')}
        confirmLabel="Keluar semua"
        confirmVariant="primary"
        loading={busy}
      >
        <p className="mb-0">{t('Semua perangkat harus masuk lagi dengan email dan password. Datamu tidak berubah.')}</p>
      </ConfirmDialog>
    </section>
  )
}

function DeleteAccountCard() {
  const t = useT()
  const { endSession } = useAuth()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function close() {
    setOpen(false)
    setPassword('')
    setError('')
  }

  async function confirm(event) {
    event?.preventDefault()
    if (busy) return
    if (!password) return setError('Password wajib diisi.')
    setBusy(true)
    try {
      const response = await authApi.deleteAccount(password)
      endSession(response.data.message)
    } catch (err) {
      if (err.response?.status === 422) setError(getFieldErrors(err).password ?? getErrorMessage(err))
      else toast.error(getErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <section className="card account-danger" aria-labelledby="account-delete-title">
      <div className="card-body">
        <h2 id="account-delete-title" className="h5 mb-1">{t('Hapus akun')}</h2>
        <p className="text-body-secondary small mb-3">{t('Semua transaksi, dompet, kategori, anggaran, dan cadangan ikut terhapus dan tidak bisa dikembalikan. Unduh cadanganmu dulu kalau masih perlu.')}</p>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button type="button" className="btn btn-outline-danger" onClick={() => setOpen(true)}>
            {t('Hapus akun')}
          </button>
          <Link to="/export" className="account-inline-link">{t('Unduh cadangan dulu')}</Link>
        </div>
      </div>
      <ConfirmDialog
        show={open}
        onClose={close}
        onConfirm={confirm}
        title={t('Hapus akun ini?')}
        confirmLabel="Hapus akun"
        loading={busy}
      >
        <form onSubmit={confirm} noValidate>
          <p>{t('Semua datamu dihapus permanen. Masukkan password untuk melanjutkan.')}</p>
          <label htmlFor="account-delete-password" className="form-label">{t('Password')}</label>
          <input
            id="account-delete-password"
            type="password"
            className={`form-control ${error ? 'is-invalid' : ''}`}
            value={password}
            autoComplete="current-password"
            onChange={(event) => { setPassword(event.target.value); setError('') }}
          />
          {error && <div className="invalid-feedback">{t(error)}</div>}
        </form>
      </ConfirmDialog>
    </section>
  )
}

export default function AccountPage() {
  return (
    <div className="account-page">
      <PageHeader title="Akun" subtitle="Nama, password, pengingat, dan perangkat" />
      <ProfileCard />
      <ReminderCard />
      <PasswordCard />
      <SessionCard />
      <DeleteAccountCard />
    </div>
  )
}
