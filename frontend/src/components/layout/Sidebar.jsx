import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { MENU } from './nav'

function MenuLink({ item, onNavigate }) {
  return (
    <li className="nav-item">
      <NavLink
        to={item.path}
        end={item.path === '/'}
        onClick={onNavigate}
        className={({ isActive }) => `nav-link d-flex align-items-center gap-2${isActive ? ' active' : ''}`}
      >
        <i className={`bi ${item.icon} icon-tile`} aria-hidden="true"></i>
        <span>{item.label}</span>
      </NavLink>
    </li>
  )
}

export default function Sidebar({ open, onClose }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })
  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    const panel = panelRef.current
    const controls = () => [...panel.querySelectorAll('button, a[href]')].filter((element) => element.getClientRects().length > 0)
    controls()[0]?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key === 'Tab' && window.matchMedia('(max-width: 991.98px)').matches) {
        const items = controls()
        const first = items[0]
        const last = items.at(-1)
        if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [open])

  return (
    <aside
      id="app-sidebar"
      ref={panelRef}
      className={`sidebar offcanvas-lg offcanvas-start${open ? ' show' : ''}`}
      aria-label="Menu navigasi"
    >
      <div className="sidebar-brand d-flex align-items-center gap-2 px-3 py-3">
        <i className="bi bi-wallet2 fs-4 text-primary" aria-hidden="true"></i>
        <span className="fw-bold fs-5">Pidu</span>
        <button
          type="button"
          className="btn btn-sm btn-link text-body ms-auto d-lg-none"
          onClick={onClose}
          aria-label="Tutup menu"
        >
          <i className="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </div>
      <nav className="px-2 pb-3">
        <ul className="nav nav-pills flex-column gap-1">
          {MENU.map((item) =>
            item.children ? (
              <li key={item.label} className="mt-2">
                <div className="sidebar-group-label px-2 text-body-secondary small fw-semibold">
                  {item.label}
                </div>
                <ul className="nav nav-pills flex-column gap-1 mt-1">
                  {item.children.map((child) => (
                    <MenuLink key={child.path} item={child} onNavigate={onClose} />
                  ))}
                </ul>
              </li>
            ) : (
              <MenuLink key={item.path} item={item} onNavigate={onClose} />
            ),
          )}
        </ul>
      </nav>
    </aside>
  )
}
