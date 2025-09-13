import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Hero } from "@/components/sections/Hero"
import { Features } from "@/components/sections/Features"
import { HowItWorks } from "@/components/sections/HowItWorks"
import { Contact } from "@/components/sections/Contact"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="landing" />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
