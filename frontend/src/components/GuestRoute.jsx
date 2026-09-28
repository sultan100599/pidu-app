import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FullPageSpinner from './FullPageSpinner'

export default function GuestRoute() {
  const { user, initializing } = useAuth()

  if (initializing) {
    return <FullPageSpinner />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
