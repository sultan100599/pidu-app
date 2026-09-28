import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FullPageSpinner, { BootErrorScreen } from './FullPageSpinner'

export default function ProtectedRoute() {
  const { user, initializing, bootError, bootRetrying, retryBootstrap } = useAuth()
  const location = useLocation()

  if (bootError) {
    return <BootErrorScreen message={bootError} onRetry={retryBootstrap} retrying={bootRetrying} />
  }

  if (initializing) {
    return <FullPageSpinner />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
