"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, Bell, Search, X } from "lucide-react"
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

export function AppNavbar() {
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const { user, profile, signOut } = useAuth()

  const email = user?.email ?? ""
  const initials = (email ? email[0] : "U").toUpperCase()
  const canSeeSettings = profile?.role === "Admin" || profile?.role === "Staff"

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile Sidebar Toggle */}
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

        {/* Brand (mobile only) */}
        <Link to="/app" className="flex items-center space-x-2 md:hidden">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">A</span>
          </div>
          <span className="font-semibold">AppName</span>
        </Link>

        {/* Search */}
        <div className={`flex-1 max-w-md ${showMobileSearch ? "block" : "hidden md:block"}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              onBlur={() => setShowMobileSearch(false)}
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            aria-label="Toggle search"
          >
            {showMobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-xs flex items-center justify-center">
              <span className="sr-only">3 notifications</span>
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  {/* If you store an avatar URL in profile later, place it here */}
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
              {canSeeSettings && (
                <DropdownMenuItem asChild>
                  <Link to="/app/settings">Settings</Link>
                </DropdownMenuItem>
              )}
              {/* Example: keep Billing visible to all, or gate it if needed */}
              <DropdownMenuItem asChild>
                <Link to="/app/setting">Billing</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
