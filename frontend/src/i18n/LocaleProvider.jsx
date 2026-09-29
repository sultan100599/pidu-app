import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'
import { getLocale, setLocale, subscribeLocale, t } from './locale.js'

const LocaleContext = createContext(null)

export function LocaleProvider({ children }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, () => 'id')
  useEffect(() => {
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('Pidu-App: catat pemasukan & pengeluaran, rekap harian sampai tahunan, budget, dan export Excel/PDF.'))
  }, [locale])
  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
}

export const useLocale = () => useContext(LocaleContext)
export function useT() {
  useLocale()
  return t
}
