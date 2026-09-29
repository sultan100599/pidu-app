import { download } from './download'

export function transactionsExcel(params) {
  return download('/export/excel', params)
}

export function transactionsPdf(params) {
  return download('/export/pdf', params)
}

export function allData(year) {
  return download('/export/all', { year })
}
