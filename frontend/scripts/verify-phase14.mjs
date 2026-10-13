import assert from 'node:assert/strict'
import { createShojiTransition, SHOJI_TIMING } from '../src/utils/shoji.js'

function fixture({ reduced = false, supported = true } = {}) {
  const commits = []
  const animations = []
  const overlay = { hidden: true, setAttribute(key, value) { this[key] = value } }
  const trigger = { isConnected: true, focused: 0, focus() { this.focused++ } }
  const doors = Array.from({ length: 2 }, () => supported ? {
    animate(frames, options) {
      let resolve, reject
      const finished = new Promise((yes, no) => { resolve = yes; reject = no })
      const animation = { frames, options, finished, resolve, reject, cancel() { reject(new Error('cancelled')) } }
      animations.push(animation)
      return animation
    },
  } : {})
  const transition = createShojiTransition({ overlay, doors, applyTheme: (theme) => commits.push(theme), reducedMotion: () => reduced })
  return { ...transition, commits, animations, overlay, trigger }
}

let passed = 0
async function test(name, fn) {
  await fn()
  console.log(`PASS ${name}`)
  passed++
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() }

await test('initial overlay is hidden and theme is not mutated', () => {
  const f = fixture()
  assert.equal(f.overlay.hidden, true)
  assert.deepEqual(f.commits, [])
})
await test('both doors must close before a single commit; repeated clicks are ignored; focus returns', async () => {
  const f = fixture()
  const pending = f.start('dark', f.trigger)
  assert.equal(f.overlay.hidden, false)
  assert.equal(f.overlay['data-bs-theme'], 'dark')
  assert.equal(await f.start('light', f.trigger), false)
  assert.deepEqual(f.commits, [])
  assert.equal(f.animations[0].options.duration, SHOJI_TIMING.close + SHOJI_TIMING.hold)
  f.animations[0].resolve()
  await settle()
  assert.deepEqual(f.commits, [])
  f.animations[1].resolve()
  await settle()
  assert.deepEqual(f.commits, ['dark'])
  assert.equal(f.animations[2].options.duration, SHOJI_TIMING.open)
  f.animations.slice(2).forEach((a) => a.resolve())
  assert.equal(await pending, true)
  assert.equal(f.overlay.hidden, true)
  assert.equal(f.trigger.focused, 1)
  const reverse = f.start('light', f.trigger)
  f.finish()
  await reverse
  assert.deepEqual(f.commits, ['dark', 'light'])
})
for (const options of [{ reduced: true }, { supported: false }]) {
  await test(`${options.reduced ? 'reduced motion' : 'unsupported animation'} applies immediately without doors`, async () => {
    const f = fixture(options)
    await f.start('dark', f.trigger)
    assert.deepEqual(f.commits, ['dark'])
    assert.equal(f.animations.length, 0)
    assert.equal(f.overlay.hidden, true)
  })
}
await test('changing motion preference while closing finishes once and releases overlay', async () => {
  const f = fixture()
  const pending = f.start('dark', f.trigger)
  f.finish()
  await pending
  assert.deepEqual(f.commits, ['dark'])
  assert.equal(f.overlay.hidden, true)
  assert.equal(f.trigger.focused, 1)
})
await test('changing motion preference while opening never toggles twice', async () => {
  const f = fixture()
  const pending = f.start('dark', f.trigger)
  f.animations.forEach((a) => a.resolve())
  await settle()
  f.finish()
  await pending
  assert.deepEqual(f.commits, ['dark'])
})
await test('unmount cancels pending work without setting state or focusing a removed control', async () => {
  const f = fixture()
  const pending = f.start('dark', f.trigger)
  f.dispose()
  await pending
  assert.deepEqual(f.commits, [])
  assert.equal(f.overlay.hidden, true)
  assert.equal(f.trigger.focused, 0)
})
await test('animation rejection still applies the requested theme and releases the click blocker', async () => {
  const f = fixture()
  const pending = f.start('dark', f.trigger)
  f.animations[0].reject(new Error('interrupted'))
  await pending
  assert.deepEqual(f.commits, ['dark'])
  assert.equal(f.overlay.hidden, true)
})
console.log(`${passed}/${passed} checks passed.`)
