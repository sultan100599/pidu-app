import { useLayoutEffect } from 'react'

export function useDropdownBounds(ref, open) {
  useLayoutEffect(() => {
    if (!open) return undefined
    const anchor = ref.current
    const menu = anchor?.querySelector('.dropdown-menu')
    if (!menu) return undefined
    const place = () => {
      const viewport = document.documentElement.clientWidth
      menu.style.setProperty('--dropdown-available-width', `${Math.max(0, viewport - 32)}px`)
      const right = anchor.getBoundingClientRect().right
      const width = menu.offsetWidth
      const left = Math.max(16, Math.min(right - width, viewport - width - 16))
      menu.style.setProperty('--dropdown-shift-x', `${left - (right - width)}px`)
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(anchor)
    observer.observe(menu)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [ref, open])
}
