import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function FullscreenLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-sm font-semibold text-slate-600">Carregando sessao...</p>
    </div>
  )
}

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <FullscreenLoading />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function PublicOnly() {
  const { user, loading } = useAuth()

  if (loading) {
    return <FullscreenLoading />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
