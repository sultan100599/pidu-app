// Daftar halaman: selalu sertakan 1 dan halaman terakhir, plus jendela di
// sekitar halaman aktif; celah diganti elipsis '…'.
function getPages(current, last) {
  const visible = new Set([1, last])
  for (let p = Math.max(1, current - 2); p <= Math.min(last, current + 2); p += 1) {
    visible.add(p)
  }
  const sorted = [...visible].sort((a, b) => a - b)
  const pages = []
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) pages.push('…')
    pages.push(sorted[i])
  }
  return pages
}

function PageButton({ page, active, onClick, label, disabled }) {
  return (
    <li className={`page-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}>
      <button type="button" className="page-link" onClick={onClick} disabled={disabled} aria-label={label} aria-current={active ? 'page' : undefined}>
        {page}
      </button>
    </li>
  )
}

// meta dari paginator Laravel: { current_page, last_page, per_page, total, from, to }
export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null

  const { current_page: current, last_page: last, total, from, to } = meta
  const pages = getPages(current, last)

  return (
    <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-2 mt-3">
      <p className="small text-body-secondary mb-0">
        {total > 0 ? `Menampilkan ${from}–${to} dari ${total}` : 'Tidak ada data'}
      </p>
      <nav aria-label="Navigasi halaman">
        <ul className="pagination mb-0">
          <PageButton page="«" label="Halaman pertama" disabled={current === 1} onClick={() => onPageChange(1)} />
          <PageButton page="‹" label="Halaman sebelumnya" disabled={current === 1} onClick={() => onPageChange(current - 1)} />
          {pages.map((p, i) =>
            p === '…' ? (
              <li className="page-item disabled" key={`ellipsis-${i}`}>
                <span className="page-link" aria-hidden="true">
                  …
                </span>
              </li>
            ) : (
              <PageButton key={p} page={p} label={`Halaman ${p}`} active={p === current} onClick={() => onPageChange(p)} />
            ),
          )}
          <PageButton page="›" label="Halaman berikutnya" disabled={current === last} onClick={() => onPageChange(current + 1)} />
          <PageButton page="»" label="Halaman terakhir" disabled={current === last} onClick={() => onPageChange(last)} />
        </ul>
      </nav>
    </div>
  )
}
