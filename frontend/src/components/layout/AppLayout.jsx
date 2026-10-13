import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import TransactionProvider from './TransactionProvider'
import BottomNav from './BottomNav'
import PageSkeleton from '../ui/PageSkeleton'
import { TopbarSlotsContext } from './TopbarSlots'

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
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = () => setSidebarOpen(false)
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)
  const [slots, setSlots] = useState({})
  const register = useCallback((name, element) => {
    setSlots((current) => (current[name] === element ? current : { ...current, [name]: element }))
  }, [])
  const slotsValue = useMemo(() => ({ slots, register }), [slots, register])
  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0') } catch { /* abaikan */ }
  }

  // Sidebar menempel ke dasar layar selama halaman masih bisa digulir; saat mentok di bawah
  // (atau halaman pendek), sidebar ikut melayang sejajar dengan akhir konten.
  const [atEnd, setAtEnd] = useState(true)
  useEffect(() => {
    const update = () => setAtEnd(window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2)
    const observer = new ResizeObserver(update)
    observer.observe(document.body)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <TransactionProvider><TopbarSlotsContext.Provider value={slotsValue}><div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}${atEnd ? ' scroll-at-end' : ''}`}>
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
        <main className={`app-main p-3 p-lg-4${pathname === '/' ? ' app-main-dashboard' : ''}`}>
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
    </div></TopbarSlotsContext.Provider></TransactionProvider>
  )
}
