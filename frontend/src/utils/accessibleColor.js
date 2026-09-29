const rgb = (hex) => hex.slice(1).match(/../g).map((part) => parseInt(part, 16))
const luminance = (color) => color.reduce((sum, channel, index) => {
  const value = channel / 255
  return sum + (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][index]
}, 0)

export function contrastRatio(foreground, background) {
  const values = [luminance(rgb(foreground)), luminance(rgb(background))].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

// Warna kategori tersimpan tetap utuh; hanya warna tampilan yang disesuaikan.
export function accessibleColor(color, background, ink, minimum = 3) {
  if (!/^#[\da-f]{6}$/i.test(color ?? '')) return ink
  if (contrastRatio(color, background) >= minimum) return color
  const source = rgb(color)
  const target = rgb(ink)
  for (let step = 1; step <= 100; step += 1) {
    const mixed = '#' + source.map((channel, index) =>
      Math.round(channel + (target[index] - channel) * step / 100).toString(16).padStart(2, '0'),
    ).join('')
    if (contrastRatio(mixed, background) >= minimum) return mixed
  }
  return ink
}
