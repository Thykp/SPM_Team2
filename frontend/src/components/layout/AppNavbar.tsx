import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./Sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { NotificationsPanel } from "@/components/ui/notifications";

export function AppNavbar() {
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const { user, profile, signOut } = useAuth()

  const email = user?.email ?? ""
  const initials = (email ? email[0] : "U").toUpperCase()

  const searchData = [
    { id: 1, name: "Dashboard", path: "/app" },
    { id: 2, name: "Projects", path: "/app/projects" },
    { id: 3, name: "Manage Users", path: "/app/manage-users" },
    { id: 4, name: "Team Task", path: "/app/team-task" },
    { id: 5, name: "Staff Tasks", path: "/app/staff-tasks" },
    { id: 6, name: "Reports", path: "/app/reports" },
  ];

  const [query, setQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState(searchData);
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setQuery(value);

    // Filter the search results based on the query
    const results = searchData.filter((item) =>
      item.name.toLowerCase().includes(value)
    );
    setFilteredResults(results);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="grid grid-cols-[auto_1fr_auto] items-center h-16 gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>

          <Link to="/app" className="flex items-center space-x-2 md:hidden">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">A</span>
            </div>
            <span className="font-semibold">AppName</span>
          </Link>
        </div>

        <div className={`min-w-0 ${showMobileSearch ? "block" : "hidden md:block"}`}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                value={query} // Bind the input value to the query state
                onChange={handleSearch} // Call handleSearch on input change
                className="w-full pl-10 pr-4 py-2 text-sm bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                onBlur={() => setShowMobileSearch(false)}
              />
              {/* Search Results Dropdown */}
              {query && (
                <div className="absolute top-12 left-0 w-full bg-white shadow-lg border rounded-md z-50">
                  {filteredResults.length > 0 ? (
                    <ul>
                      {filteredResults.map((item) => (
                        <li key={item.id} className="p-2 hover:bg-gray-100">
                          <Link
                            to={item.path}
                            onClick={() => setQuery("")} // Clear the query to close the dropdown
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-2 text-sm text-gray-500">No results found.</p>
                  )}
                </div>
              )}
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            aria-label="Toggle search"
          >
            {showMobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          <NotificationsPanel userId={user?.id ?? "e9cd9203-e8d2-42fa-a081-b2db6bc443a5"} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/diverse-user-avatars.png" alt={email || "User"} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{email || "Signed in"}</p>
                  <p className="text-xs leading-none text-muted-foreground">Role: {profile?.role ?? "—"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/profile">Profile</Link>
              </DropdownMenuItem>
              {(profile?.role === "Director" || profile?.role === "Staff" || profile?.role === "Manager" || profile?.role === "Senior Management") && (
                <DropdownMenuItem asChild>
                  <Link to="/app/settings">Settings</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
