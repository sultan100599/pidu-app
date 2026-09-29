import { useEffect, useRef } from 'react'

export function usePointerTilt() {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let frame = 0
    let pointer
    const reset = () => {
      cancelAnimationFrame(frame)
      frame = 0
      element.removeAttribute('data-tilting')
      for (const name of ['--tilt-x', '--tilt-y', '--shine-x', '--shine-y']) element.style.removeProperty(name)
    }
    const move = (event) => {
      if (!media.matches || event.pointerType === 'touch') return
      pointer = { x: event.clientX, y: event.clientY }
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const bounds = element.getBoundingClientRect()
        if (!bounds.width || !bounds.height) return
        const x = Math.max(0, Math.min(1, (pointer.x - bounds.left) / bounds.width))
        const y = Math.max(0, Math.min(1, (pointer.y - bounds.top) / bounds.height))
        element.dataset.tilting = 'true'
        element.style.setProperty('--tilt-x', `${(0.5 - y) * 8}deg`)
        element.style.setProperty('--tilt-y', `${(x - 0.5) * 8}deg`)
        element.style.setProperty('--shine-x', `${x * 100}%`)
        element.style.setProperty('--shine-y', `${y * 100}%`)
      })
    }
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerleave', reset)
    element.addEventListener('pointercancel', reset)
    media.addEventListener('change', reset)
    window.addEventListener('blur', reset)
    return () => {
      reset()
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerleave', reset)
      element.removeEventListener('pointercancel', reset)
      media.removeEventListener('change', reset)
      window.removeEventListener('blur', reset)
    }
  }, [])

  return ref
}
