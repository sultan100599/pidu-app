import { useLocale } from '../i18n/LocaleProvider'
import { locales } from '../i18n/locale'

export default function LanguagePicker() {
  const { locale, setLocale, t } = useLocale()
  const index = locales.findIndex((item) => item.value === locale)
  const current = locales[index]
  const next = locales[(index + 1) % locales.length]
  const label = t('Bahasa: {current}. Ganti ke {next}', {
    current: t(current.name), next: t(next.name),
  })
  // Nama aksesibel diawali teks yang terlihat (ID/EN/SU) supaya cocok dengan perintah suara (WCAG 2.5.3).
  return <button type="button" className="btn locale-button"
    aria-label={`${current.code}. ${label}`} title={label} onClick={() => setLocale(next.value)}>
    {current.code}
  </button>
}
