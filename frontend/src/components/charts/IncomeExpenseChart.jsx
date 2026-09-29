import './setup'
import { useT } from '../../i18n/LocaleProvider'
import { Bar } from 'react-chartjs-2'
import { formatCompact, formatRupiah } from '../../utils/format'
import { useChartTheme } from './useChartTheme'
import { useReducedMotion } from '../../hooks/useReducedMotion'

// Grafik batang pemasukan vs pengeluaran. `labels` sudah dalam bentuk tampilan;
// `tooltipTitles` (opsional) dipakai untuk judul tooltip yang lebih panjang.
export default function IncomeExpenseChart({ labels, income, expense, tooltipTitles, height = 280, ariaLabel }) {
  const translate = useT()
  const t = useChartTheme()
  const reducedMotion = useReducedMotion()

  const data = {
    labels,
    datasets: [
      {
        label: translate('Pemasukan'),
        data: income,
        backgroundColor: t.income,
        borderRadius: 6,
        maxBarThickness: 28,
      },
      {
        label: translate('Pengeluaran'),
        data: expense,
        backgroundColor: t.expense,
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: reducedMotion ? false : { duration: 180 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: t.text, font: { family: t.font }, boxWidth: 12, usePointStyle: true } },
      tooltip: {
        backgroundColor: t.surface,
        titleColor: t.ink,
        bodyColor: t.ink,
        borderColor: t.text,
        borderWidth: 1,
        callbacks: {
          title: (items) => (tooltipTitles ? tooltipTitles[items[0].dataIndex] : items[0].label),
          label: (item) => ` ${item.dataset.label}: ${formatRupiah(item.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: t.text, font: { family: t.font }, maxRotation: 0, autoSkip: true, autoSkipPadding: 8 },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: t.text, font: { family: t.font }, callback: (value) => formatCompact(value) },
        grid: { color: t.grid },
      },
    },
  }

  return (
    <div style={{ height }} role="img" aria-label={translate(ariaLabel ?? 'Grafik pemasukan dan pengeluaran')}>
      {/* key = tema → chart dibuat ulang dengan warna baru saat dark mode di-toggle */}
      <Bar key={t.theme} data={data} options={options} />
    </div>
  )
}
