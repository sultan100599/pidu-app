import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import TransactionProvider from './TransactionProvider'
import BottomNav from './BottomNav'
import PageSkeleton from '../ui/PageSkeleton'

export default function AppLayout() {
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = () => setSidebarOpen(false)

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <TransactionProvider><div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      {sidebarOpen && (
        <div
          className="offcanvas-backdrop fade show d-lg-none"
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}
      <div className="app-content">
        <Topbar sidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-main p-3 p-lg-4">
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
