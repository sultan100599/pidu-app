import { dictionaries } from './messages.js'

export const locales = [
  { value: 'id', code: 'IN', name: 'Bahasa Indonesia' },
  { value: 'en', code: 'EN', name: 'English' },
  { value: 'su', code: 'SU', name: 'Basa Sunda' },
]

let locale = 'id'
try {
  const saved = localStorage.getItem('pidu_locale')
  if (locales.some((item) => item.value === saved)) locale = saved
} catch { /* Preferensi bahasa tetap tersedia di memori. */ }
if (typeof document !== 'undefined') document.documentElement.lang = locale
const listeners = new Set()

export const getLocale = () => locale
export const subscribeLocale = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export function setLocale(next) {
  if (!locales.some((item) => item.value === next) || next === locale) return
  locale = next
  try { localStorage.setItem('pidu_locale', next) } catch { /* Storage dapat diblokir browser. */ }
  document.documentElement.lang = next
  listeners.forEach((listener) => listener())
}

const reverse = new Map()
const patterns = []
const escape = (value) => value.replace(/[.*+?^$()|[\]\\]/g, '\\$&')
for (const key of Object.keys(dictionaries.id)) {
  for (const language of ['id', 'en', 'su']) {
    const message = dictionaries[language][key]
    if (!message.includes('{')) {
      if (!reverse.has(message)) reverse.set(message, key)
      continue
    }
    const names = [...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1])
    const parts = message.split(/\{\w+\}/g).map(escape)
    const expression = parts.map((part, index) => part + (index < names.length
      ? (['count', 'number', 'max', 'min', 'copied', 'skipped'].includes(names[index]) ? '([\\d.,]+)' : '(.+?)')
      : '')).join('')
    patterns.push({ key, language, names, regex: new RegExp('^' + expression + '$'), weight: parts.join('').length })
  }
}
patterns.sort((a, b) => b.weight - a.weight)

export function t(key, params = {}) {
  if (typeof key !== 'string') return key
  let resolved = Object.hasOwn(dictionaries.id, key) ? key : reverse.get(key)
  if (!resolved) {
    for (const pattern of patterns) {
      const match = key.match(pattern.regex)
      if (!match) continue
      resolved = pattern.key
      params = Object.fromEntries(pattern.names.map((name, index) => {
        const value = match[index + 1]
        if (['attribute', 'Attribute', 'values', 'date'].includes(name)) return [name, t(value.toLowerCase())]
        if (['columns', 'choices'].includes(name)) return [name, value.split(', ').map((item) => t(item)).join(', ')]
        return [name, value]
      }))
      break
    }
  }
  if (!resolved) {
    const sentences = key.split(/(?<=\.)\s+/)
    return sentences.length > 1 ? sentences.map((sentence) => t(sentence)).join(' ') : key
  }
  const message = dictionaries[locale][resolved] ?? dictionaries.id[resolved]
  return message.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match)
}
