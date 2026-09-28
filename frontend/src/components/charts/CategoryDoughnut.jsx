import './setup'
import { Doughnut } from 'react-chartjs-2'
import { formatRupiah } from '../../utils/format'
import { useChartTheme } from './useChartTheme'

const FALLBACK_COLOR = '#6c757d'

// Doughnut pengeluaran per kategori; warna = warna kategori.
// items: [{ name, color, total, percentage }]
export default function CategoryDoughnut({ items, height = 220 }) {
  const t = useChartTheme()

  const data = {
    labels: items.map((i) => i.name),
    datasets: [
      {
        data: items.map((i) => i.total),
        backgroundColor: items.map((i) => i.color || FALLBACK_COLOR),
        borderColor: t.surface,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { display: false },
      tooltip: {
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
