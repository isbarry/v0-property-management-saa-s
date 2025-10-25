"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Reservation, Property, MaintenanceRequest } from "@/lib/types/database"

interface RecentActivityProps {
  reservations: Reservation[]
  properties: Property[]
  maintenanceRequests: MaintenanceRequest[]
}

export function RecentActivity({ reservations, properties, maintenanceRequests }: RecentActivityProps) {
  const activities = [
    ...reservations.map((res) => ({
      id: `res-${res.id}`,
      type: "reservation" as const,
      action: res.status === "cancelled" ? "Reservation Cancelled" : "New Reservation",
      propertyName: properties.find((p) => p.id === res.property_id)?.name || "Unknown",
      details: res.guest_name,
      timestamp: res.created_at,
      status: res.status,
    })),
    ...maintenanceRequests.map((req) => ({
      id: `maint-${req.id}`,
      type: "maintenance" as const,
      action: req.status === "completed" ? "Maintenance Completed" : "Maintenance Request",
      propertyName: properties.find((p) => p.id === req.property_id)?.name || "Unknown",
      details: req.title,
      timestamp: req.created_at,
      status: req.status,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "reservation":
        return "📅"
      case "maintenance":
        return "🔧"
      default:
        return "📝"
    }
  }

  const getStatusBadge = (activity: (typeof activities)[0]) => {
    if (activity.type === "reservation") {
      const variant =
        activity.status === "confirmed" ? "default" : activity.status === "cancelled" ? "destructive" : "secondary"
      return (
        <Badge variant={variant} className="text-xs">
          {activity.status}
        </Badge>
      )
    } else if (activity.type === "maintenance") {
      const variant = activity.status === "completed" ? "default" : activity.status === "open" ? "secondary" : "outline"
      return (
        <Badge variant={variant} className="text-xs">
          {activity.status}
        </Badge>
      )
    }
    return null
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="font-sans text-lg font-semibold text-foreground">Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Latest updates across your properties</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <span className="text-2xl">{getActivityIcon(activity.type)}</span>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground">{activity.action}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.propertyName}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.details}</p>
                <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
              {getStatusBadge(activity)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
