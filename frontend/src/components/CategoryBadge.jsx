import CategoryIcon from './CategoryIcon'

export default function CategoryBadge({ category }) {
  if (!category) {
    return <span className="text-body-secondary">Tidak ada kategori</span>
  }
  return (
    <span className="category-badge d-inline-flex align-items-center gap-2 px-2 py-1 rounded border bg-body-tertiary">
      <CategoryIcon icon={category.icon} color={category.color} />
      <span>{category.name}</span>
    </span>
  )
}
