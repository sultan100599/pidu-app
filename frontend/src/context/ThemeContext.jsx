import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createShojiTransition } from '../utils/shoji'

const THEME_KEY = 'pidu_theme'

function getInitialTheme() {
  let stored
  try { stored = localStorage.getItem(THEME_KEY) } catch { /* Theme remains available when storage is blocked. */ }
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)
  const overlayRef = useRef(null)
  const transitionRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* Keep the current session's theme. */ }
  }, [theme])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const transition = createShojiTransition({
      overlay: overlayRef.current,
      doors: Array.from(overlayRef.current.children),
      reducedMotion: () => preference.matches,
      applyTheme(next) {
        document.documentElement.setAttribute('data-bs-theme', next)
        try { localStorage.setItem(THEME_KEY, next) } catch { /* Storage is optional. */ }
        setTheme(next)
      },
    })
    transitionRef.current = transition
    const onMotionChange = () => { if (preference.matches) transition.finish() }
    preference.addEventListener('change', onMotionChange)
    return () => {
      preference.removeEventListener('change', onMotionChange)
      transition.dispose()
      transitionRef.current = null
    }
  }, [])

  function toggleTheme(event) {
    transitionRef.current?.start(theme === 'dark' ? 'light' : 'dark', event?.currentTarget ?? document.activeElement)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      {createPortal(<div ref={overlayRef} className="shoji-overlay" aria-hidden="true" hidden>
        <div className="shoji-door" /><div className="shoji-door" />
      </div>, document.body)}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme harus dipakai di dalam ThemeProvider')
  }
  return context
}
