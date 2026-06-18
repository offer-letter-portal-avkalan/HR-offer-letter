import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PageSpinner } from '@/components/ui/Spinner'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  role?: UserRole
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <PageSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'hr_admin' ? '/hr' : '/candidate'} replace />
  }

  return <>{children}</>
}
