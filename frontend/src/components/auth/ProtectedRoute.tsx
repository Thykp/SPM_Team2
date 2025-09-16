import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

export default function ProtectedRoute() {
  const { user, authLoading } = useAuth()
  const location = useLocation()

  if (authLoading) return <div className="p-6">Loading (auth)…</div>
  if (!user) return <Navigate to="/signin" replace state={{ from: location }} />
  return <Outlet />
}
