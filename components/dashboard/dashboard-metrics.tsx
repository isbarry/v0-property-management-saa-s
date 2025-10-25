import { Card, CardContent } from "@/components/ui/card"
import { Building2, Home, TrendingUp } from "lucide-react"
import type { DashboardMetrics as DashboardMetricsType } from "@/lib/types"

interface DashboardMetricsProps {
  metrics: DashboardMetricsType
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const metricCards = [
    {
      label: "Total Properties",
      value: metrics.totalProperties,
      icon: Building2,
      color: "text-primary",
    },
    {
      label: "Occupied",
      value: metrics.occupied,
      icon: Home,
      color: "text-success",
    },
    {
      label: "Vacant",
      value: metrics.vacant,
      icon: Home,
      color: "text-muted-foreground",
    },
    {
      label: "YtD Realized Revenue",
      value: `GMD ${metrics.ytdRealizedRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-chart-2",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {metricCards.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.label} className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="font-sans text-2xl font-bold text-foreground">{metric.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
