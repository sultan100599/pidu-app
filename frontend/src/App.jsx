import { Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import AppLayout from './components/layout/AppLayout'
import GuestRoute from './components/GuestRoute'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import PlaceholderPage from './pages/PlaceholderPage'
import RegisterPage from './pages/RegisterPage'
import { useTheme } from './context/ThemeContext'

export default function App() {
  const { theme } = useTheme()

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme={theme} />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<PlaceholderPage title="Dashboard" phase={5} />} />
            <Route path="transactions" element={<PlaceholderPage title="Transaksi" phase={4} />} />
            <Route path="categories" element={<PlaceholderPage title="Kategori" phase={4} />} />
            <Route path="reports/daily" element={<PlaceholderPage title="Rekap Harian" phase={6} />} />
            <Route path="reports/weekly" element={<PlaceholderPage title="Rekap Mingguan" phase={6} />} />
            <Route path="reports/monthly" element={<PlaceholderPage title="Rekap Bulanan" phase={6} />} />
            <Route path="reports/yearly" element={<PlaceholderPage title="Rekap Tahunan" phase={6} />} />
            <Route path="reports/calendar" element={<PlaceholderPage title="Kalender" phase={6} />} />
            <Route path="budgets" element={<PlaceholderPage title="Budget" phase={7} />} />
            <Route path="export" element={<PlaceholderPage title="Export" phase={8} />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}
