import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface SensorCardProps {
  title: string
  value: number | string
  unit: string
  icon: ReactNode
  status: "safe" | "warning" | "danger" | "neutral"
  range?: string
}

export function SensorCard({ title, value, unit, icon, status, range }: SensorCardProps) {
  const statusColors = {
    safe: "border-green-500/50 bg-green-50 dark:bg-green-950/30",
    warning: "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30",
    danger: "border-red-500/50 bg-red-50 dark:bg-red-950/30",
    neutral: "border-border bg-card",
  }

  const statusTextColors = {
    safe: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-red-600 dark:text-red-400",
    neutral: "text-foreground",
  }

  return (
    <div className={cn("rounded-xl border-2 p-6 transition-all hover:shadow-lg", statusColors[status])}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-primary/10 text-primary">{icon}</div>
        {range && <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{range}</span>}
      </div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-3xl font-bold", statusTextColors[status])}>{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}
