import { useCallback, useEffect, useState } from 'react'
import * as categoriesApi from '../api/categories'

// Semua kategori milik user (tanpa filter), urut sesuai API (type, name).
// Panggil refetch() setelah create/update/toggle/delete kategori.
export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await categoriesApi.list()
        if (!cancelled) {
          setCategories(response.data.data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [version])

  const refetch = useCallback(() => {
    setVersion((v) => v + 1)
  }, [])

  return { categories, loading, error, refetch }
}
