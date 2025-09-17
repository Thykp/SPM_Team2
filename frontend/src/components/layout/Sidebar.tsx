import { Link, useLocation } from "react-router-dom"
import { Home, Users, Settings, BarChart3, FileText, Calendar, MessageSquare, HelpCircle, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navigation = [
  { name: "Dashboard", href: "/app", icon: Home },
  { name: "Projects", href: "/app/projects", icon: FolderOpen },
  { name: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { name: "Users", href: "/app/users", icon: Users },
  { name: "Documents", href: "/app/documents", icon: FileText },
  { name: "Calendar", href: "/app/calendar", icon: Calendar },
  { name: "Messages", href: "/app/messages", icon: MessageSquare },
]

const secondaryNavigation = [
  { name: "Settings", href: "/app/settings", icon: Settings },
  { name: "Help", href: "/app/help", icon: HelpCircle },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      {/* Brand */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link to="/app" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-xl">AppName</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
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
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">Free Plan</p>
          </div>
        </div>
      </div>
    </div>
  )
}
