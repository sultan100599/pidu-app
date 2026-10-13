import { useSyncExternalStore } from 'react'

// Sama dengan breakpoint lg Bootstrap: sidebar tetap, bottom nav hilang.
const query = '(min-width: 992px)'
const subscribe = (onChange) => {
  const media = window.matchMedia(query)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export function useDesktop() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true)
}
