import { useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import { PAYMENT_METHODS, TRANSACTION_TYPES } from '../../constants/enums'
import { PERIOD_PRESETS } from '../../utils/period'

export default function TransactionFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  categories,
  categoryId,
  onCategoryChange,
  paymentMethod,
  onPaymentMethodChange,
  wallets = [],
  walletId,
  onWalletChange,
  period,
  onPeriodChange,
  customStart,
  onCustomStartChange,
  customEnd,
  onCustomEndChange,
  customError,
  activeCount,
  onReset,
}) {
  const t = useT()
  const [open, setOpen] = useState(false)

  const options = type ? categories.filter((c) => c.type === type) : categories
  const expenseOptions = options.filter((c) => c.type === 'expense')
  const incomeOptions = options.filter((c) => c.type === 'income')
  // Saringan dompet hanya muncul kalau dompetnya lebih dari satu; kolom lain menyempit.
  const showWallet = wallets.length > 1

  return (
    <div className={`card transaction-filters mb-3 ${open ? '' : 'is-closed'}`}>
      <div className="card-body py-2 py-md-3">
        <div className={`d-flex justify-content-between align-items-center d-md-none ${open ? 'mb-2' : ''}`}>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            <i className="bi bi-funnel me-1" aria-hidden="true"></i>
            {t('Filter')}
            {activeCount > 0 && <span className="badge text-bg-primary ms-2">{activeCount}</span>}
          </button>
          {activeCount > 0 && (
            <button type="button" className="btn btn-link btn-sm text-danger" onClick={onReset}>
              {t('Reset filter')}
            </button>
          )}
        </div>

        <div className={`collapse d-md-block ${open ? 'show' : ''}`}>
          <div className="row g-2 align-items-end">
            <div className={`col-12 ${showWallet ? 'col-lg-2' : 'col-lg-3'}`}>
              <label htmlFor="filter-search" className="form-label small mb-1">
                {t('Cari')}
              </label>
              <div className="input-group">
                <span className="input-group-text" aria-hidden="true">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="search"
                  className="form-control"
                  id="filter-search"
                  placeholder={t('Deskripsi atau catatan')}
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <label htmlFor="filter-type" className="form-label small mb-1">
                {t('Jenis')}
              </label>
              <select id="filter-type" className="form-select" value={type} onChange={(e) => onTypeChange(e.target.value)}>
                <option value="">{t('Semua')}</option>
                {Object.entries(TRANSACTION_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {t(label)}
                  </option>
                ))}
              </select>
            </div>
            <div className={`col-6 col-md-3 ${showWallet ? 'col-lg-2' : 'col-lg-3'}`}>
              <label htmlFor="filter-category" className="form-label small mb-1">
                {t('Kategori')}
              </label>
              <select
                id="filter-category"
                className="form-select"
                value={categoryId}
                onChange={(e) => onCategoryChange(e.target.value)}
              >
                <option value="">{t('Semua kategori')}</option>
                {expenseOptions.length > 0 && (
                  <optgroup label={t('Pengeluaran')}>
                    {expenseOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {incomeOptions.length > 0 && (
                  <optgroup label={t('Pemasukan')}>
                    {incomeOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            {showWallet && (
              <div className="col-6 col-md-3 col-lg-2">
                <label htmlFor="filter-wallet" className="form-label small mb-1">
                  {t('Dompet')}
                </label>
                <select id="filter-wallet" className="form-select" value={walletId} onChange={(e) => onWalletChange(e.target.value)}>
                  <option value="">{t('Semua dompet')}</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-6 col-md-3 col-lg-2">
              <label htmlFor="filter-payment" className="form-label small mb-1">
                {t('Metode')}
              </label>
              <select
                id="filter-payment"
                className="form-select"
                value={paymentMethod}
                onChange={(e) => onPaymentMethodChange(e.target.value)}
              >
                <option value="">{t('Semua metode')}</option>
                {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {t(label)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <label htmlFor="filter-period" className="form-label small mb-1">
                {t('Periode')}
              </label>
              <select id="filter-period" className="form-select" value={period} onChange={(e) => onPeriodChange(e.target.value)}>
                {PERIOD_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {t(preset.label)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {period === 'custom' && (
            <div className="row g-2 align-items-end mt-1">
              <div className="col-6 col-md-3">
                <label htmlFor="filter-start" className="form-label small mb-1">
                  {t('Dari tanggal')}
                </label>
                <input
                  type="date"
                  id="filter-start"
                  className={`form-control ${customError ? 'is-invalid' : ''}`}
                  value={customStart}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="filter-end" className="form-label small mb-1">
                  {t('Sampai tanggal')}
                </label>
                <input
                  type="date"
                  id="filter-end"
                  className={`form-control ${customError ? 'is-invalid' : ''}`}
                  value={customEnd}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                />
              </div>
              {customError && (
                <div className="col-12">
                  <p className="text-danger small mb-0" role="alert">
                    {t('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.')}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="d-none d-md-block mt-2">
            {activeCount > 0 && (
              <button type="button" className="btn btn-link btn-sm text-danger px-0" onClick={onReset}>
                <i className="bi bi-x-lg me-1" aria-hidden="true"></i>
                {t('Reset filter')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
