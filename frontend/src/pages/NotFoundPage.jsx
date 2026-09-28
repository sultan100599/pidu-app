import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Halaman Tidak Ditemukan" />
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-exclamation-circle display-4 text-body-secondary" aria-hidden="true"></i>
          <h2 className="h5 mt-3">404</h2>
          <p className="text-body-secondary">Halaman yang kamu cari tidak ada.</p>
          <Link to="/" className="btn btn-primary">
            <i className="bi bi-speedometer2 me-2" aria-hidden="true"></i>
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </>
  )
}
