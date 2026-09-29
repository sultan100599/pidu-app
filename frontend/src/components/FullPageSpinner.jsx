export default function FullPageSpinner() {
  return (
    <div className="boot-state d-flex justify-content-center align-items-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Memuat...</span>
      </div>
    </div>
  )
}

export function BootErrorScreen({ message, onRetry, retrying }) {
  return (
    <div className="boot-state d-flex flex-column justify-content-center align-items-center gap-3 text-center p-3">
      <i className="bi bi-wifi-off display-6 text-danger" aria-hidden="true"></i>
      <p className="mb-0">{message}</p>
      <button type="button" className="btn btn-primary" onClick={onRetry} disabled={retrying}>
        {retrying && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
        Coba lagi
      </button>
    </div>
  )
}
