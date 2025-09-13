import { Outlet } from "react-router-dom"
import { AppNavbar } from "@/components/layout/AppNavbar"
import { Sidebar } from "@/components/layout/Sidebar"

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-shrink-0">
          <Sidebar />
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <AppNavbar />

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
