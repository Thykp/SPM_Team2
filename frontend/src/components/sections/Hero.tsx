import { Link } from "react-router-dom"
import { ArrowRight, CheckCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function Hero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-card border rounded-full px-4 py-2 mb-6">
                <Users className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Your team's productivity hub</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-6">
                Streamline your <span className="text-primary">team's workflow</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Organize projects, track progress, and collaborate seamlessly. Everything your team needs to stay
                productive and aligned.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Real-time collaboration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Progress tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Team insights</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Button size="lg" asChild className="text-base px-8 h-12">
                  <Link to="/signup">
                    Access dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base px-8 h-12 bg-transparent">
                  <Link to="/signin">Sign in</Link>
                </Button>
              </div>

              <div className="text-center lg:text-left">
                <p className="text-sm text-muted-foreground mb-4">Used across departments</p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 opacity-60">
                  <div className="text-lg font-semibold">Engineering</div>
                  <div className="text-lg font-semibold">Marketing</div>
                  <div className="text-lg font-semibold">Sales</div>
                  <div className="text-lg font-semibold">Operations</div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="relative">
                <Card className="overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-card to-card/50">
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 p-8">
                    <div className="h-full bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-medium">Sprint Board</div>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        </div>
                      </div>

                      {/* Kanban columns */}
                      <div className="flex gap-3 flex-1">
                        {/* To Do column */}
                        <div className="flex-1 bg-muted/30 rounded-md p-2">
                          <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center justify-between">
                            <span>To Do</span>
                            <span className="bg-muted-foreground/20 rounded-full px-1.5 py-0.5 text-[10px]">3</span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="bg-background rounded p-1.5 border border-border/50">
                              <div className="w-full h-1.5 bg-blue-200 rounded mb-1"></div>
                              <div className="text-[10px] text-muted-foreground">API Integration</div>
                            </div>
                            <div className="bg-background rounded p-1.5 border border-border/50">
                              <div className="w-full h-1.5 bg-green-200 rounded mb-1"></div>
                              <div className="text-[10px] text-muted-foreground">UI Design</div>
                            </div>
                          </div>
                        </div>

                        {/* In Progress column */}
                        <div className="flex-1 bg-yellow-50/50 rounded-md p-2">
                          <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center justify-between">
                            <span>In Progress</span>
                            <span className="bg-yellow-200 rounded-full px-1.5 py-0.5 text-[10px]">2</span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="bg-background rounded p-1.5 border border-border/50">
                              <div className="w-3/4 h-1.5 bg-yellow-400 rounded mb-1"></div>
                              <div className="text-[10px] text-muted-foreground">Database Setup</div>
                            </div>
                            <div className="bg-background rounded p-1.5 border border-border/50">
                              <div className="w-1/2 h-1.5 bg-orange-400 rounded mb-1"></div>
                              <div className="text-[10px] text-muted-foreground">Testing</div>
                            </div>
                          </div>
                        </div>

                        {/* Done column */}
                        <div className="flex-1 bg-green-50/50 rounded-md p-2">
                          <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center justify-between">
                            <span>Done</span>
                            <span className="bg-green-200 rounded-full px-1.5 py-0.5 text-[10px]">5</span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="bg-background rounded p-1.5 border border-border/50">
                              <div className="w-full h-1.5 bg-green-400 rounded mb-1"></div>
                              <div className="text-[10px] text-muted-foreground">User Auth</div>
                            </div>
                            <div className="bg-background rounded p-1.5 border border-border/50">
                              <div className="w-full h-1.5 bg-green-400 rounded mb-1"></div>
                              <div className="text-[10px] text-muted-foreground">Dashboard</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                        <div className="text-xs font-medium text-primary">10 tasks completed</div>
                        <div className="text-[10px] text-muted-foreground">Sprint 2 • 3 days left</div>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="absolute -top-4 -right-4 w-20 h-20 bg-accent/20 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/20 rounded-full blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
