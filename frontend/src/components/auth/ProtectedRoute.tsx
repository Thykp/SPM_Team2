import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-6">Loading…</div>
  if (!user) return <Navigate to="/signin" replace />
  return <Outlet />
}
