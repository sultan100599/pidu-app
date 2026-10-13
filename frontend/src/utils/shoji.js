export const SHOJI_TIMING = { close: 380, hold: 120, open: 420 }
export const SHOJI_EASING = 'cubic-bezier(0.45, 0, 0.2, 1)'

export function createShojiTransition({ overlay, doors, applyTheme, reducedMotion }) {
  let active = null

  function commit(run) {
    if (run.committed) return
    run.committed = true
    applyTheme(run.theme)
  }

  function clear(run, restoreFocus = true) {
    if (active !== run) return
    active = null
    run.animations.forEach((animation) => animation.cancel())
    overlay.hidden = true
    if (restoreFocus && run.trigger?.isConnected) run.trigger.focus({ preventScroll: true })
  }

  async function start(theme, trigger) {
    if (active) return false
    const run = { theme, trigger, animations: [], committed: false }
    active = run
    if (reducedMotion() || doors.some((door) => !door.animate)) {
      commit(run)
      clear(run)
      return true
    }
    overlay.setAttribute('data-bs-theme', theme)
    overlay.hidden = false
    try {
      run.animations = doors.map((door, index) => door.animate([
        { transform: `translateX(${index === 0 ? '-101%' : '101%'})`, offset: 0, easing: SHOJI_EASING },
        { transform: 'translateX(0)', offset: SHOJI_TIMING.close / (SHOJI_TIMING.close + SHOJI_TIMING.hold) },
        { transform: 'translateX(0)', offset: 1 },
      ], { duration: SHOJI_TIMING.close + SHOJI_TIMING.hold, fill: 'forwards' }))
      await Promise.all(run.animations.map((animation) => animation.finished))
      if (active !== run) return false
      // Chart.js reads CSS during render, so commit the attribute before opening.
      commit(run)
      const opening = doors.map((door, index) => door.animate([
        { transform: 'translateX(0)' },
        { transform: `translateX(${index === 0 ? '-101%' : '101%'})` },
      ], { duration: SHOJI_TIMING.open, easing: SHOJI_EASING, fill: 'forwards' }))
      run.animations.push(...opening)
      await Promise.all(opening.map((animation) => animation.finished))
      clear(run)
      return true
    } catch {
      if (active === run) {
        commit(run)
        clear(run)
      }
      return false
    }
  }

  return {
    start,
    finish() {
      if (!active) return
      commit(active)
      clear(active)
    },
    dispose() {
      if (active) clear(active, false)
    },
  }
}
