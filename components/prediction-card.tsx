import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface PredictionCardProps {
  prediction: "SAFE" | "UNSAFE" | "UNKNOWN"
  confidence?: number
}

export function PredictionCard({ prediction, confidence }: PredictionCardProps) {
  const isSafe = prediction === "SAFE"
  const isUnknown = prediction === "UNKNOWN"

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-8 text-center transition-all",
        isSafe
          ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30"
          : isUnknown
            ? "border-muted-foreground/30 bg-gradient-to-br from-muted to-muted/50"
            : "border-red-500 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30",
      )}
    >
      <div
        className={cn(
          "mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4",
          isSafe ? "bg-green-500" : isUnknown ? "bg-muted-foreground/50" : "bg-red-500",
        )}
      >
        {isSafe ? (
          <CheckCircle className="h-10 w-10 text-white" />
        ) : isUnknown ? (
          <AlertCircle className="h-10 w-10 text-white" />
        ) : (
          <XCircle className="h-10 w-10 text-white" />
        )}
      </div>
      <h2
        className={cn(
          "text-2xl font-bold mb-2",
          isSafe
            ? "text-green-700 dark:text-green-400"
            : isUnknown
              ? "text-muted-foreground"
              : "text-red-700 dark:text-red-400",
        )}
      >
        {isSafe ? "SAFE TO DRINK" : isUnknown ? "AWAITING DATA" : "UNSAFE"}
      </h2>
      <p
        className={cn(
          "text-sm",
          isSafe
            ? "text-green-600 dark:text-green-500"
            : isUnknown
              ? "text-muted-foreground"
              : "text-red-600 dark:text-red-500",
        )}
      >
        {isSafe
          ? "Water quality meets all safety standards"
          : isUnknown
            ? "Waiting for sensor data..."
            : "Water does not meet safety requirements"}
      </p>
      {confidence !== undefined && (
        <div className="mt-4 pt-4 border-t border-current/20">
          <span className="text-sm font-medium">ML Confidence: {confidence}%</span>
        </div>
      )}
    </div>
  )
}
