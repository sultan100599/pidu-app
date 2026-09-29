import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n/LocaleProvider'
import { toast } from '../i18n/toast'
import * as transactionsApi from '../api/transactions'
import { getErrorMessage, getFieldErrors } from '../utils/errors'
import { useAuth } from '../context/AuthContext'

export default function TransactionUndo({ transaction, onRestored, closeToast, toastId, userId }) {
  const t = useT()
  const { user } = useAuth()
  const locked = useRef(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (user?.id !== userId) closeToast()
  }, [user?.id, userId, closeToast])
  async function restore() {
    if (locked.current || user?.id !== userId) return
    locked.current = true
    toast.pause({ id: toastId })
    setBusy(true)
    try {
      await transactionsApi.create({
        transaction_date: transaction.transaction_date,
        type: transaction.type,
        category_id: transaction.category?.id ?? transaction.category_id,
        amount: transaction.amount,
        payment_method: transaction.payment_method,
        description: transaction.description,
        notes: transaction.notes,
      })
      onRestored()
      toast.success('Transaksi dipulihkan')
    } catch (error) {
      const fields = Object.values(getFieldErrors(error)).filter(Boolean)
      toast.error(fields.length ? fields.join(' ') : getErrorMessage(error))
    } finally {
      closeToast()
    }
  }
  return <div className="transaction-undo" onFocus={() => toast.pause({ id: toastId })}
    onBlur={(event) => { if (!locked.current && !event.currentTarget.contains(event.relatedTarget)) toast.play({ id: toastId }) }}>
    <span>{t('Transaksi dihapus')}</span>
    <button type="button" className="btn btn-outline-primary" onClick={restore} disabled={busy}>
      {t(busy ? 'Memulihkan…' : 'Batalkan')}
    </button>
  </div>
}
