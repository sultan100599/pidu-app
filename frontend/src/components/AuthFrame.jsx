import { useEffect } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import { useTheme } from '../context/ThemeContext'
import AuthScene from './AuthScene'
import LanguagePicker from './LanguagePicker'

// Kerangka halaman tamu (Masuk, Daftar, Lupa/Atur ulang password): latar washitsu,
// tombol bahasa & tema, lalu kartu berisi judul dan form.
export default function AuthFrame({ pageTitle, title, subtitle, children }) {
  const { t, locale } = useLocale()
  const { theme, toggleTheme } = useTheme()
  useEffect(() => { document.title = `${t(pageTitle)} · Pidu-App` }, [locale, t, pageTitle])

  return (
    <main className="auth-page d-flex align-items-center justify-content-center p-3">
      <AuthScene />
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
            <h1 className="h4 mt-2 mb-1">{t(title)}</h1>
            <p className="text-body-secondary mb-0">{t(subtitle)}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}
