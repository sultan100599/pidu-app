import { NavLink } from 'react-router-dom'
import { useT } from '../../i18n/LocaleProvider'
import PurposeSwitch from '../../components/PurposeSwitch'
import { usePurpose } from '../../hooks/usePurpose'

const TABS = [
  { path: '/reports/daily', label: 'Harian' },
  { path: '/reports/weekly', label: 'Mingguan' },
  { path: '/reports/monthly', label: 'Bulanan' },
  { path: '/reports/yearly', label: 'Tahunan' },
  { path: '/reports/calendar', label: 'Kalender' },
]

// Satu menu "Laporan" di sidebar; jenis rekap dipilih lewat tab ini.
// Saringan Pribadi/Usaha ikut terbawa saat pindah tab.
export default function ReportTabs() {
  const t = useT()
  const { purpose, setPurpose, search } = usePurpose()
  return (
    <div className="report-toolbar d-flex flex-wrap align-items-center gap-2 mb-3">
      <nav className="report-tabs" aria-label={t('Jenis laporan')}>
        {TABS.map((tab) => (
          <NavLink key={tab.path} to={tab.path + search} className={({ isActive }) => `report-tab${isActive ? ' active' : ''}`}>
            {t(tab.label)}
          </NavLink>
        ))}
      </nav>
      <PurposeSwitch value={purpose} onChange={setPurpose} className="glass-strip ms-auto" />
    </div>
  )
}
