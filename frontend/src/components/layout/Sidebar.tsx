import { Link, useLocation } from "react-router-dom"
import { Home, Users, Settings, FileText, HelpCircle, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/AuthContext"

const navigation = [
  { name: "Dashboard", href: "/app", icon: Home },
  { name: "Projects", href: "/app/projects", icon: FolderOpen },
  { name: "Manage Users", href: "/app/manage-users", icon: Users },
  { name: "Team Tasks", href: "/app/team-task", icon: Users },
  { name: "Reports", href: "/app/reports", icon: FileText },
]

const secondaryNavigation = [
  { name: "Notification Settings", href: "/app/settings", icon: Settings },
  { name: "Help", href: "/app/help", icon: HelpCircle },
]

function getInitials(input?: string) {
  if (!input) return "U"
  const s = input.trim()
  const base = s.includes("@") ? s.split("@")[0] : s
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

export function Sidebar() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const userRole = profile?.role;

  // Filter navigation based on user role
  const visibleNavigation = navigation.filter(item => {
    if (item.href === "/app/manage-users") {
      // Only show to Manager, Director, Senior Management (NOT Staff)
      return userRole && (["Manager", "Director", "Senior Management"].includes(userRole) || profile?.department_id === "00000000-0000-0000-0000-000000000005");
    }
    if (item.href === "/app/team-task") {
      // Only show to Staff and Managers
      return userRole === "Staff" || userRole === "Manager";
    }
    // Show dashboard, projects, reports to everyone
    return true;
  });

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <Link to="/app" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">L</span>
          </div>
          <span className="font-bold text-xl">Lira</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {visibleNavigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Button
              key={item.name}
              variant={isActive ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-3 h-10", isActive && "bg-secondary")}
              asChild
            >
              <Link to={item.href}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            </Button>
          )
        })}

        <Separator className="my-4" />

        {secondaryNavigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Button
              key={item.name}
              variant={isActive ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-3 h-10", isActive && "bg-secondary")}
              asChild
            >
              <Link to={item.href}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            </Button>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        {(() => {
          const displayName = profile?.display_name || user?.email || "User"
          const initials = getInitials(displayName)

          return (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
