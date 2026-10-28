import { Droplets, Flame, Filter, Sun, FlaskConical, AlertTriangle, CheckCircle, Clock } from "lucide-react"

const cleaningMethods = [
  {
    title: "Boiling",
    icon: Flame,
    difficulty: "Easy",
    time: "10-15 minutes",
    effectiveness: "High",
    description: "The simplest and most effective method to kill pathogens in water.",
    steps: [
      "Bring water to a rolling boil",
      "Maintain boiling for at least 1 minute (3 minutes at high altitudes)",
      "Let the water cool naturally",
      "Store in clean, covered containers",
      "Boiled water may taste flat - pour between containers to add oxygen",
    ],
  },
  {
    title: "Solar Disinfection (SODIS)",
    icon: Sun,
    difficulty: "Easy",
    time: "6-48 hours",
    effectiveness: "Moderate",
    description: "Uses UV radiation from sunlight to kill microorganisms.",
    steps: [
      "Use clear PET plastic bottles (1-2 liters)",
      "Fill bottles with clear water (pre-filter if turbid)",
      "Place bottles on a reflective surface in direct sunlight",
      "Leave for 6 hours in full sun or 2 days if cloudy",
      "Store treated water in the same bottles",
    ],
  },
  {
    title: "DIY Charcoal Filter",
    icon: Filter,
    difficulty: "Moderate",
    time: "30 minutes to build",
    effectiveness: "Moderate",
    description: "A homemade filter using natural materials to remove particles and some contaminants.",
    steps: [
      "Cut a plastic bottle in half",
      "Layer materials from bottom: cotton/cloth, activated charcoal, sand, gravel",
      "Secure cotton at the bottle neck opening",
      "Pour water through the filter slowly",
      "Collect filtered water in a clean container",
      "Note: Still requires boiling for pathogen removal",
    ],
  },
  {
    title: "Chemical Disinfection",
    icon: FlaskConical,
    difficulty: "Easy",
    time: "30 minutes",
    effectiveness: "High",
    description: "Uses chlorine or iodine to kill bacteria and viruses in water.",
    steps: [
      "Use unscented household bleach (5-6% sodium hypochlorite)",
      "Add 2 drops per liter of clear water (4 drops if cloudy)",
      "Mix thoroughly and let stand for 30 minutes",
      "Water should have slight chlorine smell",
      "If no smell, repeat dosage and wait another 15 minutes",
    ],
  },
]

const emergencyTips = [
  "Never drink water from unknown sources without treatment",
  "If unsure about water quality, treat it as unsafe",
  "Store treated water in clean, food-grade containers",
  "Pre-filter cloudy water through cloth before other treatments",
  "Combine multiple methods for best results (e.g., filter + boil)",
]

export default function CleaningGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
          <Droplets className="h-4 w-4" />
          DIY Water Treatment
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Water Cleaning Guide</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Learn effective methods to purify water at home using simple techniques and readily available materials.
        </p>
      </div>

      {/* Warning Banner */}
      <div className="mb-12 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 flex items-start gap-4">
        <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Important Safety Notice</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            These methods are for emergency situations and basic water treatment. They may not remove all chemical
            contaminants. For regular use, invest in proper water filtration systems and regular testing.
          </p>
        </div>
      </div>

      {/* Cleaning Methods */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8">Purification Methods</h2>
        <div className="space-y-6">
          {cleaningMethods.map((method, index) => (
            <div key={index} className="bg-card rounded-xl border overflow-hidden">
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <method.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{method.title}</h3>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-muted text-sm">{method.difficulty}</span>
                    <span className="px-3 py-1 rounded-full bg-muted text-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {method.time}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        method.effectiveness === "High"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      }`}
                    >
                      {method.effectiveness} Effectiveness
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="font-medium mb-3">Step-by-Step Instructions:</h4>
                  <ol className="space-y-2">
                    {method.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                          {stepIndex + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Emergency Tips */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8">Emergency Water Treatment Tips</h2>
        <div className="bg-card rounded-xl border p-6">
          <ul className="space-y-3">
            {emergencyTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Water Quality Comparison */}
      <section>
        <h2 className="text-2xl font-bold mb-8">Treatment Effectiveness Comparison</h2>
        <div className="bg-card rounded-xl border overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-semibold">Method</th>
                <th className="text-left p-4 font-semibold">Bacteria</th>
                <th className="text-left p-4 font-semibold">Viruses</th>
                <th className="text-left p-4 font-semibold">Parasites</th>
                <th className="text-left p-4 font-semibold">Chemicals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-4 font-medium">Boiling</td>
                <td className="p-4 text-green-600 dark:text-green-400">✓ Effective</td>
                <td className="p-4 text-green-600 dark:text-green-400">✓ Effective</td>
                <td className="p-4 text-green-600 dark:text-green-400">✓ Effective</td>
                <td className="p-4 text-red-600 dark:text-red-400">✗ Not effective</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">SODIS</td>
                <td className="p-4 text-green-600 dark:text-green-400">✓ Effective</td>
                <td className="p-4 text-yellow-600 dark:text-yellow-400">~ Partial</td>
                <td className="p-4 text-yellow-600 dark:text-yellow-400">~ Partial</td>
                <td className="p-4 text-red-600 dark:text-red-400">✗ Not effective</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Charcoal Filter</td>
                <td className="p-4 text-yellow-600 dark:text-yellow-400">~ Partial</td>
                <td className="p-4 text-red-600 dark:text-red-400">✗ Not effective</td>
                <td className="p-4 text-yellow-600 dark:text-yellow-400">~ Partial</td>
                <td className="p-4 text-green-600 dark:text-green-400">✓ Reduces</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Chlorine</td>
                <td className="p-4 text-green-600 dark:text-green-400">✓ Effective</td>
                <td className="p-4 text-green-600 dark:text-green-400">✓ Effective</td>
                <td className="p-4 text-yellow-600 dark:text-yellow-400">~ Variable</td>
                <td className="p-4 text-red-600 dark:text-red-400">✗ Not effective</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
