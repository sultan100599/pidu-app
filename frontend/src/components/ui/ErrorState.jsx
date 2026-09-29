import { useT } from '../../i18n/LocaleProvider'

export default function ErrorState({ message, onRetry, retrying = false }) {
  const t = useT()
  return (
    <div className="card state-card">
      <div className="card-body text-center py-5">
        <i className="bi bi-exclamation-triangle display-4 text-danger" aria-hidden="true"></i>
        <h2 className="h5 mt-3">{t('Terjadi kesalahan')}</h2>
        <p className="text-body-secondary mb-3">{t(message)}</p>
        <button type="button" className="btn btn-primary" onClick={onRetry} disabled={retrying}>
          {retrying && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
          {t('Coba lagi')}
        </button>
      </div>
    </div>
  )
}
