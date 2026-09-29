import * as categoriesApi from '../api/categories'
import { useFetch } from './useFetch'

export function useCategories() {
  const { data, loading, error, reload } = useFetch('categories', () => categoriesApi.list())
  return { categories: data?.data ?? [], loading, error, loaded: data != null, refetch: reload }
}
