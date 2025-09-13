import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

const steps = [
  {
    step: "01",
    title: "Sign Up",
    description: "Create your account in seconds and get access to all features.",
  },
  {
    step: "02",
    title: "Configure",
    description: "Set up your project with our intuitive configuration wizard.",
  },
  {
    step: "03",
    title: "Deploy",
    description: "Push your code and watch it deploy automatically to production.",
  },
  {
    step: "04",
    title: "Scale",
    description: "Monitor performance and scale seamlessly as your app grows.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Get started in minutes with our streamlined workflow designed for developers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {step.step}
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base leading-relaxed">{step.description}</CardDescription>
                </CardContent>
              </Card>

              {/* Arrow connector for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
