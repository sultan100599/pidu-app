import CategoryIcon from '../../components/CategoryIcon'

// Ikon keuangan mencakup semua ikon default seeder.
export const CATEGORY_ICONS = [
  'bi-cash-stack', 'bi-gift', 'bi-laptop', 'bi-briefcase', 'bi-graph-up-arrow', 'bi-box-seam',
  'bi-three-dots', 'bi-cup-hot', 'bi-car-front', 'bi-bag', 'bi-receipt', 'bi-lightning-charge',
  'bi-wifi', 'bi-phone', 'bi-house', 'bi-emoji-smile', 'bi-heart-pulse', 'bi-mortarboard',
  'bi-film', 'bi-wind', 'bi-airplane', 'bi-cart', 'bi-basket', 'bi-bus-front', 'bi-fuel-pump',
  'bi-piggy-bank', 'bi-bank', 'bi-credit-card', 'bi-wallet2', 'bi-coin', 'bi-controller',
  'bi-music-note-beamed', 'bi-book', 'bi-capsule', 'bi-droplet', 'bi-tag',
]

export default function IconPicker({ value, onChange, color }) {
  return (
    <div className="icon-picker" role="radiogroup" aria-label="Pilih ikon">
      {CATEGORY_ICONS.map((icon) => {
        const active = icon === value
        return (
          <button
            key={icon}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={icon.replace('bi-', '').replaceAll('-', ' ')}
            title={icon.replace('bi-', '')}
            className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => onChange(icon)}
          >
            {active ? <i className={`bi ${icon} icon-tile`} aria-hidden="true"></i> : <CategoryIcon icon={icon} color={color} />}
          </button>
        )
      })}
    </div>
  )
}
