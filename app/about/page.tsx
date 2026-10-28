import { Droplets, Cpu, Activity, Thermometer, Beaker, Waves, Shield, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">About AquaSense</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          An innovative IoT-based water quality monitoring system combining advanced sensors with machine learning for
          accurate water safety predictions.
        </p>
      </div>

      {/* Project Description */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4">Project Overview</h2>
            <p className="text-muted-foreground mb-4">
              AquaSense is a comprehensive water quality monitoring solution designed to provide real-time analysis of
              water safety. Using ESP32 microcontrollers and multiple sensors, we collect critical water parameters and
              apply machine learning algorithms to predict whether water is safe for consumption.
            </p>
            <p className="text-muted-foreground">
              Our system is perfect for home use, small communities, agricultural applications, and educational
              purposes. The intuitive dashboard makes complex water chemistry data accessible and actionable for
              everyone.
            </p>
          </div>
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 flex items-center justify-center">
            <Droplets className="h-32 w-32 text-primary" />
          </div>
        </div>
      </section>

      {/* Sensor Technology */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Sensor Technology</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-fit mb-4">
              <Beaker className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">pH Sensor</h3>
            <p className="text-sm text-muted-foreground">
              Measures hydrogen ion concentration to determine water acidity or alkalinity. Range: 0-14 pH, Accuracy:
              ±0.1 pH
            </p>
          </div>

          <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 w-fit mb-4">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">TDS Sensor</h3>
            <p className="text-sm text-muted-foreground">
              Total Dissolved Solids sensor measures mineral content and purity. Range: 0-1000 ppm, Accuracy: ±2%
            </p>
          </div>

          <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-fit mb-4">
              <Waves className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Turbidity Sensor</h3>
            <p className="text-sm text-muted-foreground">
              Measures water clarity by detecting suspended particles. Range: 0-1000 NTU, Accuracy: ±5%
            </p>
          </div>

          <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 w-fit mb-4">
              <Thermometer className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Temperature Sensor</h3>
            <p className="text-sm text-muted-foreground">
              DS18B20 waterproof sensor for accurate temperature readings. Range: -55°C to 125°C, Accuracy: ±0.5°C
            </p>
          </div>
        </div>
      </section>

      {/* Water Quality Standards */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Water Quality Standards</h2>
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold">Parameter</th>
                  <th className="text-left p-4 font-semibold">Safe Range</th>
                  <th className="text-left p-4 font-semibold">WHO Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-4">pH Level</td>
                  <td className="p-4">6.5 - 8.5</td>
                  <td className="p-4">6.5 - 8.5</td>
                </tr>
                <tr>
                  <td className="p-4">TDS (ppm)</td>
                  <td className="p-4">0 - 500</td>
                  <td className="p-4">{"<"} 600</td>
                </tr>
                <tr>
                  <td className="p-4">Turbidity (NTU)</td>
                  <td className="p-4">0 - 5</td>
                  <td className="p-4">{"<"} 4</td>
                </tr>
                <tr>
                  <td className="p-4">Temperature (°C)</td>
                  <td className="p-4">10 - 30</td>
                  <td className="p-4">Ambient</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold mb-8 text-center">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="mx-auto p-4 rounded-full bg-primary/10 text-primary w-fit mb-4">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="font-semibold mb-2">Real-Time Monitoring</h3>
            <p className="text-sm text-muted-foreground">
              Continuous sensor readings with 5-second refresh intervals for up-to-date water quality data.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="mx-auto p-4 rounded-full bg-primary/10 text-primary w-fit mb-4">
              <Cpu className="h-8 w-8" />
            </div>
            <h3 className="font-semibold mb-2">ML-Powered Predictions</h3>
            <p className="text-sm text-muted-foreground">
              Machine learning algorithms analyze sensor data to predict water safety with high accuracy.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="mx-auto p-4 rounded-full bg-primary/10 text-primary w-fit mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="font-semibold mb-2">Safety Alerts</h3>
            <p className="text-sm text-muted-foreground">
              Visual color-coded indicators and clear warnings when water quality falls below safe thresholds.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
