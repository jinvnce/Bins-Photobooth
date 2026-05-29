import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Loader from '../components/ui/Loader'
import type { ReactNode } from 'react'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <Loader message="checking session..." />
  if (!user) return <Navigate to="/auth" replace />

  return <>{children}</>
}