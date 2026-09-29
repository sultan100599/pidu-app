import { useEffect } from 'react'

export default function PageHeader({ title, subtitle, actions }) {
  useEffect(() => {
    document.title = `${title} · Pidu-App`
    return () => {
      document.title = 'Pidu-App'
    }
  }, [title])

  return (
    <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      <div>
        <h1 className="h4 mb-1">{title}</h1>
        {subtitle && <p className="text-body-secondary mb-0">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions d-flex gap-2">{actions}</div>}
    </div>
  )
}
