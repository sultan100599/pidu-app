import { useLayoutEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useTransactions } from '../../context/TransactionContext'
import { useT } from '../../i18n/LocaleProvider'

export default function BottomNav() {
  const t = useT()
  const { openCreate } = useTransactions()
  const navRef = useRef(null)
  useLayoutEffect(() => {
    const element = navRef.current
    const measure = () => document.documentElement.style.setProperty('--pidu-bottom-nav-height', `${element.getBoundingClientRect().height}px`)
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    measure()
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--pidu-bottom-nav-height')
    }
  }, [])
  const item = (to, icon, label, end = true) => (
    <NavLink to={to} end={end} className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
      <i className={`bi ${icon}`} aria-hidden="true" /><span>{t(label)}</span>
    </NavLink>
  )
  return (
    <nav className="bottom-nav d-lg-none" aria-label={t('Navigasi utama')} ref={navRef}>
      {item('/', 'bi-house', 'Ringkasan')}
      {item('/transactions', 'bi-receipt', 'Transaksi')}
      <button type="button" className="bottom-nav-item bottom-nav-create" onClick={openCreate}>
        <i className="bi bi-plus-lg icon-tile" aria-hidden="true" /><span>{t('Catat')}</span>
      </button>
      {item('/reports', 'bi-bar-chart', 'Laporan', false)}
      {item('/budgets', 'bi-piggy-bank', 'Anggaran')}
    </nav>
  )
}
