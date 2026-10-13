import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../i18n/LocaleProvider'
import { useDesktop } from '../hooks/useDesktop'
import { useTopbarSlots } from './layout/TopbarSlots'

// Desktop: judul, subjudul, dan aksi halaman tampil di topbar yang melayang (slot di Topbar).
// HP: tetap di halaman karena topbar sudah penuh oleh tombol Menu dan alat.
export default function PageHeader({ title, subtitle, actions }) {
  const t = useT()
  const desktop = useDesktop()
  const { slots } = useTopbarSlots()
  title = t(title)
  subtitle = typeof subtitle === 'string' ? t(subtitle) : subtitle
  useEffect(() => {
    document.title = `${title} · Pidu-App`
    return () => {
      document.title = 'Pidu-App'
    }
  }, [title])

  const heading = (
    <div className="page-heading min-w-0">
      <h1 className="h4 mb-1">{title}</h1>
      {subtitle && <p className="text-body-secondary mb-0">{subtitle}</p>}
    </div>
  )
  const actionBar = actions && <div className="page-actions d-flex gap-2">{actions}</div>

  if (desktop && slots.title && slots.actions) {
    return (
      <>
        {createPortal(heading, slots.title)}
        {actionBar && createPortal(actionBar, slots.actions)}
      </>
    )
  }

  return (
    <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      {heading}
      {actionBar}
    </div>
  )
}
