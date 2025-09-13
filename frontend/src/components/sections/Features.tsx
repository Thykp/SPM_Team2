import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Shield, Smartphone, Globe, Code, Users } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built for speed with modern technologies and optimized performance.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Enterprise-grade security with built-in protection and compliance.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Responsive design that works perfectly on all devices and screen sizes.",
  },
  {
    icon: Globe,
    title: "Global Scale",
    description: "Deploy worldwide with edge computing and CDN integration.",
  },
  {
    icon: Code,
    title: "Developer Friendly",
    description: "Clean APIs, comprehensive docs, and powerful development tools.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Built-in collaboration tools for teams of any size.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to succeed</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Powerful features designed to help you build, deploy, and scale your applications with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
