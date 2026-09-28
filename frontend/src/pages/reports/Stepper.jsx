// Navigasi ‹ label › (dipakai pemilih tahun & bulan). Tombol "Hari ini" opsional.
export default function Stepper({ label, onPrev, onNext, onToday, prevLabel, nextLabel, disableNext = false }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <div className="btn-group" role="group">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onPrev} aria-label={prevLabel}>
          <i className="bi bi-chevron-left" aria-hidden="true"></i>
        </button>
        <span className="btn btn-outline-secondary btn-sm disabled text-body fw-semibold stepper-label" aria-live="polite">
          {label}
        </span>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={onNext}
          aria-label={nextLabel}
          disabled={disableNext}
        >
          <i className="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
      {onToday && (
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onToday}>
          Hari ini
        </button>
      )}
    </div>
  )
}
