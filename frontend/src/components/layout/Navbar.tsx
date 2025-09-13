"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface NavbarProps {
  variant?: "landing" | "app"
}

export function Navbar({ variant = "landing" }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, profile, signOut } = useAuth()

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Landing navbar only; app uses AppNavbar
  if (variant === "app") return null

  const email = user?.email ?? ""
  const initials = (email ? email[0] : "U").toUpperCase()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-xl">AppName</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
            >
              How it works
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
            >
              Contact
            </a>
          </div>

          {/* Desktop Right: Auth / User */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/signin">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Get started</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/app">Go to App</Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      Signed in as
                      <div className="text-xs text-muted-foreground">{email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>Role: {profile?.role ?? "—"}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Drawer */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            isOpen ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col space-y-4 pt-4">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm p-2 -m-2"
              onClick={() => setIsOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm p-2 -m-2"
              onClick={() => setIsOpen(false)}
            >
              How it works
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm p-2 -m-2"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </a>

            <div className="flex flex-col space-y-2 pt-4 border-t">
              {!user ? (
                <>
                  <Button variant="ghost" asChild className="justify-start" onClick={() => setIsOpen(false)}>
                    <Link to="/signin">Sign in</Link>
                  </Button>
                  <Button asChild className="justify-start" onClick={() => setIsOpen(false)}>
                    <Link to="/signup">Get started</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="justify-start" onClick={() => setIsOpen(false)}>
                    <Link to="/app">Go to App</Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={async () => { await signOut(); setIsOpen(false) }}>
                    Sign out
                  </Button>
                  <div className="text-xs text-muted-foreground px-2">Role: {profile?.role ?? "—"}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
