import { useMemo } from 'react'
import { useTheme } from '../../context/ThemeContext'

// Warna grafik diambil dari variabel CSS Bootstrap supaya ikut light/dark mode.
export function useChartTheme() {
  const { theme } = useTheme()

  return useMemo(() => {
    const css = getComputedStyle(document.documentElement)
    const v = (name) => css.getPropertyValue(name).trim()
    return {
      theme,
      income: v('--bs-success'),
      expense: v('--bs-danger'),
      text: v('--bs-secondary-color'),
      grid: v('--bs-border-color-translucent'),
      surface: v('--pidu-surface'),
      ink: v('--bs-body-color'),
      softSurface: v('--pidu-peach'),
      font: v('--pidu-font'),
    }
    // theme = pemicu hitung ulang setelah data-bs-theme berubah.
  }, [theme])
}
