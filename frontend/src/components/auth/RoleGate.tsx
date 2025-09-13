import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import type { Role } from "@/contexts/AuthContext"

type RoleGateProps = {
  allow: Role[]
  children: React.ReactNode
  redirectTo?: string
}

export default function RoleGate({
  allow,
  children,
  redirectTo = "/app",
}: RoleGateProps) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="p-6">Loading…</div>
  if (!profile || !allow.includes(profile.role)) return <Navigate to={redirectTo} replace />
  return <>{children}</>
}
