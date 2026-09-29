import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { formatRupiah } from '../utils/format'

export default function AnimatedBalance({ value }) {
  const reducedMotion = useReducedMotion()
  const numberRef = useRef(null)
  const previous = useRef(0)
  const first = useRef(true)
  useEffect(() => {
    const node = numberRef.current
    const startValue = previous.current
    const duration = first.current ? 600 : 300
    if (reducedMotion || startValue === value) {
      first.current = false
      node.textContent = formatRupiah(value)
      previous.current = value
      return undefined
    }
    let frame
    let start
    node.textContent = formatRupiah(startValue)
    function step(time) {
      start ??= time
      const progress = Math.min(1, (time - start) / duration)
      const next = progress === 1 ? value : startValue + (value - startValue) * (1 - (1 - progress) ** 3)
      node.textContent = formatRupiah(next)
      previous.current = next
      if (progress === 1) first.current = false
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, reducedMotion])
  return <><span ref={numberRef} aria-hidden="true">{formatRupiah(value)}</span><span className="visually-hidden">{formatRupiah(value)}</span></>
}
