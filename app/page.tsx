import { Dashboard } from "@/components/dashboard"
import { Droplets } from "lucide-react"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Droplets className="h-4 w-4" />
          Real-Time Monitoring
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Water Quality Dashboard</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Monitor your water quality in real-time with IoT sensors and ML-powered predictions for safe drinking water
          analysis.
        </p>
      </div>

      {/* Dashboard */}
      <Dashboard />
    </div>
  )
}
