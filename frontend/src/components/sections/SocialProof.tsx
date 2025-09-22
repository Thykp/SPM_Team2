import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Engineering Team Lead",
    content:
      "Our sprint planning and task tracking has never been more organized. The team loves the intuitive interface.",
    department: "Engineering",
  },
  {
    name: "Marcus Rodriguez",
    role: "Product Manager",
    content:
      "Finally, a single place where we can see project progress across all departments. Game changer for coordination.",
    department: "Product",
  },
  {
    name: "Emily Johnson",
    role: "Marketing Director",
    content:
      "The collaboration features have streamlined our campaign workflows. We're delivering projects faster than ever.",
    department: "Marketing",
  },
]

export function SocialProof() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by our teams</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            See how different departments are using our platform to stay organized and productive
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium mb-4">
                  <Users className="h-3 w-3" />
                  {testimonial.department}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">150+</div>
            <div className="text-sm text-muted-foreground">Team Members</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">2.5K+</div>
            <div className="text-sm text-muted-foreground">Tasks Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">40%</div>
            <div className="text-sm text-muted-foreground">Faster Delivery</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">12</div>
            <div className="text-sm text-muted-foreground">Departments</div>
          </div>
        </div>
      </div>
    </section>
  )
}
