export default function FullPageSpinner() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Memuat...</span>
      </div>
    </div>
  )
}
