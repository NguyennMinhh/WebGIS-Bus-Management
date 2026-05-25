import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'

const RequireAdmin = () => {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Checking access...
      </div>
    )
  }

  if (!user?.is_authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!user.is_staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Access denied
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            Admin access required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your account can use the map and route finder, but bus network
            management is limited to staff users.
          </p>
        </div>
      </div>
    )
  }

  return <Outlet />
}

export default RequireAdmin
