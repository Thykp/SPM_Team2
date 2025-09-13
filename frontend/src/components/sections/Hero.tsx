import { Link } from "react-router-dom"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function Hero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-6">
            Build amazing apps with <span className="text-primary">modern tools</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto leading-relaxed">
            Create beautiful, responsive applications with our powerful platform. Ship faster, scale better, and delight
            your users.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/signup">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 bg-transparent">
              <Link to="/signin">
                <Play className="mr-2 h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>

          {/* Product Screenshot Placeholder */}
          <Card className="mx-auto max-w-4xl overflow-hidden shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                  <Play className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Product Demo</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    See how our platform helps you build better applications faster
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
