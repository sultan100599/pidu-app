import { useEffect } from 'react'
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
        <i className={`bi ${item.icon}`} aria-hidden="true"></i>
        <span>{item.label}</span>
      </NavLink>
    </li>
  )
}

export default function Sidebar({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <aside
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
                <div className="sidebar-group-label px-2 text-body-secondary text-uppercase small fw-semibold">
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
