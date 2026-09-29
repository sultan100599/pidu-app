import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { findMenuItem } from './nav'
import { useDropdownBounds } from '../../hooks/useDropdownBounds'
import LanguagePicker from '../LanguagePicker'
import { useT } from '../../i18n/LocaleProvider'

export default function Topbar({ onMenuClick, sidebarOpen }) {
  const t = useT()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  useDropdownBounds(userMenuRef, userMenuOpen)

  const pageTitle = t(findMenuItem(location.pathname)?.label ?? 'Pidu-App')
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!userMenuOpen) return undefined
    function handlePointerDown(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
        userMenuRef.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [userMenuOpen])

  return (
    <header className="topbar d-flex align-items-center gap-3 px-3">
      <button
        type="button"
        className="btn btn-link text-body p-1 d-lg-none"
        onClick={onMenuClick}
        aria-label={t('Buka menu')}
        aria-expanded={sidebarOpen}
        aria-controls="app-sidebar"
      >
        <i className="bi bi-list fs-4" aria-hidden="true"></i>
        <span className="small ms-1">{t('Menu')}</span>
      </button>

      <h2 className="h6 mb-0 text-truncate">{pageTitle}</h2>

      <div className="ms-auto d-flex align-items-center gap-1">
        <LanguagePicker />
        <button
          type="button"
          className="btn btn-link text-body p-1"
          onClick={toggleTheme}
          aria-label={t(isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap')}
        >
          <i className={`bi ${isDark ? 'bi-sun' : 'bi-moon-stars'} fs-5`} aria-hidden="true"></i>
        </button>

        <div className="dropdown" ref={userMenuRef}>
          <button
            type="button"
            className="btn btn-link text-body p-1"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-expanded={userMenuOpen}
            aria-label={t('Menu pengguna')}
          >
            <i className="bi bi-person-circle fs-5" aria-hidden="true"></i>
          </button>
          {userMenuOpen && (
            <ul className="dropdown-menu dropdown-menu-end show position-absolute">
              <li>
                <div className="dropdown-header text-wrap">
                  <div className="fw-semibold">{user?.name}</div>
                  <div className="small text-body-secondary fw-normal">{user?.email}</div>
                </div>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button type="button" className="dropdown-item" onClick={logout}>
                  <i className="bi bi-box-arrow-right me-2" aria-hidden="true"></i>
                  {t('Keluar')}
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  )
}
