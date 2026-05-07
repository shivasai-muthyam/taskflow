import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export const ProtectedRoute = () => {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="p-6 text-slate-600">Loading...</div>
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />
}
