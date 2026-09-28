import PageHeader from '../components/PageHeader'

export default function PlaceholderPage({ title, phase }) {
  return (
    <>
      <PageHeader title={title} subtitle="Halaman ini sedang disiapkan." />
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-tools display-4 text-body-secondary" aria-hidden="true"></i>
          <h2 className="h5 mt-3">Segera hadir</h2>
          <p className="text-body-secondary mb-2">
            Fitur <strong>{title}</strong> akan tersedia pada Phase {phase}.
          </p>
        </div>
      </div>
    </>
  )
}
