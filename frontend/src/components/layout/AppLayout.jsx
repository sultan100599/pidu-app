import { Suspense, useEffect, useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import TransactionProvider from './TransactionProvider'
import BottomNav from './BottomNav'
import PageSkeleton from '../ui/PageSkeleton'

const COLLAPSE_KEY = 'pidu_sidebar_collapsed'

// Tanpa pilihan tersimpan, layar desktop sempit (< 1280px) mulai dengan menu ikon saja.
function getInitialCollapsed() {
  try {
    const stored = localStorage.getItem(COLLAPSE_KEY)
    if (stored === '1' || stored === '0') return stored === '1'
  } catch { /* localStorage bisa diblokir */ }
  return window.matchMedia('(max-width: 1279.98px)').matches
}

export default function AppLayout() {
  const t = useT()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = () => setSidebarOpen(false)
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)
  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0') } catch { /* abaikan */ }
  }

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <TransactionProvider><div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar open={sidebarOpen} onClose={closeSidebar} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      {sidebarOpen && (
        <div
          className="offcanvas-backdrop fade show d-lg-none"
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}
      <div className="app-content">
        <Topbar sidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(true)} />
        <main className={`app-main p-3 p-lg-4${pathname === '/' ? ' app-main-dashboard' : ''}`} style={{ '--pidu-refresh-label': JSON.stringify(t('Memperbarui data...')) }}>
          <Suspense
            fallback={
              <PageSkeleton variant={pathname === '/' ? 'dashboard' : pathname.includes('calendar') ? 'calendar' : 'report'} />
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
      <BottomNav />
    </div></TransactionProvider>
  )
}
