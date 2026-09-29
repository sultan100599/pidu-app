export default function EmptyState({ icon = 'bi-inbox', title, description, action }) {
  return (
    <div className="card state-card">
      <div className="card-body text-center py-5">
        <i className={`bi ${icon} display-4 text-body-secondary`} aria-hidden="true"></i>
        <h2 className="h5 mt-3">{title}</h2>
        {description && <p className="text-body-secondary mb-3">{description}</p>}
        {action}
      </div>
    </div>
  )
}
