import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { useT } from './i18n/LocaleProvider'
import { ToastCloseButton } from './i18n/toast'
import AppLayout from './components/layout/AppLayout'
import GuestRoute from './components/GuestRoute'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'
import BudgetsPage from './pages/budgets/BudgetsPage'
import CategoriesPage from './pages/categories/CategoriesPage'
import ExportPage from './pages/export/ExportPage'
import ImportPage from './pages/import/ImportPage'

import TransactionsPage from './pages/transactions/TransactionsPage'
import { useTheme } from './context/ThemeContext'

// Halaman bergrafik dimuat terpisah (lazy) supaya Chart.js tidak ikut di bundle awal
// (login, transaksi, kategori). Suspense ada di AppLayout.
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const DailyReportPage = lazy(() => import('./pages/reports/DailyReportPage'))
const WeeklyReportPage = lazy(() => import('./pages/reports/WeeklyReportPage'))
const MonthlyReportPage = lazy(() => import('./pages/reports/MonthlyReportPage'))
const YearlyReportPage = lazy(() => import('./pages/reports/YearlyReportPage'))
const CalendarPage = lazy(() => import('./pages/reports/CalendarPage'))

export default function App() {
  const t = useT()
  const { theme } = useTheme()

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme={theme} ariaLabel={t('Notifikasi') + ' (Alt+T)'} closeButton={ToastCloseButton} />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="reports/daily" element={<DailyReportPage />} />
            <Route path="reports/weekly" element={<WeeklyReportPage />} />
            <Route path="reports/monthly" element={<MonthlyReportPage />} />
            <Route path="reports/yearly" element={<YearlyReportPage />} />
            <Route path="reports/calendar" element={<CalendarPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}
