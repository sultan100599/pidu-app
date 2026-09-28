import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FullPageSpinner, { BootErrorScreen } from './FullPageSpinner'

export default function GuestRoute() {
  const { user, initializing, bootError, bootRetrying, retryBootstrap } = useAuth()

  if (bootError) {
    return <BootErrorScreen message={bootError} onRetry={retryBootstrap} retrying={bootRetrying} />
  }

  if (initializing) {
    return <FullPageSpinner />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
