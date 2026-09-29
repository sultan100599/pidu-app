import { useChartTheme } from './charts/useChartTheme'
import { accessibleColor } from '../utils/accessibleColor'

export default function CategoryIcon({ icon, color }) {
  const theme = useChartTheme()
  return (
    <i
      className={`bi ${icon || 'bi-tag'} icon-tile`}
      style={{ color: accessibleColor(color, theme.softSurface, theme.ink) }}
      aria-hidden="true"
    ></i>
  )
}
