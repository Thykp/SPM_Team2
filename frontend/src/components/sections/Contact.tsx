import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageSquare, Phone } from "lucide-react"

export function Contact() {
  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Get in touch</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow text-center">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Email</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Send us an email and we'll get back to you within 24 hours.
              </CardDescription>
              <Button variant="outline" className="w-full bg-transparent">
                hello@appname.com
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow text-center">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">Chat with our team for instant support and answers.</CardDescription>
              <Button variant="outline" className="w-full bg-transparent">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow text-center">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Phone</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Call us during business hours for immediate assistance.
              </CardDescription>
              <Button variant="outline" className="w-full bg-transparent">
                +1 (555) 123-4567
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
