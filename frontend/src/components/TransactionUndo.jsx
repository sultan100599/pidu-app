import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import * as transactionsApi from '../api/transactions'
import { getErrorMessage, getFieldErrors } from '../utils/errors'
import { useAuth } from '../context/AuthContext'

export default function TransactionUndo({ transaction, onRestored, closeToast, toastId, userId }) {
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
    <span>Transaksi dihapus</span>
    <button type="button" className="btn btn-outline-primary" onClick={restore} disabled={busy}>
      {busy ? 'Memulihkan…' : 'Batalkan'}
    </button>
  </div>
}
