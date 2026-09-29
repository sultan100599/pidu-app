import { toast as baseToast } from 'react-toastify'
import { useT } from './LocaleProvider'

function ToastMessage({ message }) {
  const t = useT()
  return <>{t(message)}</>
}

export function ToastCloseButton({ closeToast }) {
  const t = useT()
  return <button type="button" className="Toastify__close-button" onClick={closeToast} aria-label={t('Tutup notifikasi')}>
    <i className="bi bi-x-lg" aria-hidden="true" />
  </button>
}

export const toast = { ...baseToast }
for (const kind of ['success', 'error', 'info', 'warning']) {
  toast[kind] = (message, options) => baseToast[kind](
    typeof message === 'string' ? <ToastMessage message={message} /> : message, options,
  )
}
