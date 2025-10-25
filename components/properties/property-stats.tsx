import { Card, CardContent } from "@/components/ui/card"
import { Building2, Home, Wrench } from "lucide-react"
import type { Property, PropertyPerformance } from "@/lib/types"

interface PropertyStatsProps {
  properties: Property[]
  performance: Record<string, PropertyPerformance>
}

export function PropertyStats({ properties, performance }: PropertyStatsProps) {
  const totalProperties = properties.length
  const occupiedCount = properties.filter((p) => p.status === "occupied").length
  const vacantCount = properties.filter((p) => p.status === "vacant").length
  const maintenanceCount = properties.filter((p) => p.status === "maintenance").length

  const totalRevenue = Object.values(performance).reduce((sum, p) => sum + p.lifetimeRevenue, 0)
  const avgOccupancy = Object.values(performance).reduce((sum, p) => sum + p.averageOccupancy, 0) / totalProperties

  const stats = [
    {
      label: "Total Properties",
      value: totalProperties,
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Occupied",
      value: occupiedCount,
      icon: Home,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Vacant",
      value: vacantCount,
      icon: Home,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Maintenance",
      value: maintenanceCount,
      icon: Wrench,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`rounded-full p-3 ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
