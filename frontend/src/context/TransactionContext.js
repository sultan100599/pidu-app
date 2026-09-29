import { createContext, useContext } from 'react'

export const TransactionContext = createContext({ dataVersion: 0 })
export const useTransactions = () => useContext(TransactionContext)
