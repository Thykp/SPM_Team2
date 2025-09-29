import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">A</span>
            </div>
            <span className="font-semibold">AppName</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Support
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">© 2024 AppName. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
