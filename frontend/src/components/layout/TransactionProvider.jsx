import { useCallback, useEffect, useState } from 'react'
import { TransactionContext } from '../../context/TransactionContext'
import { useAuth } from '../../context/AuthContext'
import { useCategories } from '../../hooks/useCategories'
import { useWallets } from '../../hooks/useWallets'
import TransactionFormModal from '../../pages/transactions/TransactionFormModal'

function TransactionDialog({ form, onClose, onSaved }) {
  const { categories, loading, error, refetch } = useCategories()
  const { wallets } = useWallets()
  return <TransactionFormModal show transaction={form.transaction} categories={categories} wallets={wallets}
    categoriesLoading={loading} categoriesError={error} onRetryCategories={refetch}
    onClose={onClose} onSaved={onSaved} />
}

export default function TransactionProvider({ children }) {
  const { user } = useAuth()
  const [dataVersion, setDataVersion] = useState(0)
  const [form, setForm] = useState(null)
  const refreshTransactions = useCallback(() => setDataVersion((v) => v + 1), [])
  const openCreate = useCallback(() => setForm({ transaction: null }), [])
  const openEdit = useCallback((transaction) => setForm({ transaction }), [])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key.toLowerCase() !== 'n' || event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.isComposing) return
      if (!window.matchMedia('(min-width: 992px)').matches) return
      if (event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')) return
      if (document.querySelector('[aria-modal="true"], .modal.show, .offcanvas.show')) return
      event.preventDefault()
      openCreate()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openCreate])

  return (
    <TransactionContext.Provider value={{ dataVersion, refreshTransactions, openCreate, openEdit, userId: user?.id }}>
      {children}
      {form && <TransactionDialog form={form} onClose={() => setForm(null)} onSaved={refreshTransactions} />}
    </TransactionContext.Provider>
  )
}
