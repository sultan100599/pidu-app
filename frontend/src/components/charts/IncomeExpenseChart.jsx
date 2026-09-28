import './setup'
import { Bar } from 'react-chartjs-2'
import { formatCompact, formatRupiah } from '../../utils/format'
import { useChartTheme } from './useChartTheme'

// Grafik batang pemasukan vs pengeluaran. `labels` sudah dalam bentuk tampilan;
// `tooltipTitles` (opsional) dipakai untuk judul tooltip yang lebih panjang.
export default function IncomeExpenseChart({ labels, income, expense, tooltipTitles, height = 280, ariaLabel }) {
  const t = useChartTheme()

  const data = {
    labels,
    datasets: [
      {
        label: 'Pemasukan',
        data: income,
        backgroundColor: t.income,
        borderRadius: 3,
        maxBarThickness: 28,
      },
      {
        label: 'Pengeluaran',
        data: expense,
        backgroundColor: t.expense,
        borderRadius: 3,
        maxBarThickness: 28,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: t.text, boxWidth: 12, usePointStyle: true } },
      tooltip: {
        callbacks: {
          title: (items) => (tooltipTitles ? tooltipTitles[items[0].dataIndex] : items[0].label),
          label: (item) => ` ${item.dataset.label}: ${formatRupiah(item.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: t.text, maxRotation: 0, autoSkip: true, autoSkipPadding: 8 },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: t.text, callback: (value) => formatCompact(value) },
        grid: { color: t.grid },
      },
    },
  }

  return (
    <div style={{ height }} role="img" aria-label={ariaLabel ?? 'Grafik pemasukan dan pengeluaran'}>
      {/* key = tema → chart dibuat ulang dengan warna baru saat dark mode di-toggle */}
      <Bar key={t.theme} data={data} options={options} />
    </div>
  )
}
