// Badge kategori: ikon berwarna category.color di atas latar netral agar tetap
// terbaca di dark mode (bukan latar berwarna penuh).
export default function CategoryBadge({ category }) {
  if (!category) {
    return <span className="text-body-secondary">—</span>
  }
  return (
    <span className="d-inline-flex align-items-center gap-2 px-2 py-1 rounded border bg-body-tertiary">
      <i
        className={`bi ${category.icon || 'bi-tag'}`}
        style={{ color: category.color || 'var(--bs-secondary-color)' }}
        aria-hidden="true"
      ></i>
      <span>{category.name}</span>
    </span>
  )
}
