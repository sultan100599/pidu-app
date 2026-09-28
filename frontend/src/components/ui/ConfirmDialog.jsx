import Modal from './Modal'

// Dialog konfirmasi generik; tombol konfirmasi memakai variant danger dan
// menampilkan spinner selama `loading`.
export default function ConfirmDialog({ show, onClose, onConfirm, title, children, confirmLabel = 'Hapus', loading = false }) {
  return (
    <Modal show={show} onClose={loading ? () => {} : onClose} title={title} busy={loading}>
      <div>{children}</div>
      <div className="d-flex justify-content-end gap-2 mt-4">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
          Batal
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
