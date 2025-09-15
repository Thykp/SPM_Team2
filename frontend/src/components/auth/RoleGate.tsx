import { Navigate } from "react-router-dom"
import { useAuth, type Role } from "@/contexts/AuthContext"

type RoleGateProps = {
  allow: Role[]
  children: React.ReactNode
  redirectTo?: string
}

export default function RoleGate({ allow, children, redirectTo = "/app" }: RoleGateProps) {
  const { profile, profileLoading } = useAuth()
  if (profileLoading) return <div className="p-6">Loading (profile)…</div>
  if (!profile || !allow.includes(profile.role)) return <Navigate to={redirectTo} replace />
  return <>{children}</>
}
