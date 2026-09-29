import { useT } from '../../i18n/LocaleProvider'

export const CATEGORY_COLORS = [
  '#dc3545', '#fd7e14', '#b8860b', '#198754', '#20c997', '#0dcaf0',
  '#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#795548', '#6c757d',
]

export default function ColorPicker({ value, onChange }) {
  const t = useT()
  const custom = value && !CATEGORY_COLORS.includes(value.toLowerCase())

  return (
    <div className="d-flex flex-wrap align-items-center gap-2" role="radiogroup" aria-label={t('Pilih warna')}>
      {CATEGORY_COLORS.map((color) => {
        const active = value?.toLowerCase() === color
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t('Warna {color}', { color })}
            className={`color-swatch p-0 ${active ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          ></button>
        )
      })}
      <label className={`d-inline-flex align-items-center gap-1 small ms-1 ${custom ? 'fw-semibold' : ''}`}>
        <input
          type="color"
          className="form-control form-control-color form-control-sm"
          value={value || '#6c757d'}
          onChange={(e) => onChange(e.target.value)}
          aria-label={t('Warna kustom')}
        />
        {t('Kustom')}
      </label>
    </div>
  )
}
