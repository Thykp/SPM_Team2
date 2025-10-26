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
  const isHR = profile?.department_id === "00000000-0000-0000-0000-000000000005"; // HR department ID
  if (!profile || (!allow.includes(profile.role) && !(isHR && profile.role === "Staff"))) return <Navigate to={redirectTo} replace />
  return <>{children}</>
}
