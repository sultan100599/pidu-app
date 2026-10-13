import { NavLink } from 'react-router-dom'
import { useT } from '../../i18n/LocaleProvider'

const TABS = [
  { path: '/reports/daily', label: 'Harian' },
  { path: '/reports/weekly', label: 'Mingguan' },
  { path: '/reports/monthly', label: 'Bulanan' },
  { path: '/reports/yearly', label: 'Tahunan' },
  { path: '/reports/calendar', label: 'Kalender' },
]

// Satu menu "Laporan" di sidebar; jenis rekap dipilih lewat tab ini.
export default function ReportTabs() {
  const t = useT()
  return (
    <nav className="report-tabs mb-3" aria-label={t('Jenis laporan')}>
      {TABS.map((tab) => (
        <NavLink key={tab.path} to={tab.path} className={({ isActive }) => `report-tab${isActive ? ' active' : ''}`}>
          {t(tab.label)}
        </NavLink>
      ))}
    </nav>
  )
}
