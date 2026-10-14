import { dayNames, parseYmd } from '../../utils/format'

// "Tiap tanggal 5" / "Tiap hari Senin", dihitung dari tanggal mulai.
export function scheduleText(t, { frequency, start_date: start }) {
  const date = parseYmd(start)
  if (Number.isNaN(date.getTime())) return ''
  return frequency === 'weekly'
    ? t('Tiap hari {day}', { day: dayNames()[(date.getDay() + 6) % 7] })
    : t('Tiap tanggal {day}', { day: date.getDate() })
}
