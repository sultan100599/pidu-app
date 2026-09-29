import './setup'
import { Doughnut } from 'react-chartjs-2'
import { formatRupiah } from '../../utils/format'
import { useChartTheme } from './useChartTheme'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { accessibleColor } from '../../utils/accessibleColor'

// Doughnut pengeluaran per kategori; warna = warna kategori.
// items: [{ name, color, total, percentage }]
export default function CategoryDoughnut({ items, height = 220 }) {
  const t = useChartTheme()
  const reducedMotion = useReducedMotion()

  const data = {
    labels: items.map((i) => i.name),
    datasets: [
      {
        data: items.map((i) => i.total),
        backgroundColor: items.map((i) => accessibleColor(i.color, t.softSurface, t.ink)),
        hoverBackgroundColor: items.map((i) => accessibleColor(i.color, t.softSurface, t.ink)),
        borderColor: t.surface,
        hoverBorderColor: t.surface,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: reducedMotion ? false : { duration: 180 },
    cutout: '62%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: t.surface,
        titleColor: t.ink,
        bodyColor: t.ink,
        borderColor: t.text,
        borderWidth: 1,
        callbacks: {
          label: (item) => ` ${formatRupiah(item.parsed)} (${items[item.dataIndex].percentage.toLocaleString('id-ID')}%)`,
        },
      },
    },
  }

  return (
    <div style={{ height }} role="img" aria-label="Grafik pengeluaran per kategori">
      <Doughnut key={t.theme} data={data} options={options} />
    </div>
  )
}
