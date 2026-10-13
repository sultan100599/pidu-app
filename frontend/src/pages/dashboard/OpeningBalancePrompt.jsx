import { useState } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import { toast } from '../../i18n/toast'
import * as authApi from '../../api/auth'
import AmountInput from '../../components/ui/AmountInput'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'

// Ditampilkan sekali selama saldo awal belum pernah diisi atau dilewati.
export default function OpeningBalancePrompt({ onSaved }) {
  const t = useT()
  const { setUser } = useAuth()
  const [amount, setAmount] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(value) {
    if (saving) return
    setSaving(true)
    try {
      const response = await authApi.updateAccount({ opening_balance: value })
      setUser(response.data.data)
      toast.success(value > 0 ? 'Saldo awal disimpan.' : 'Saldo dimulai dari Rp 0. Bisa diubah kapan saja di menu Akun.')
      onSaved()
    } catch (err) {
      setError(getFieldErrors(err).opening_balance ?? getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card opening-balance-prompt mb-3" aria-labelledby="opening-balance-title">
      <div className="card-body">
        <h2 id="opening-balance-title" className="h5 mb-1">{t('Berapa uang kamu sekarang?')}</h2>
        <p className="text-body-secondary mb-3">
          {t('Isi sekali saja supaya saldo di Pidu sama dengan uang kamu yang sebenarnya. Hitung semuanya: dompet, rekening, dan e-wallet.')}
        </p>
        <form
          className="opening-balance-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (amount == null) return setError('Isi jumlah uang, atau pilih mulai dari Rp 0.')
            save(amount)
          }}
        >
          <label htmlFor="opening-balance" className="visually-hidden">{t('Saldo awal')}</label>
          <AmountInput
            id="opening-balance"
            value={amount}
            invalid={Boolean(error)}
            onChange={(value) => { setAmount(value); setError('') }}
          />
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {t('Simpan')}
          </button>
          <button type="button" className="btn btn-link" onClick={() => save(0)} disabled={saving}>
            {t('Mulai dari Rp 0')}
          </button>
        </form>
        {error && <div className="text-danger small mt-2" role="alert">{t(error)}</div>}
      </div>
    </section>
  )
}
